const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Filas del piano roll, de aguda a grave (como en un piano real). Rango
// cromático completo C4-C5 para melodía, C2-C3 para bajo (spec 5.3).
export const MELODY_NOTES = ['C5', 'B4', 'A#4', 'A4', 'G#4', 'G4', 'F#4', 'F4', 'E4', 'D#4', 'D4', 'C#4', 'C4'];
export const BASS_NOTES = ['C3', 'B2', 'A#2', 'A2', 'G#2', 'G2', 'F#2', 'F2', 'E2', 'D#2', 'D2', 'C#2', 'C2'];

export const WAVEFORMS = ['sine', 'triangle', 'square', 'sawtooth'];

function noteToFrequency(noteName) {
  const octave = parseInt(noteName.slice(-1), 10);
  const name = noteName.slice(0, -1);
  const semitonesFromA4 = (octave - 4) * 12 + (NOTE_NAMES.indexOf(name) - NOTE_NAMES.indexOf('A'));
  return 440 * 2 ** (semitonesFromA4 / 12);
}

// Envolvente simple por nota: subida rápida (~12ms) y caída exponencial
// hasta el final del paso (spec 5.3), para que no suene a "clic".
export function playSynthNote(ctx, destination, noteName, time, duration, waveform) {
  const osc = ctx.createOscillator();
  osc.type = waveform;
  osc.frequency.value = noteToFrequency(noteName);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(1, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + duration + 0.02);
}
