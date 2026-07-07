// Genera una "respuesta de impulso" sintética (ruido blanco con caída
// exponencial de ~2s) para usar como reverb en un ConvolverNode. No requiere
// ningún archivo de audio externo.
export function createReverbImpulse(ctx, duration = 2, decay = 2.5) {
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

// Mapea el slider de filtro (0-1) a una frecuencia de corte logarítmica:
// 1.0 = 20000Hz (sin filtrar), valores bajos = sonido más apagado.
export function filterCutoffToFrequency(cutoff) {
  const minFreq = 200;
  const maxFreq = 20000;
  return minFreq * (maxFreq / minFreq) ** cutoff;
}
