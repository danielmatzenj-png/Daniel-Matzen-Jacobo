import { DRUM_PLAYERS } from './drumSynths.js';
import { playSynthNote } from './synthEngine.js';

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

  for (const track of state.synthTracks) {
    const destination = channels.get(track.id).input;
    for (const noteName of track.notes) {
      if (track.grid[`${noteName}_${stepIndex}`]) {
        playSynthNote(ctx, destination, noteName, time, stepDuration, track.waveform);
      }
    }
  }
}
