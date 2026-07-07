# Núcleo — Beat Maker

Estación de audio en el navegador (mini DAW): secuenciador de batería,
sintetizadores de melodía y bajo, mezclador, efectos de reverb/delay/filtro,
guardado de proyectos y exportación a WAV. 100% JavaScript puro + Web Audio
API, sin frameworks, sin backend, costo $0.

Tiene dos modos:

- **Simple** (por defecto): un asistente guiado de 5 pasos — tocás una nota,
  te sugiere un acorde, elegís 3 acordes más de una lista sugerida, elegís
  un ritmo, y la app arma sola el bajo, la melodía y la batería. Resultado:
  una canción de 4 compases lista para reproducir y descargar en `.wav`, sin
  tocar ninguna grilla.
- **Avanzado**: el editor completo (batería, piano roll, mezclador,
  tonalidad, guardado de proyectos) para quien quiera programar todo a mano.

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
│   │   ├── theory.js           (escalas, acordes diatónicos, sugerencias)
│   │   ├── playback.js         (dispara/sostiene los sonidos de un paso)
│   │   ├── songGenerator.js     (progresión + ritmo -> canción completa)
│   │   ├── effects.js          (reverb, delay, filtro)
│   │   └── scheduler.js        (motor de tiempo/secuenciador)
│   ├── ui/
│   │   ├── wizard.js            (asistente guiado, modo Simple)
│   │   ├── drumRack.js
│   │   ├── synthRack.js
│   │   ├── keyPanel.js
│   │   ├── transport.js
│   │   └── mixer.js
│   ├── beatPresets.js            (patrones de batería por estilo)
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
- [x] **Fase 2** — Todos los sonidos de batería (snare, hi-hats, clap, tom).
- [x] **Fase 3** — Secuenciador básico de 16 pasos (una pista) con scheduler
      de lookahead, BPM y play/stop.
- [x] **Fase 4** — Todas las pistas de batería + playhead visual.
- [x] **Fase 5** — Synths melódicos (piano roll para melodía y bajo).
- [x] **Fase 6** — Mezclador: volumen, pan, mute, solo.
- [x] **Fase 7** — Efectos: reverb, delay, filtro de brillo (master).
- [x] **Fase 8** — Guardado y carga de proyectos (localStorage).
- [x] **Fase 9** — Exportación a WAV (OfflineAudioContext).
- [x] **Fase 10** — Pulido: diseño, responsividad, atajo de teclado (espacio
      = play/stop).

Proyecto completo y funcional. Detalles de cada módulo:

- **Modo Simple (asistente)**: tocás una nota (una de las 7 de la
  tonalidad) → se sugiere y confirma el primer acorde → se sugieren 3
  acordes más, uno a la vez, según una tabla de progresiones comunes (I-V-vi
  siempre encaja después de I, por ejemplo) → elegís un estilo de ritmo
  (Pop, Lo-fi, Reggaetón, Trap) y se genera automáticamente una canción de 4
  compases: batería (preset elegido), bajo (raíz de cada acorde, sostenida),
  acordes (sostenidos) y melodía (arpegio simple sobre cada acorde). Desde
  ahí: reproducir (arriba) o descargar en `.wav`.
- **Batería**: 16 pasos × 6 pistas (kick, snare, hi-hat cerrado/abierto,
  clap, tom), cada una con botón de disparo manual además del patrón.
- **Melodía y bajo**: piano roll cromático (C4-C5 y C2-C3), selector de
  forma de onda por pista (seno/triángulo/cuadrada/sierra), clic en la nota
  para escucharla suelta.
- **Tonalidad y acordes**: elegís una tónica y una escala (mayor/menor). Con
  el "bloqueo de escala" activo (por defecto), el piano roll de melodía y
  bajo solo muestra las notas de esa tonalidad, y la pista de **Acordes**
  ofrece sus 7 tríadas diatónicas (I, ii, iii...) listas para programar —
  un acorde por paso. Todo lo que compongas encaja armónicamente por
  construcción. Podés desactivar el bloqueo si preferís libertad cromática
  total.
- **Mezclador**: fader de volumen y pan, mute y solo por las 9 pistas
  (batería + melodía + bajo + acordes), con la lógica de solo compartida.
- **Master**: volumen general, mezcla de reverb (impulso sintético),
  mezcla de delay (con feedback) y filtro de brillo (lowpass).
- **Proyecto**: guardar/cargar/eliminar con nombre en `localStorage`, botón
  "Nuevo" para resetear.
- **Exportar**: genera un `.wav` (1, 4 u 8 compases) reconstruyendo toda la
  cadena de audio en un `OfflineAudioContext`.

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
