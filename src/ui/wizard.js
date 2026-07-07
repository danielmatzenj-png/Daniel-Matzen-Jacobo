import { getDiatonicChordDegrees, suggestNextChords } from '../audio/theory.js';
import { BEAT_PRESETS } from '../beatPresets.js';

const PROGRESSION_LENGTH = 4;
const NOTE_BUTTON_OCTAVE = 4;

function addHeader(container, title, hint) {
  const h = document.createElement('h2');
  h.textContent = title;
  container.appendChild(h);
  if (hint) {
    const p = document.createElement('p');
    p.className = 'wizard-hint';
    p.textContent = hint;
    container.appendChild(p);
  }
}

function addBackButton(container, handlers) {
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'wizard-back';
  back.textContent = '← Atrás';
  back.addEventListener('click', () => handlers.onStepBack());
  container.appendChild(back);
}

function progressionSummary(state) {
  const degrees = getDiatonicChordDegrees(state.key.root, state.key.scale);
  return state.progression.map((d) => degrees[d].symbol).join(' – ');
}

// Paso 1: tocar una nota. Cada nota es la tónica de uno de los 7 acordes
// diatónicos, así que elegirla sugiere (y confirma, para minimizar clics)
// el primer acorde de la canción.
function renderNoteStep(container, state, handlers) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wizard-step';
  addHeader(wrapper, 'Tocá una nota', 'Elegí cualquier nota para empezar: armamos el primer acorde de tu canción con ella.');

  const noteGrid = document.createElement('div');
  noteGrid.className = 'note-buttons';
  const degrees = getDiatonicChordDegrees(state.key.root, state.key.scale, NOTE_BUTTON_OCTAVE);
  degrees.forEach((chord, degreeIndex) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'note-button';
    btn.textContent = chord.noteNames[0].slice(0, -1);
    btn.addEventListener('click', () => handlers.onPickFirstChord(degreeIndex));
    noteGrid.appendChild(btn);
  });
  wrapper.appendChild(noteGrid);
  container.appendChild(wrapper);
}

// Pasos 2-4: elegir uno de los 3 acordes que mejor encajan después del
// último elegido.
function renderChordStep(container, state, handlers) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wizard-step';
  const stepNumber = state.progression.length + 1;
  addHeader(
    wrapper,
    `Acorde ${stepNumber} de ${PROGRESSION_LENGTH}`,
    'Elegí el siguiente: estos son los que mejor encajan después del anterior.'
  );

  const soFar = document.createElement('p');
  soFar.className = 'progression-so-far';
  soFar.textContent = 'Hasta ahora: ' + progressionSummary(state);
  wrapper.appendChild(soFar);

  const options = document.createElement('div');
  options.className = 'chord-options';
  const lastDegree = state.progression[state.progression.length - 1];
  const suggestions = suggestNextChords(state.key.root, state.key.scale, lastDegree, 3);
  for (const suggestion of suggestions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chord-option';
    const roman = document.createElement('span');
    roman.className = 'roman';
    roman.textContent = suggestion.roman;
    const symbol = document.createElement('span');
    symbol.className = 'symbol';
    symbol.textContent = suggestion.symbol;
    btn.append(roman, symbol);
    btn.addEventListener('click', () => handlers.onPickNextChord(suggestion.degreeIndex));
    options.appendChild(btn);
  }
  wrapper.appendChild(options);
  addBackButton(wrapper, handlers);
  container.appendChild(wrapper);
}

// Paso 5: elegir un estilo de ritmo; al elegirlo se genera toda la canción
// (batería + bajo + melodía + acordes) automáticamente.
function renderBeatStep(container, state, handlers) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wizard-step';
  addHeader(wrapper, 'Elegí un ritmo', 'Con tu progresión armamos el bajo y la melodía. Sumale una base.');

  const soFar = document.createElement('p');
  soFar.className = 'progression-so-far';
  soFar.textContent = 'Tu progresión: ' + progressionSummary(state);
  wrapper.appendChild(soFar);

  const options = document.createElement('div');
  options.className = 'beat-options';
  for (const preset of BEAT_PRESETS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'beat-option';
    btn.textContent = preset.label;
    btn.addEventListener('click', () => handlers.onPickBeat(preset.id));
    options.appendChild(btn);
  }
  wrapper.appendChild(options);
  addBackButton(wrapper, handlers);
  container.appendChild(wrapper);
}

// Paso final: canción generada, lista para reproducir (con el transport de
// arriba) y descargar.
function renderReadyStep(container, state, handlers) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wizard-step wizard-ready';
  addHeader(wrapper, '¡Tu canción está lista!', 'Le podés dar play arriba. Cuando te guste, descargala.');

  const soFar = document.createElement('p');
  soFar.className = 'progression-so-far';
  soFar.textContent = 'Progresión: ' + progressionSummary(state);
  wrapper.appendChild(soFar);

  const volLabel = document.createElement('label');
  volLabel.className = 'wizard-volume';
  volLabel.textContent = 'Volumen';
  const volInput = document.createElement('input');
  volInput.type = 'range';
  volInput.min = '0';
  volInput.max = '100';
  volInput.value = String(Math.round(state.master.volume * 100));
  volInput.addEventListener('input', () => {
    state.master.volume = Number(volInput.value) / 100;
    handlers.onMasterChange();
  });
  volLabel.appendChild(volInput);
  wrapper.appendChild(volLabel);

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'primary-btn download-btn';
  downloadBtn.textContent = '⬇ Descargar canción';
  downloadBtn.addEventListener('click', () => handlers.onDownload());
  wrapper.appendChild(downloadBtn);

  const restartBtn = document.createElement('button');
  restartBtn.type = 'button';
  restartBtn.className = 'wizard-restart';
  restartBtn.textContent = 'Empezar una canción nueva';
  restartBtn.addEventListener('click', () => handlers.onRestart());
  wrapper.appendChild(restartBtn);

  container.appendChild(wrapper);
}

export function renderWizard(container, state, handlers) {
  container.innerHTML = '';
  const progression = state.progression;

  if (progression.length === 0) {
    renderNoteStep(container, state, handlers);
  } else if (progression.length < PROGRESSION_LENGTH) {
    renderChordStep(container, state, handlers);
  } else if (!state.beatPresetId) {
    renderBeatStep(container, state, handlers);
  } else {
    renderReadyStep(container, state, handlers);
  }
}
