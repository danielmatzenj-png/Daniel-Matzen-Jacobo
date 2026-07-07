import './style.css';
import { createInitialState, allTracks, findTrack } from './state.js';
import { getAudioContext, getMasterChain, getTrackChannel, updateMasterParams, updateTrackParams } from './audio/context.js';
import { DRUM_PLAYERS } from './audio/drumSynths.js';
import { playSynthNote } from './audio/synthEngine.js';
import { scheduleStepSounds } from './audio/playback.js';
import { Scheduler } from './audio/scheduler.js';
import { renderTransport, setupKeyboardShortcuts } from './ui/transport.js';
import { renderDrumRack } from './ui/drumRack.js';
import { renderSynthRack } from './ui/synthRack.js';
import { renderMixer } from './ui/mixer.js';
import { saveProject, loadProject, listProjects, deleteProject } from './storage.js';
import { exportToWav } from './wavExport.js';

const state = createInitialState();

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <h1>Núcleo</h1>
    <div id="transport"></div>
  </header>
  <main class="layout">
    <section class="panel">
      <h2>Batería</h2>
      <div id="drum-rack"></div>
    </section>
    <section class="panel">
      <h2>Melodía</h2>
      <div id="synth-rack-melody"></div>
    </section>
    <section class="panel">
      <h2>Bajo</h2>
      <div id="synth-rack-bass"></div>
    </section>
    <section class="panel">
      <h2>Mezclador</h2>
      <div id="mixer"></div>
    </section>
    <section class="panel">
      <h2>Proyecto</h2>
      <div class="project-panel">
        <input type="text" id="project-name" placeholder="nombre del proyecto" value="mi-beat" />
        <button type="button" id="save-btn">Guardar</button>
        <select id="project-select"></select>
        <button type="button" id="load-btn">Cargar</button>
        <button type="button" id="delete-btn">Eliminar</button>
        <button type="button" id="new-btn">Nuevo</button>
        <div class="export-row">
          <label>Compases
            <select id="bars-select">
              <option value="1">1</option>
              <option value="4" selected>4</option>
              <option value="8">8</option>
            </select>
          </label>
          <button type="button" id="export-btn">⬇ Exportar WAV</button>
        </div>
        <p id="project-status" class="status"></p>
      </div>
    </section>
  </main>
`;

const transportContainer = document.querySelector('#transport');
const drumContainer = document.querySelector('#drum-rack');
const melodyContainer = document.querySelector('#synth-rack-melody');
const bassContainer = document.querySelector('#synth-rack-bass');
const mixerContainer = document.querySelector('#mixer');

// Un canal (GainNode volumen + StereoPannerNode pan) por cada pista,
// conectado a la cadena master. Se crea una sola vez; solo se actualizan sus
// parámetros cuando cambia el estado.
const channels = new Map();
function ensureAudioGraph() {
  updateMasterParams(getMasterChain(), state.master);
  for (const track of allTracks(state)) {
    const channel = getTrackChannel(track.id);
    updateTrackParams(channel, track, allTracks(state));
    channels.set(track.id, channel);
  }
}
ensureAudioGraph();

function syncAudioFromState() {
  updateMasterParams(getMasterChain(), state.master);
  for (const track of allTracks(state)) {
    updateTrackParams(channels.get(track.id), track, allTracks(state));
  }
}

let transportHandle;
let drumRackHandle;
let melodyHandle;
let bassHandle;

const transportHandlers = {
  onTogglePlay: () => {
    if (scheduler.isRunning()) {
      scheduler.stop();
      transportHandle.setPlaying(false);
    } else {
      const ctx = getAudioContext();
      scheduler.start(ctx);
      transportHandle.setPlaying(true);
    }
  },
};

const drumHandlers = {
  onTrigger: (trackId) => {
    const ctx = getAudioContext();
    DRUM_PLAYERS[trackId](ctx, channels.get(trackId).input, ctx.currentTime);
  },
};

const synthHandlers = {
  onPreviewNote: (trackId, noteName) => {
    const ctx = getAudioContext();
    const track = findTrack(state, trackId);
    playSynthNote(ctx, channels.get(trackId).input, noteName, ctx.currentTime, 0.35, track.waveform);
  },
};

const mixerHandlers = {
  onVolPanChange: (trackId) => {
    updateTrackParams(channels.get(trackId), findTrack(state, trackId), allTracks(state));
  },
  onSoloMuteChange: () => {
    for (const track of allTracks(state)) {
      updateTrackParams(channels.get(track.id), track, allTracks(state));
    }
  },
  onMasterChange: () => {
    updateMasterParams(getMasterChain(), state.master);
  },
};

function rerenderAll() {
  transportHandle = renderTransport(transportContainer, state, transportHandlers);
  drumRackHandle = renderDrumRack(drumContainer, state, drumHandlers);
  melodyHandle = renderSynthRack(melodyContainer, state.synthTracks[0], state, synthHandlers);
  bassHandle = renderSynthRack(bassContainer, state.synthTracks[1], state, synthHandlers);
  renderMixer(mixerContainer, state, mixerHandlers);
}

const scheduler = new Scheduler({
  getState: () => state,
  onScheduleStep: (stepIndex, time) => scheduleStepSounds(getAudioContext(), channels, state, stepIndex, time),
  onStepVisual: (stepIndex) => {
    drumRackHandle.setPlayhead(stepIndex);
    melodyHandle.setPlayhead(stepIndex);
    bassHandle.setPlayhead(stepIndex);
  },
});

setupKeyboardShortcuts({ onTogglePlay: () => transportHandlers.onTogglePlay() });

rerenderAll();

// --- Panel de proyecto: guardar/cargar (localStorage) y exportar a WAV ---
const nameInput = document.querySelector('#project-name');
const selectEl = document.querySelector('#project-select');
const statusEl = document.querySelector('#project-status');
const barsSelect = document.querySelector('#bars-select');

function setStatus(text) {
  statusEl.textContent = text;
  setTimeout(() => {
    if (statusEl.textContent === text) statusEl.textContent = '';
  }, 3000);
}

function refreshProjectList() {
  const names = listProjects();
  selectEl.innerHTML = '';
  for (const name of names) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    selectEl.appendChild(option);
  }
}
refreshProjectList();

function replaceState(newState) {
  state.bpm = newState.bpm;
  state.stepCount = newState.stepCount;
  state.drumTracks = newState.drumTracks;
  state.synthTracks = newState.synthTracks;
  state.master = newState.master;
  syncAudioFromState();
  rerenderAll();
}

document.querySelector('#save-btn').addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) {
    setStatus('Poné un nombre para guardar el proyecto.');
    return;
  }
  saveProject(name, state);
  refreshProjectList();
  setStatus(`Proyecto "${name}" guardado.`);
});

document.querySelector('#load-btn').addEventListener('click', () => {
  const name = selectEl.value;
  if (!name) {
    setStatus('No hay ningún proyecto guardado para cargar.');
    return;
  }
  const loaded = loadProject(name);
  if (!loaded) {
    setStatus(`No se pudo cargar "${name}".`);
    return;
  }
  replaceState(loaded);
  nameInput.value = name;
  setStatus(`Proyecto "${name}" cargado.`);
});

document.querySelector('#delete-btn').addEventListener('click', () => {
  const name = selectEl.value;
  if (!name) return;
  deleteProject(name);
  refreshProjectList();
  setStatus(`Proyecto "${name}" eliminado.`);
});

document.querySelector('#new-btn').addEventListener('click', () => {
  replaceState(createInitialState());
  setStatus('Proyecto nuevo.');
});

document.querySelector('#export-btn').addEventListener('click', async () => {
  const exportBtn = document.querySelector('#export-btn');
  const bars = Number(barsSelect.value);
  exportBtn.disabled = true;
  setStatus('Exportando...');
  try {
    await exportToWav(state, { bars, filename: `${nameInput.value.trim() || 'nucleo-beat'}.wav` });
    setStatus('WAV exportado.');
  } catch (err) {
    console.error(err);
    setStatus('Error al exportar.');
  } finally {
    exportBtn.disabled = false;
  }
});
