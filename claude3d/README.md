# Claude3D — Diseño 3D ultra realista con Claude + Blender

Programa de diseño 3D que pone **todas las capacidades de Blender** en manos de
**Claude** para crear objetos y escenas 3D **ultra realistas** a partir de texto.

> **Nota honesta sobre el alcance:** recrear Blender desde cero no es viable
> (son 30 años y millones de líneas de código: modelado, escultura, nodos,
> físicas, animación, Cycles/Eevee, etc.). Lo que hace Claude3D es lo más
> potente y realista posible: **conectar Claude con el Blender de verdad**. Así
> Claude tiene acceso a *todo* Blender —no a una imitación— y lo dirige para
> construir, iluminar y renderizar objetos fotorrealistas.

## Qué incluye

| Componente | Qué hace |
|------------|----------|
| **Add-on de Blender** (`blender_addon/`) | Abre un puente (servidor socket) dentro de Blender para que Claude lo controle en vivo. |
| **Servidor MCP** (`mcp_server/`) | Conecta Claude Desktop / Claude Code con Blender: Claude inspecciona la escena, ejecuta código y renderiza como herramientas. |
| **Generador headless** (`generate.py`) | Texto → objeto 3D renderizado, con la API de Claude. Incluye bucle de reparación de errores y **refinamiento por visión** (Claude mira el render y lo mejora). |
| **Kit de realismo** (`blender_addon/realism.py`) | Motor compartido: materiales PBR, Cycles + denoising, iluminación de estudio/HDRI, cámara con profundidad de campo, biselado, subdivisión y render. |

```
        ┌──────────── Claude ────────────┐
        │  API (generate.py)   MCP (Desktop/Code) │
        └───────────────┬────────────────┘
                        │  código bpy / render / inspección
                        ▼
                   Puente socket
                        │
                 ┌──────┴───────┐
                 │   BLENDER    │  ← el Blender real: Cycles, PBR, nodos, físicas…
                 │  + kit de    │
                 │  realismo r. │
                 └──────────────┘
```

## Requisitos

- **Blender 3.6+** (recomendado 4.x). Con GPU se renderiza mucho más rápido.
- **Python 3.10+** (para el servidor MCP y el generador; el add-on usa el Python
  interno de Blender y no necesita instalar nada).
- Clave de API: `export ANTHROPIC_API_KEY=...` (o `ant auth login`).

```bash
pip install -r requirements.txt
```

## Uso rápido

### A) Generador headless (texto → render, sin abrir Blender)

```bash
python generate.py "una taza de cerámica esmaltada con café sobre roble" -o taza.png
python generate.py "un reloj de acero, foto de producto" --samples 256 --iterations 4
```

Claude escribe el script de Blender, lo ejecuta en `blender --background`, ve el
render y lo va refinando hasta lograr el máximo realismo. Si Blender no está en
el PATH: `--blender /ruta/a/blender` (o `export BLENDER=/ruta/a/blender`).

### B) En vivo desde Claude Desktop / Claude Code (MCP)

1. Instala el add-on en Blender:
   - Comprime la carpeta `blender_addon/` en un `.zip`.
   - Blender › *Edit › Preferences › Add-ons › Install…* › elige el `.zip`.
   - Activa **Claude3D Bridge**.
   - En la vista 3D pulsa `N` › pestaña **Claude3D** › **Iniciar servidor**.
2. Registra el servidor MCP en `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "claude3d": {
         "command": "python",
         "args": ["-m", "mcp_server.server"],
         "cwd": "/ruta/absoluta/a/claude3d"
       }
     }
   }
   ```
3. Pídele a Claude, por ejemplo:
   > "Crea una naranja realista sobre una tabla de madera, ilumínala como foto
   >  de producto y renderízala."

### C) En vivo con el generador (`--live`)

Con Blender abierto y el servidor Claude3D iniciado:

```bash
python generate.py --live "añade una tetera de porcelana junto a la taza"
```

## Cómo consigue el realismo

El kit `realism.py` aplica automáticamente las prácticas de fotorrealismo (ver
`toolkit_reference.py`), y Claude las usa en cada escena:

- **Cycles** (trazado de rayos) con **denoising** y color management *Filmic*.
- **Materiales PBR** correctos (metales, vidrio con transmisión + IOR, plásticos…).
- **Biselado de aristas**: las aristas perfectas delatan el CGI.
- **Iluminación** de tres puntos, estudio o HDRI para reflejos creíbles.
- **Micro-variación de rugosidad** procedural.
- **Suelo** que recibe sombras y reflejos; **cámara** ~50 mm con profundidad de campo.
- **Subdivisión + sombreado suave** en formas orgánicas.

## Estructura

```
claude3d/
├── blender_addon/
│   ├── __init__.py        # Add-on: servidor socket + panel UI
│   └── realism.py         # Kit de realismo (motor compartido)
├── mcp_server/
│   └── server.py          # Servidor MCP (Claude Desktop / Code)
├── bridge_client.py       # Cliente del puente (solo stdlib)
├── toolkit_reference.py   # Referencia del kit para el prompt de Claude
├── generate.py            # Generador headless (API de Claude)
├── examples/prompts.md    # Ideas de prompts
└── requirements.txt
```

## Seguridad

`execute_blender_code` ejecuta código Python arbitrario dentro de Blender. El
puente solo escucha en `127.0.0.1` (localhost). No lo expongas a la red y úsalo
solo con Claude en un entorno de confianza.

## Licencia

MIT (igual que el resto del repositorio).
