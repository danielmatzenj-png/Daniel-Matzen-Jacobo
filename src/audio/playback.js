import { DRUM_PLAYERS } from './drumSynths.js';
import { playSynthNote } from './synthEngine.js';
import { isNoteInScale, getDiatonicChordDegrees } from './theory.js';

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
        if (!track.grid[`${degreeIndex}_${stepIndex}`]) return;
        for (const noteName of chord.noteNames) {
          playSynthNote(ctx, destination, noteName, time, stepDuration, track.waveform);
        }
      });
      continue;
    }

    // Bloqueo de escala: si está activo, solo suenan las notas que
    // pertenecen a la tonalidad elegida (garantiza que la melodía/bajo
    // encajen con los acordes, incluso si quedó alguna nota "fuera de
    // escala" programada de una sesión anterior).
    const playableNotes = state.scaleLock
      ? track.notes.filter((n) => isNoteInScale(n, state.key.root, state.key.scale))
      : track.notes;

    for (const noteName of playableNotes) {
      if (track.grid[`${noteName}_${stepIndex}`]) {
        playSynthNote(ctx, destination, noteName, time, stepDuration, track.waveform);
      }
    }
  }
}
