# Núcleo — Beat Maker

Estación de audio en el navegador (mini DAW): secuenciador de batería,
sintetizadores de melodía y bajo, mezclador, efectos de reverb/delay/filtro,
guardado de proyectos y exportación a WAV. 100% JavaScript puro + Web Audio
API, sin frameworks, sin backend, costo $0.

## Requisitos

- Node.js (para Vite, el servidor de desarrollo).

## Uso

```bash
npm install
npm run dev      # abre http://localhost:5173
npm run build    # build de producción en dist/
```

## Estructura

```
nucleo-beatmaker/
├── index.html
├── src/
│   ├── audio/
│   │   ├── context.js        (AudioContext + cadena master)
│   │   ├── drumSynths.js      (kick, snare, hihat, clap, tom)
│   │   ├── synthEngine.js      (osciladores para melodía/bajo)
│   │   ├── effects.js          (reverb, delay, filtro)
│   │   └── scheduler.js        (motor de tiempo/secuenciador)
│   ├── ui/
│   │   ├── drumRack.js
│   │   ├── synthRack.js
│   │   ├── transport.js
│   │   └── mixer.js
│   ├── state.js                (modelo de datos del proyecto)
│   ├── storage.js               (guardar/cargar con localStorage)
│   ├── wavExport.js              (OfflineAudioContext + encoder WAV)
│   ├── style.css
│   └── main.js                   (arranca todo)
└── package.json
```

## Plan de desarrollo por fases

Cada fase funciona y se puede probar antes de pasar a la siguiente.

- [x] **Fase 0** — Preparación del entorno (Vite + vanilla JS).
- [x] **Fase 1** — Un solo sonido: botón que reproduce un kick sintetizado.
- [ ] **Fase 2** — Todos los sonidos de batería (snare, hi-hats, clap, tom).
- [ ] **Fase 3** — Secuenciador básico de 16 pasos (una pista) con scheduler
      de lookahead, BPM y play/stop.
- [ ] **Fase 4** — Todas las pistas de batería + playhead visual.
- [ ] **Fase 5** — Synths melódicos (piano roll para melodía y bajo).
- [ ] **Fase 6** — Mezclador: volumen, pan, mute, solo.
- [ ] **Fase 7** — Efectos: reverb, delay, filtro de brillo (master).
- [ ] **Fase 8** — Guardado y carga de proyectos (localStorage).
- [ ] **Fase 9** — Exportación a WAV (OfflineAudioContext).
- [ ] **Fase 10** — Pulido: diseño, responsividad, atajos de teclado.

## Conceptos de Web Audio API usados

- **AudioContext**: el motor central de audio, se crea una vez.
- **AudioNode**: cada pieza de la cadena (osciladores, ganancia, filtros,
  paneador, convolver, delay) se conecta con `.connect()`.
- **OscillatorNode**: genera ondas (seno, cuadrada, sierra, triángulo).
- **Envolventes (ADSR simplificado)**: rampas de ganancia para que las notas
  no suenen a "clic".
- **Ruido blanco filtrado**: para snare, hi-hat y clap.
- **Scheduler con lookahead**: cada ~25ms programa las notas de los próximos
  ~100ms usando `ctx.currentTime` (preciso a nivel de muestra), en vez de
  confiar en `setInterval`.
- **OfflineAudioContext**: renderiza la mezcla completa a un buffer para
  exportarla como `.wav`.

## Licencia

MIT.
