import { getAudioContext } from './context.js';

// Kick: oscilador seno con "pitch envelope" (la frecuencia cae de 150Hz a
// 45Hz en ~140ms) y una envolvente de ganancia con caída exponencial, para
// que el golpe no empiece/termine de golpe (evita el "clic").
export function playKick(time = getAudioContext().currentTime) {
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(time);
  osc.stop(time + 0.32);
}
