export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Escalas diatónicas: intervalos en semitonos desde la tónica, y la calidad
// de cada acorde de tres notas (tríada) que se forma al armonizar cada
// grado con la propia escala (esto es lo que garantiza que "suenen bien
// juntos": todos los acordes comparten las mismas siete notas).
export const SCALES = {
  major: {
    label: 'Mayor',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    qualities: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'],
    romans: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
  },
  minor: {
    label: 'Menor (natural)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    qualities: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'],
    romans: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
  },
};

const QUALITY_SUFFIX = { maj: '', min: 'm', dim: '°' };

function pitchClassOf(noteName) {
  const name = noteName.slice(0, -1);
  return CHROMATIC.indexOf(name);
}

// ¿Esta nota (ej. "D#4") pertenece a la escala de `root`/`scaleType`? Se usa
// para filtrar el piano roll cuando el "bloqueo de escala" está activo.
export function isNoteInScale(noteName, root, scaleType) {
  const scale = SCALES[scaleType];
  const rootPc = CHROMATIC.indexOf(root);
  const notePc = pitchClassOf(noteName);
  const relative = (notePc - rootPc + 12) % 12;
  return scale.intervals.includes(relative);
}

// Nombre de nota (con octava) para el grado `degree` de la escala, contando
// desde `root` en `baseOctave`. `degree` puede ser mayor a la cantidad de
// grados de la escala: se envuelve subiendo de octava (para apilar terceras
// y formar tríadas).
function scaleNoteName(root, scaleType, degree, baseOctave) {
  const scale = SCALES[scaleType];
  const rootPc = CHROMATIC.indexOf(root);
  const len = scale.intervals.length;
  const octaveWraps = Math.floor(degree / len);
  const degreeInScale = ((degree % len) + len) % len;
  const semitoneOffset = scale.intervals[degreeInScale];
  const absolutePc = rootPc + semitoneOffset;
  const noteName = CHROMATIC[absolutePc % 12];
  const octave = baseOctave + octaveWraps + Math.floor(absolutePc / 12);
  return `${noteName}${octave}`;
}

// Los 7 acordes diatónicos (tríadas) de una tonalidad, en orden de grado
// (I..vii en mayor, i..VII en menor). Cada tríada se arma apilando terceras
// dentro de la misma escala, así todos encajan entre sí por construcción.
export function getDiatonicChordDegrees(root, scaleType, baseOctave = 3) {
  const scale = SCALES[scaleType];
  const rootPc = CHROMATIC.indexOf(root);
  return scale.intervals.map((semitoneOffset, degree) => {
    const chordRootPc = (rootPc + semitoneOffset) % 12;
    const symbol = CHROMATIC[chordRootPc] + QUALITY_SUFFIX[scale.qualities[degree]];
    return {
      roman: scale.romans[degree],
      quality: scale.qualities[degree],
      symbol,
      noteNames: [
        scaleNoteName(root, scaleType, degree, baseOctave),
        scaleNoteName(root, scaleType, degree + 2, baseOctave),
        scaleNoteName(root, scaleType, degree + 4, baseOctave),
      ],
    };
  });
}

// "Después de este acorde, ¿cuáles suenan bien?" — una tabla simple de
// progresiones habituales (armonía común de pop/clásica), en orden de grado.
// Se usa en el asistente guiado (ui/wizard.js) para sugerir 2-3 acordes
// siguientes sin que el usuario tenga que saber nada de teoría musical.
const NEXT_CHORD_SUGGESTIONS = {
  major: [
    [3, 4, 5], // I    -> IV, V, vi
    [4, 3, 0], // ii   -> V, IV, I
    [5, 3, 1], // iii  -> vi, IV, ii
    [4, 0, 1], // IV   -> V, I, ii
    [0, 5, 3], // V    -> I, vi, IV
    [3, 4, 1], // vi   -> IV, V, ii
    [0, 5, 3], // vii° -> I, vi, IV
  ],
  minor: [
    [5, 6, 3], // i    -> VI, VII, iv
    [4, 0, 5], // ii°  -> v, i, VI
    [6, 5, 3], // III  -> VII, VI, iv
    [0, 4, 6], // iv   -> i, v, VII
    [0, 5, 3], // v    -> i, VI, iv
    [6, 3, 0], // VI   -> VII, iv, i
    [0, 5, 3], // VII  -> i, VI, iv
  ],
};

export function suggestNextChords(root, scaleType, fromDegree, count = 3) {
  const degrees = getDiatonicChordDegrees(root, scaleType);
  const suggestedDegrees = NEXT_CHORD_SUGGESTIONS[scaleType][fromDegree].slice(0, count);
  return suggestedDegrees.map((degreeIndex) => ({ degreeIndex, ...degrees[degreeIndex] }));
}
