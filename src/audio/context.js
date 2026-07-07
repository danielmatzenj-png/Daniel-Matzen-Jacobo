import { createReverbImpulse, filterCutoffToFrequency } from './effects.js';

// El AudioContext es el "motor" central de Web Audio API: se crea una sola
// vez y todo el audio de la app pasa a través de él (como la mesa de mezcla
// física a la que se conecta todo lo demás). Estas funciones también se
// reutilizan con un OfflineAudioContext al exportar a WAV (wavExport.js),
// por eso reciben `ctx` como parámetro en vez de usar el singleton directamente.
let liveCtx = null;
let liveMasterChain = null;
const liveChannels = new Map();

export function getAudioContext() {
  if (!liveCtx) {
    liveCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Los navegadores exigen que el AudioContext se reanude tras una
  // interacción del usuario (click, tecla, etc.).
  if (liveCtx.state === 'suspended') {
    liveCtx.resume();
  }
  return liveCtx;
}

// Cadena master (ver spec 5.1): cada pista se suma en paralelo por tres
// rutas -- seca, reverb y delay -- que convergen en un "pre-master", pasan
// por un filtro de brillo (lowpass), el volumen master y un analyser (VU
// meter) antes de llegar a los parlantes (ctx.destination).
export function createMasterChain(ctx) {
  const preMaster = ctx.createGain();

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 20000;

  const masterGain = ctx.createGain();

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;

  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0;
  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx);
  reverbSend.connect(convolver);
  convolver.connect(preMaster);

  const delaySend = ctx.createGain();
  delaySend.gain.value = 0;
  const delayNode = ctx.createDelay(2.0);
  delayNode.delayTime.value = 0.3;
  const feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.35;
  delaySend.connect(delayNode);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode); // bucle de feedback: el eco se repite y se atenúa
  delayNode.connect(preMaster);

  preMaster.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(analyser);
  analyser.connect(ctx.destination);

  return { preMaster, filter, masterGain, analyser, reverbSend, delaySend, convolver, delayNode, feedbackGain };
}

export function updateMasterParams(masterChain, master) {
  masterChain.masterGain.gain.value = master.volume;
  masterChain.reverbSend.gain.value = master.reverbMix;
  masterChain.delaySend.gain.value = master.delayMix;
  masterChain.filter.frequency.value = filterCutoffToFrequency(master.filterCutoff);
}

// Cada pista (batería o synth) tiene su propio GainNode (volumen) +
// StereoPannerNode (pan). Un segundo GainNode (muteGain) controla si la
// pista suena o no (mute/solo) sin tener que reconstruir el grafo.
export function createTrackChannel(ctx, masterChain) {
  const volumeGain = ctx.createGain();
  const muteGain = ctx.createGain();
  const panner = ctx.createStereoPanner();

  volumeGain.connect(muteGain);
  muteGain.connect(panner);
  panner.connect(masterChain.preMaster);
  panner.connect(masterChain.reverbSend);
  panner.connect(masterChain.delaySend);

  return { input: volumeGain, volumeGain, muteGain, panner };
}

export function isTrackAudible(track, allTracks) {
  const anySolo = allTracks.some((t) => t.solo);
  return anySolo ? track.solo : !track.mute;
}

export function updateTrackParams(channel, track, allTracks) {
  channel.volumeGain.gain.value = track.vol;
  channel.panner.pan.value = track.pan;
  channel.muteGain.gain.value = isTrackAudible(track, allTracks) ? 1 : 0;
}

// API del contexto "en vivo" (el que suena por los parlantes mientras se usa
// la app). wavExport.js construye su propia cadena con un OfflineAudioContext
// aparte, usando las mismas funciones createMasterChain/createTrackChannel.
export function getMasterChain() {
  if (!liveMasterChain) {
    liveMasterChain = createMasterChain(getAudioContext());
  }
  return liveMasterChain;
}

export function getTrackChannel(id) {
  if (!liveChannels.has(id)) {
    liveChannels.set(id, createTrackChannel(getAudioContext(), getMasterChain()));
  }
  return liveChannels.get(id);
}
