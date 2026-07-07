// El AudioContext es el "motor" central de Web Audio API: se crea una sola
// vez y todo el audio de la app pasa a través de él (como la mesa de mezcla
// física a la que se conecta todo lo demás).
let ctx = null;

export function getAudioContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Los navegadores exigen que el AudioContext se reanude tras una
  // interacción del usuario (click, tecla, etc.).
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}
