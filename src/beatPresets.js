// Patrones de batería listos para usar en el asistente simple: el usuario
// elige un estilo por su nombre, sin tener que programar la grilla a mano.
// Cada `pattern[instrumento]` lista los pasos (0-15) donde suena ese golpe.
export const BEAT_PRESETS = [
  {
    id: 'pop',
    label: 'Pop',
    bpm: 112,
    pattern: {
      kick: [0, 8],
      snare: [4, 12],
      hatC: [0, 2, 4, 6, 8, 10, 12, 14],
      hatO: [14],
      clap: [],
      tom: [],
    },
  },
  {
    id: 'lofi',
    label: 'Lo-fi',
    bpm: 78,
    pattern: {
      kick: [0, 10],
      snare: [4, 12],
      hatC: [2, 6, 10, 14],
      hatO: [],
      clap: [],
      tom: [7],
    },
  },
  {
    id: 'dembow',
    label: 'Reggaetón',
    bpm: 92,
    pattern: {
      kick: [0, 6, 8, 14],
      snare: [],
      hatC: [0, 2, 4, 6, 8, 10, 12, 14],
      hatO: [],
      clap: [3, 7, 11, 15],
      tom: [],
    },
  },
  {
    id: 'trap',
    label: 'Trap',
    bpm: 140,
    pattern: {
      kick: [0, 7, 10],
      snare: [4, 12],
      hatC: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      hatO: [15],
      clap: [],
      tom: [],
    },
  },
];
