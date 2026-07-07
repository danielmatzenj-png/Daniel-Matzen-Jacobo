import { DRUM_PLAYERS } from './drumSynths.js';
import { playSynthNote } from './synthEngine.js';
import { isNoteInScale, getDiatonicChordDegrees } from './theory.js';

// ¿La celda en `keyForStep(stepIndex)` es el INICIO de una racha de celdas
// activas consecutivas (en vez de la continuación de una que ya sonó)? Si
// stepIndex-1 también estaba activa, ya se disparó ahí y no hay que
// retriggerearla ahora (si no, una nota/acorde sostenido en varios pasos
// sonaría como un tartamudeo en vez de un sonido continuo).
function isRunStart(grid, keyForStep, stepIndex) {
  return stepIndex === 0 || !grid[keyForStep(stepIndex - 1)];
}

// Cuántos pasos consecutivos (incluido este) siguen activos a partir de
// stepIndex, para sostener la nota/acorde esa duración en vez de solo un paso.
function runLength(grid, keyForStep, stepIndex, stepCount) {
  let length = 1;
  let s = stepIndex;
  while (s + 1 < stepCount && grid[keyForStep(s + 1)]) {
    length++;
    s++;
  }
  return length;
}

// Dispara todos los sonidos (batería + synths) que correspondan a un paso
// del secuenciador, en el instante `time` de `ctx`. Se usa tanto en vivo
// (scheduler.js) como al exportar a WAV (wavExport.js, con un
// OfflineAudioContext), por eso recibe `channels` (Map id -> nodo de
// entrada) en vez de asumir un contexto en particular.
export function scheduleStepSounds(ctx, channels, state, stepIndex, time) {
  const stepDuration = 60 / state.bpm / 4;

  for (const track of state.drumTracks) {
    if (track.pattern[stepIndex]) {
      const destination = channels.get(track.id).input;
      DRUM_PLAYERS[track.id](ctx, destination, time);
    }
  }

  const chordDegrees = getDiatonicChordDegrees(state.key.root, state.key.scale);

  for (const track of state.synthTracks) {
    const destination = channels.get(track.id).input;

    if (track.type === 'chords') {
      chordDegrees.forEach((chord, degreeIndex) => {
        const keyForStep = (s) => `${degreeIndex}_${s}`;
        if (!track.grid[keyForStep(stepIndex)]) return;
        if (!isRunStart(track.grid, keyForStep, stepIndex)) return;
        const duration = runLength(track.grid, keyForStep, stepIndex, state.stepCount) * stepDuration;
        for (const noteName of chord.noteNames) {
          playSynthNote(ctx, destination, noteName, time, duration, track.waveform);
        }
      });
      continue;
    }

    // Se itera directamente sobre las claves programadas en la grilla (en
    // vez de una lista fija de notas) para no depender del rango visible
    // en el piano roll: una tercera/quinta de un acorde generado por el
    // asistente simple puede caer justo fuera de C4-C5 y aun así debe sonar.
    for (const gridKey of Object.keys(track.grid)) {
      if (!track.grid[gridKey]) continue;
      const sep = gridKey.lastIndexOf('_');
      const noteName = gridKey.slice(0, sep);
      const step = Number(gridKey.slice(sep + 1));
      if (step !== stepIndex) continue;

      // Bloqueo de escala: si está activo, solo suenan las notas que
      // pertenecen a la tonalidad elegida (garantiza que la melodía/bajo
      // encajen con los acordes, incluso si quedó alguna nota "fuera de
      // escala" programada de una sesión anterior).
      if (state.scaleLock && !isNoteInScale(noteName, state.key.root, state.key.scale)) continue;

      const keyForStep = (s) => `${noteName}_${s}`;
      if (!isRunStart(track.grid, keyForStep, stepIndex)) continue;
      const duration = runLength(track.grid, keyForStep, stepIndex, state.stepCount) * stepDuration;
      playSynthNote(ctx, destination, noteName, time, duration, track.waveform);
    }
  }
}
