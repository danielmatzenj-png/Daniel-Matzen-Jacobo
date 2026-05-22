# Jarvis — Asistente de IA local

Asistente de IA **100% local** que se activa con la palabra clave **"Jarvis"**
y puede ejecutar acciones en tu computadora: leer y escribir archivos, lanzar
comandos de shell, abrir aplicaciones y URLs, consultar el estado del sistema,
buscar en la web, usar el portapapeles, etc.

Nada de tu voz ni tus datos sale de tu equipo: la detección de palabra clave,
la transcripción y el LLM corren localmente.

## Arquitectura

```
micrófono
   │
   ▼
openwakeword  ── escucha continua de "Jarvis"
   │ (activación)
   ▼
faster-whisper  ── transcribe tu petición al cerrarse el silencio
   │
   ▼
Agent ──► Ollama (LLM local, function calling)
   │          │
   │          └── invoca herramientas Python (archivos, shell, apps, web...)
   ▼
pyttsx3  ── lee la respuesta en voz alta
```

## Requisitos

- Python 3.10+
- Un LLM local servido por [Ollama](https://ollama.com) (recomendado
  `llama3.1`, `qwen2.5` o `mistral-nemo`; deben soportar *tools*).
- Micrófono y altavoz.
- Linux: `portaudio19-dev espeak ffmpeg xclip xdg-utils` (para audio, TTS,
  portapapeles y abrir aplicaciones).
- macOS: `brew install portaudio ffmpeg`.
- Windows: todo llega con las dependencias de pip (SAPI5 incluido).

## Instalación rápida

```bash
# Linux / macOS
./scripts/install.sh

# Windows (PowerShell)
.\scripts\install.ps1
```

Instala también Ollama y descarga un modelo con soporte de herramientas:

```bash
ollama pull llama3.1
```

## Uso

### Lanzamiento rápido (Windows)

```powershell
# Modo voz (dice "Jarvis" para activarse)
.\scripts\run.ps1

# Modo texto — sin micrófono, escribe tus peticiones
.\scripts\run.ps1 --text
```

También puedes hacer **doble clic** en `scripts\run.bat`.

### Lanzamiento manual

```bash
source .venv/bin/activate        # Windows: .\.venv\Scripts\Activate.ps1
python -m jarvis
```

Di "Jarvis". Cuando oigas la confirmación, pide lo que quieras. Ejemplos:

- "Jarvis, ¿cuánta memoria está usando mi equipo?"
- "Jarvis, lista los archivos de Documentos y dime cuál es el más grande."
- "Jarvis, abre Visual Studio Code."
- "Jarvis, crea un archivo notas.txt en el escritorio con mi lista de compras."
- "Jarvis, busca 'recetas de paella' en la web."

### Modo texto (para probar sin micrófono)

```bash
python -m jarvis --text
```

## Configuración

Edita `config.yaml` para cambiar:

- **Modelo LLM** (`llm.model`): cualquier modelo con *tool calling* en Ollama.
- **Modelo Whisper** (`stt.model`): `tiny`, `base`, `small`, `medium`, `large-v3`.
- **Umbral de la palabra clave** (`wake_word.threshold`).
- **Directorio raíz** para operaciones de archivos (`agent.workspace_root`).
- **Confirmación** para operaciones destructivas (`agent.confirm_dangerous`).

## Herramientas disponibles para el agente

| Herramienta       | Qué hace                                                   | Peligrosa |
|-------------------|------------------------------------------------------------|:---------:|
| `list_files`      | Lista contenidos de un directorio                          |           |
| `read_file`       | Lee un archivo de texto                                    |           |
| `write_file`      | Crea o sobrescribe un archivo                              | ✓         |
| `delete_path`     | Elimina archivo o carpeta                                  | ✓         |
| `search_files`    | Busca por patrón glob recursivamente                       |           |
| `run_shell`       | Ejecuta un comando en la shell                             | ✓         |
| `open_app`        | Abre una aplicación o archivo                              |           |
| `list_processes`  | Lista procesos activos                                     |           |
| `kill_process`    | Termina un proceso por PID                                 | ✓         |
| `system_info`     | Info de CPU, RAM, disco, SO                                |           |
| `now`             | Fecha y hora actual                                        |           |
| `open_url`        | Abre una URL en el navegador                               |           |
| `web_search`      | Búsqueda web (DuckDuckGo)                                  |           |
| `clipboard_read`  | Lee el portapapeles                                        |           |
| `clipboard_write` | Escribe al portapapeles                                    |           |

Las herramientas marcadas como peligrosas piden confirmación por consola antes
de ejecutarse si `agent.confirm_dangerous: true` (valor por defecto).

## Añadir tus propias herramientas

Edita `jarvis/tools.py` y registra una nueva `Tool` con su esquema JSON:

```python
self.register(Tool(
    name="mi_herramienta",
    description="Qué hace",
    parameters={
        "type": "object",
        "properties": {"x": {"type": "string"}},
        "required": ["x"],
    },
    func=self._mi_impl,
))
```

El LLM la verá automáticamente en la siguiente petición.

## Seguridad

El asistente tiene acceso amplio a tu sistema; trátalo como trataría cualquier
script que ejecuta comandos de shell: revisa `agent.workspace_root` y mantén
`confirm_dangerous: true` a menos que sepas lo que haces. Todas las operaciones
peligrosas pasan por un diálogo de confirmación explícito.

## Licencia

MIT.
