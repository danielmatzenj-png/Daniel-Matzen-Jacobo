import { getDiatonicChordDegrees } from './theory.js';

const STEPS_PER_BAR = 16;
// Arpegio simple para la melodía: raíz, tercera, quinta, tercera — un patrón
// prolijo y agradable sin que el usuario tenga que elegir notas.
const MELODY_HIT_STEPS = [0, 4, 8, 12];
const MELODY_CHORD_TONE_INDEXES = [0, 1, 2, 1];

// Convierte una progresión de acordes (grados de escala) + un preset de
// ritmo en un patrón concreto: un compás de batería por cada acorde
// (repitiendo el mismo groove), el bajo y los acordes sostenidos durante
// todo el compás correspondiente, y una melodía en arpegio por encima.
// Reutiliza el mismo modelo de datos (drumTracks[].pattern,
// synthTracks[].grid) que ya sabe reproducir/exportar el resto del motor.
export function generateSong(state, { progression, beatPreset }) {
  const bars = progression.length;
  const stepCount = STEPS_PER_BAR * bars;

  state.stepCount = stepCount;
  state.bpm = beatPreset.bpm;
  state.progression = [...progression];
  state.beatPresetId = beatPreset.id;

  for (const track of state.drumTracks) {
    const presetSteps = beatPreset.pattern[track.id] || [];
    const tiled = new Array(stepCount).fill(false);
    for (let bar = 0; bar < bars; bar++) {
      for (const step of presetSteps) tiled[bar * STEPS_PER_BAR + step] = true;
    }
    track.pattern = tiled;
  }

  const melodyTrack = state.synthTracks.find((t) => t.id === 'melody');
  const bassTrack = state.synthTracks.find((t) => t.id === 'bass');
  const chordsTrack = state.synthTracks.find((t) => t.id === 'chords');
  melodyTrack.grid = {};
  bassTrack.grid = {};
  chordsTrack.grid = {};

  for (let bar = 0; bar < bars; bar++) {
    const degreeIndex = progression[bar];
    const barStart = bar * STEPS_PER_BAR;
    const bassChord = getDiatonicChordDegrees(state.key.root, state.key.scale, 2)[degreeIndex];
    const melodyChord = getDiatonicChordDegrees(state.key.root, state.key.scale, 4)[degreeIndex];

    // Bajo y acordes suenan sostenidos durante todo el compás (el motor de
    // reproducción los toca una sola vez y los sostiene mientras la celda
    // siga activa paso a paso; ver audio/playback.js).
    for (let step = 0; step < STEPS_PER_BAR; step++) {
      bassTrack.grid[`${bassChord.noteNames[0]}_${barStart + step}`] = true;
      chordsTrack.grid[`${degreeIndex}_${barStart + step}`] = true;
    }

    MELODY_HIT_STEPS.forEach((step, i) => {
      const noteName = melodyChord.noteNames[MELODY_CHORD_TONE_INDEXES[i]];
      melodyTrack.grid[`${noteName}_${barStart + step}`] = true;
    });
  }
}
