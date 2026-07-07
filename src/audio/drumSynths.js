// Los sintetizadores de batería reciben (ctx, destination, time): `ctx`
// puede ser el AudioContext en vivo o un OfflineAudioContext al exportar a
// WAV, y `destination` es el nodo de entrada del canal de la pista (su
// GainNode de volumen). Así el mismo código sirve para reproducir en vivo
// y para renderizar la exportación.

// El snare, el hi-hat y el clap no son tonos puros: son ruido blanco
// filtrado. Generamos el buffer de ruido una sola vez por contexto y lo
// reutilizamos (se cachea con un WeakMap para no recrearlo en cada golpe).
const noiseBufferCache = new WeakMap();

function getNoiseBuffer(ctx) {
  if (!noiseBufferCache.has(ctx)) {
    const length = Math.floor(ctx.sampleRate * 1); // 1s de ruido, de sobra para cualquier golpe
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBufferCache.set(ctx, buffer);
  }
  return noiseBufferCache.get(ctx);
}

function createNoiseSource(ctx) {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx);
  return source;
}

// Kick: oscilador seno con "pitch envelope" (la frecuencia cae de 150Hz a
// 45Hz en ~140ms) y una envolvente de ganancia con caída exponencial, para
// que el golpe no empiece/termine de golpe (evita el "clic"). Duración ~320ms.
export function playKick(ctx, destination, time) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + 0.32);
}

// Snare: ruido blanco + filtro pasa-banda (~1800Hz) + un oscilador
// triangular de apoyo en 180Hz. Duración ~180-200ms.
export function playSnare(ctx, destination, time) {
  const noise = createNoiseSource(ctx);
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1800;
  bandpass.Q.value = 1;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.7, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.19);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(destination);
  noise.start(time);
  noise.stop(time + 0.2);

  const tone = ctx.createOscillator();
  tone.type = 'triangle';
  tone.frequency.value = 180;

  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.5, time);
  toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

  tone.connect(toneGain);
  toneGain.connect(destination);
  tone.start(time);
  tone.stop(time + 0.16);
}

// Hi-hat (cerrado/abierto): ruido blanco + filtro pasa-altos (~7000Hz). Solo
// cambia la duración de la caída: cerrado 60ms, abierto 320ms.
function playHat(ctx, destination, time, duration) {
  const noise = createNoiseSource(ctx);
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 7000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noise.connect(highpass);
  highpass.connect(gain);
  gain.connect(destination);
  noise.start(time);
  noise.stop(time + duration + 0.02);
}

export function playHatClosed(ctx, destination, time) {
  playHat(ctx, destination, time, 0.06);
}

export function playHatOpen(ctx, destination, time) {
  playHat(ctx, destination, time, 0.32);
}

// Clap: 3 ráfagas cortas de ruido filtrado (pasa-banda ~1500Hz) espaciadas
// 10ms, más una cola algo más larga que redondea la duración total a ~250ms.
export function playClap(ctx, destination, time) {
  const burstTimes = [time, time + 0.01, time + 0.02];
  for (const burstTime of burstTimes) {
    const noise = createNoiseSource(ctx);
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1500;
    bandpass.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, burstTime);
    gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.03);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(destination);
    noise.start(burstTime);
    noise.stop(burstTime + 0.04);
  }

  const tailTime = time + 0.02;
  const tailNoise = createNoiseSource(ctx);
  const tailFilter = ctx.createBiquadFilter();
  tailFilter.type = 'bandpass';
  tailFilter.frequency.value = 1500;
  tailFilter.Q.value = 1;

  const tailGain = ctx.createGain();
  tailGain.gain.setValueAtTime(0.35, tailTime);
  tailGain.gain.exponentialRampToValueAtTime(0.001, tailTime + 0.22);

  tailNoise.connect(tailFilter);
  tailFilter.connect(tailGain);
  tailGain.connect(destination);
  tailNoise.start(tailTime);
  tailNoise.stop(tailTime + 0.23);
}

// Tom: oscilador seno, pitch de 220Hz a 90Hz. Duración ~320ms.
export function playTom(ctx, destination, time) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, time);
  osc.frequency.exponentialRampToValueAtTime(90, time + 0.14);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + 0.32);
}

export const DRUM_PLAYERS = {
  kick: playKick,
  snare: playSnare,
  hatC: playHatClosed,
  hatO: playHatOpen,
  clap: playClap,
  tom: playTom,
};
