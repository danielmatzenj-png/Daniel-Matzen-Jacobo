// El reto técnico más importante del proyecto (spec 3.6 y 5.4): JavaScript
// no es preciso para el tiempo (setTimeout/setInterval pueden atrasarse). La
// solución es revisar cada ~25ms qué pasos deben sonar en los próximos
// ~100ms y programarlos con el reloj interno del AudioContext
// (ctx.currentTime), que sí es preciso a nivel de muestra de audio.
//
// Punto crítico: `nextNoteTime` se calcula siempre sumando duraciones
// matemáticamente, nunca leyendo "el tiempo actual" directamente — así no
// se acumula desfase (drift) durante una sesión larga.
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_TIME = 0.1;

export class Scheduler {
  constructor({ getState, onScheduleStep, onStepVisual }) {
    this.getState = getState;
    this.onScheduleStep = onScheduleStep; // (stepIndex, time) => void
    this.onStepVisual = onStepVisual; // (stepIndex) => void, sincronizado a tiempo real para la UI
    this.timerId = null;
    this.currentStep = 0;
    this.nextNoteTime = 0;
    this.ctx = null;
  }

  isRunning() {
    return this.timerId !== null;
  }

  start(ctx) {
    if (this.isRunning()) return;
    this.ctx = ctx;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this._tick();
  }

  stop() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  _tick() {
    const state = this.getState();
    const stepDuration = 60 / state.bpm / 4; // 16 pasos = semicorcheas

    while (this.nextNoteTime < this.ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      this.onScheduleStep(this.currentStep, this.nextNoteTime);

      const stepIndex = this.currentStep;
      const delayMs = Math.max(0, (this.nextNoteTime - this.ctx.currentTime) * 1000);
      setTimeout(() => this.onStepVisual(stepIndex), delayMs);

      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % state.stepCount;
    }

    this.timerId = setTimeout(() => this._tick(), LOOKAHEAD_MS);
  }
}
