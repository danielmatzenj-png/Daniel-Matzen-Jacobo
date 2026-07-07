import { MELODY_NOTES, BASS_NOTES } from './audio/synthEngine.js';

const DRUM_DEFS = [
  { id: 'kick', label: 'Kick', vol: 0.9 },
  { id: 'snare', label: 'Snare', vol: 0.8 },
  { id: 'hatC', label: 'Hi-Hat cerrado', vol: 0.65 },
  { id: 'hatO', label: 'Hi-Hat abierto', vol: 0.6 },
  { id: 'clap', label: 'Clap', vol: 0.75 },
  { id: 'tom', label: 'Tom', vol: 0.8 },
];

export const STEP_COUNT = 16;

export function createInitialState() {
  return {
    bpm: 96,
    stepCount: STEP_COUNT,
    drumTracks: DRUM_DEFS.map((def) => ({
      id: def.id,
      label: def.label,
      pattern: new Array(STEP_COUNT).fill(false),
      vol: def.vol,
      pan: 0,
      mute: false,
      solo: false,
    })),
    synthTracks: [
      {
        id: 'melody',
        label: 'Melodía',
        type: 'notes',
        waveform: 'sawtooth',
        notes: MELODY_NOTES,
        grid: {},
        vol: 0.6,
        pan: 0,
        mute: false,
        solo: false,
      },
      {
        id: 'bass',
        label: 'Bajo',
        type: 'notes',
        waveform: 'square',
        notes: BASS_NOTES,
        grid: {},
        vol: 0.7,
        pan: 0,
        mute: false,
        solo: false,
      },
      {
        id: 'chords',
        label: 'Acordes',
        type: 'chords',
        waveform: 'sawtooth',
        grid: {},
        vol: 0.5,
        pan: 0,
        mute: false,
        solo: false,
      },
    ],
    master: {
      volume: 0.8,
      reverbMix: 0.2,
      delayMix: 0.15,
      filterCutoff: 1.0,
    },
    // Tonalidad: cuando scaleLock está activo, el piano roll de melodía y
    // bajo solo permite notas de esta escala, y la pista de Acordes usa las
    // 7 tríadas diatónicas de esta tonalidad — así todo lo que se programe
    // encaja armónicamente por construcción.
    key: { root: 'C', scale: 'major' },
    scaleLock: true,
  };
}

export function allTracks(state) {
  return [...state.drumTracks, ...state.synthTracks];
}

export function findTrack(state, id) {
  return allTracks(state).find((t) => t.id === id);
}
