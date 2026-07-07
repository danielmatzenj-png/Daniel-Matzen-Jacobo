import './style.css';
import { createInitialState, allTracks, findTrack } from './state.js';
import { getAudioContext, getMasterChain, getTrackChannel, updateMasterParams, updateTrackParams } from './audio/context.js';
import { DRUM_PLAYERS } from './audio/drumSynths.js';
import { playSynthNote } from './audio/synthEngine.js';
import { scheduleStepSounds } from './audio/playback.js';
import { Scheduler } from './audio/scheduler.js';
import { isNoteInScale, getDiatonicChordDegrees } from './audio/theory.js';
import { renderTransport, setupKeyboardShortcuts } from './ui/transport.js';
import { renderDrumRack } from './ui/drumRack.js';
import { renderSynthRack } from './ui/synthRack.js';
import { renderMixer } from './ui/mixer.js';
import { renderKeyPanel } from './ui/keyPanel.js';
import { renderWizard } from './ui/wizard.js';
import { saveProject, loadProject, listProjects, deleteProject } from './storage.js';
import { exportToWav } from './wavExport.js';
import { generateSong } from './audio/songGenerator.js';
import { BEAT_PRESETS } from './beatPresets.js';

const state = createInitialState();

// Referencias directas a las pistas de synth, para no tener que buscarlas
// cada vez. `replaceState` (carga de proyecto / "Nuevo") reemplaza
// `state.synthTracks` por un array nuevo, así que estas variables se
// vuelven a sincronizar ahí mismo con `syncTrackRefs()`.
let melodyTrack;
let bassTrack;
let chordsTrack;
function syncTrackRefs() {
  melodyTrack = state.synthTracks.find((t) => t.id === 'melody');
  bassTrack = state.synthTracks.find((t) => t.id === 'bass');
  chordsTrack = state.synthTracks.find((t) => t.id === 'chords');
}
syncTrackRefs();

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <h1>Núcleo</h1>
    <div id="transport"></div>
  </header>
  <nav class="mode-tabs">
    <button type="button" class="mode-tab" data-mode="simple">Simple</button>
    <button type="button" class="mode-tab" data-mode="advanced">Avanzado</button>
  </nav>
  <main id="simple-view" class="simple-view"></main>
  <main id="advanced-view" class="layout">
    <section class="panel">
      <h2>Tonalidad</h2>
      <div id="key-panel"></div>
    </section>
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
      <h2>Acordes</h2>
      <div id="synth-rack-chords"></div>
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

const simpleViewContainer = document.querySelector('#simple-view');
const advancedViewContainer = document.querySelector('#advanced-view');
const transportContainer = document.querySelector('#transport');
const drumContainer = document.querySelector('#drum-rack');
const melodyContainer = document.querySelector('#synth-rack-melody');
const bassContainer = document.querySelector('#synth-rack-bass');
const chordsContainer = document.querySelector('#synth-rack-chords');
const mixerContainer = document.querySelector('#mixer');
const keyPanelContainer = document.querySelector('#key-panel');

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

// Filas visibles del piano roll de una pista de notas (melodía/bajo): con el
// bloqueo de escala activo, solo las notas de la tonalidad elegida.
function computeNoteRows(track) {
  const notes = state.scaleLock
    ? track.notes.filter((n) => isNoteInScale(n, state.key.root, state.key.scale))
    : track.notes;
  return notes.map((n) => ({ key: n, label: n }));
}

// Filas de la pista de Acordes: las 7 tríadas diatónicas de la tonalidad
// actual (cambian de contenido si cambiás la tónica/escala, pero el patrón
// programado por grado se mantiene).
function computeChordRows() {
  return getDiatonicChordDegrees(state.key.root, state.key.scale).map((chord, index) => ({
    key: String(index),
    label: `${chord.roman} ${chord.symbol}`,
  }));
}

// Al cambiar de tonalidad o desactivar el bloqueo, se puede haber ocultado
// alguna nota que ya estaba programada en melodía/bajo. La borramos del
// estado (no solo de la vista) para que no quede una nota fantasma sonando
// si se vuelve a activar el bloqueo más adelante.
function pruneOutOfScaleNotes() {
  for (const track of [melodyTrack, bassTrack]) {
    const validKeys = new Set(computeNoteRows(track).map((row) => row.key));
    for (const gridKey of Object.keys(track.grid)) {
      const noteName = gridKey.split('_')[0];
      if (!validKeys.has(noteName)) delete track.grid[gridKey];
    }
  }
}

let transportHandle;
let drumRackHandle;
let melodyHandle;
let bassHandle;
let chordsHandle;

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

function previewNote(trackId, noteName) {
  const ctx = getAudioContext();
  const track = findTrack(state, trackId);
  playSynthNote(ctx, channels.get(trackId).input, noteName, ctx.currentTime, 0.35, track.waveform);
}

function previewChord(trackId, degreeIndexStr) {
  const ctx = getAudioContext();
  const track = findTrack(state, trackId);
  const chord = getDiatonicChordDegrees(state.key.root, state.key.scale)[Number(degreeIndexStr)];
  for (const noteName of chord.noteNames) {
    playSynthNote(ctx, channels.get(trackId).input, noteName, ctx.currentTime, 0.5, track.waveform);
  }
}

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

const keyPanelHandlers = {
  onKeyChange: () => {
    pruneOutOfScaleNotes();
    rerenderAll();
  },
};

function rerenderAll() {
  renderKeyPanel(keyPanelContainer, state, keyPanelHandlers);
  transportHandle = renderTransport(transportContainer, state, transportHandlers);
  drumRackHandle = renderDrumRack(drumContainer, state, drumHandlers);
  melodyHandle = renderSynthRack(melodyContainer, melodyTrack, computeNoteRows(melodyTrack), state, {
    singleActivePerColumn: false,
    onPreviewRow: (rowKey) => previewNote(melodyTrack.id, rowKey),
  });
  bassHandle = renderSynthRack(bassContainer, bassTrack, computeNoteRows(bassTrack), state, {
    singleActivePerColumn: false,
    onPreviewRow: (rowKey) => previewNote(bassTrack.id, rowKey),
  });
  chordsHandle = renderSynthRack(chordsContainer, chordsTrack, computeChordRows(), state, {
    singleActivePerColumn: true,
    onPreviewRow: (rowKey) => previewChord(chordsTrack.id, rowKey),
  });
  renderMixer(mixerContainer, state, mixerHandlers);
}

// --- Modo simple: asistente guiado (nota -> acordes -> ritmo -> canción) ---
function rerenderWizard() {
  renderWizard(simpleViewContainer, state, wizardHandlers);
}

const wizardHandlers = {
  onPickFirstChord: (degreeIndex) => {
    previewChord(chordsTrack.id, String(degreeIndex));
    state.progression = [degreeIndex];
    rerenderWizard();
  },
  onPickNextChord: (degreeIndex) => {
    previewChord(chordsTrack.id, String(degreeIndex));
    state.progression = [...state.progression, degreeIndex];
    rerenderWizard();
  },
  onPickBeat: (presetId) => {
    const preset = BEAT_PRESETS.find((p) => p.id === presetId);
    generateSong(state, { progression: state.progression, beatPreset: preset });
    rerenderWizard();
    rerenderAll();
  },
  onStepBack: () => {
    if (state.beatPresetId) {
      state.beatPresetId = null;
    } else if (state.progression.length > 0) {
      state.progression = state.progression.slice(0, -1);
    }
    rerenderWizard();
  },
  onDownload: async () => {
    await exportToWav(state, { bars: 1, filename: 'mi-cancion.wav' });
  },
  onRestart: () => {
    scheduler.stop();
    transportHandle.setPlaying(false);
    state.progression = [];
    state.beatPresetId = null;
    rerenderWizard();
  },
  onMasterChange: () => {
    updateMasterParams(getMasterChain(), state.master);
  },
};

function setMode(mode) {
  state.mode = mode;
  simpleViewContainer.style.display = mode === 'simple' ? '' : 'none';
  advancedViewContainer.style.display = mode === 'advanced' ? '' : 'none';
  document.querySelectorAll('.mode-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

document.querySelectorAll('.mode-tab').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

const scheduler = new Scheduler({
  getState: () => state,
  onScheduleStep: (stepIndex, time) => scheduleStepSounds(getAudioContext(), channels, state, stepIndex, time),
  onStepVisual: (stepIndex) => {
    drumRackHandle.setPlayhead(stepIndex);
    melodyHandle.setPlayhead(stepIndex);
    bassHandle.setPlayhead(stepIndex);
    chordsHandle.setPlayhead(stepIndex);
  },
});

setupKeyboardShortcuts({ onTogglePlay: () => transportHandlers.onTogglePlay() });

rerenderAll();
rerenderWizard();
setMode(state.mode);

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

// Los proyectos guardados antes de agregar la pista de Acordes no la tienen
// todavía (ni el campo `key`/`scaleLock`); se completan con los valores por
// defecto para que cargarlos no rompa nada.
function migrateLoadedState(loaded) {
  if (!loaded.key) loaded.key = { root: 'C', scale: 'major' };
  if (loaded.scaleLock === undefined) loaded.scaleLock = true;
  if (!loaded.synthTracks.some((t) => t.id === 'chords')) {
    loaded.synthTracks.push(createInitialState().synthTracks.find((t) => t.id === 'chords'));
  }
  for (const track of loaded.synthTracks) {
    if (!track.type) track.type = track.id === 'chords' ? 'chords' : 'notes';
  }
  if (!loaded.mode) loaded.mode = 'advanced';
  if (!loaded.progression) loaded.progression = [];
  if (loaded.beatPresetId === undefined) loaded.beatPresetId = null;
  return loaded;
}

function replaceState(newState) {
  migrateLoadedState(newState);
  state.bpm = newState.bpm;
  state.stepCount = newState.stepCount;
  state.drumTracks = newState.drumTracks;
  state.synthTracks = newState.synthTracks;
  state.master = newState.master;
  state.key = newState.key;
  state.scaleLock = newState.scaleLock;
  state.progression = newState.progression;
  state.beatPresetId = newState.beatPresetId;
  syncTrackRefs();
  syncAudioFromState();
  rerenderAll();
  rerenderWizard();
  setMode(newState.mode);
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
