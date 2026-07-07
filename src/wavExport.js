import { createMasterChain, createTrackChannel, updateMasterParams, updateTrackParams } from './audio/context.js';
import { scheduleStepSounds } from './audio/playback.js';
import { allTracks } from './state.js';

// Convierte un AudioBuffer (el resultado de offlineCtx.startRendering()) a
// un archivo WAV: cabecera RIFF + datos PCM de 16 bits (spec 5.8). Web Audio
// API no tiene un encoder de WAV nativo, así que se arma el binario a mano.
function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del sub-chunk fmt
  view.setUint16(20, 1, true); // PCM lineal
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits por muestra
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// Reconstruye la cadena de audio completa (misma lógica y mismos efectos)
// dentro de un OfflineAudioContext, programa todos los pasos del patrón de
// una sola vez y renderiza el resultado a un buffer, que se convierte a WAV
// y se descarga.
export async function exportToWav(state, { bars = 4, filename = 'nucleo-beat.wav' } = {}) {
  const stepDuration = 60 / state.bpm / 4;
  const totalSteps = state.stepCount * bars;
  const tailSeconds = 2.5; // deja terminar la cola del reverb/delay
  const totalDuration = totalSteps * stepDuration + tailSeconds;
  const sampleRate = 44100;

  const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);
  const masterChain = createMasterChain(offlineCtx);
  updateMasterParams(masterChain, state.master);

  const channels = new Map();
  const tracks = allTracks(state);
  for (const track of tracks) {
    const channel = createTrackChannel(offlineCtx, masterChain);
    updateTrackParams(channel, track, tracks);
    channels.set(track.id, channel);
  }

  for (let step = 0; step < totalSteps; step++) {
    const stepIndex = step % state.stepCount;
    const time = step * stepDuration;
    scheduleStepSounds(offlineCtx, channels, state, stepIndex, time);
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  triggerDownload(wavBlob, filename);
}
