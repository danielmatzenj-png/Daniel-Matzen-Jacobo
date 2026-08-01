# mail2excel — Apple Mail → Tabla BLs (+ resumen diario)

Automatización para tu **Mac** que, varias veces al día:

1. Lee los correos nuevos de **Apple Mail (Mail.app)**.
2. Abre y lee el **PDF adjunto** (si lo hay) y revisa también su contenido.
3. Clasifica cada correo como una fila en tu Excel **`Tabla BLs.xlsx`** (Descargas).
4. Al final del día envía un **resumen** a `sebasmatzen@gmail.com`.

Todo corre **localmente** en tu Mac vía AppleScript; no usa claves ni APIs
externas.

## Cómo rellena cada columna

| Columna                 | Qué pone                                                        |
|-------------------------|----------------------------------------------------------------|
| **Status**              | Siempre `PEND`.                                                 |
| **Day**                 | Fecha en que se envió el correo (`DD.MM.YY`).                   |
| **Customer**            | Empresa del remitente (La Minita, PCT LLC, TCS LLC, Cafe Capris…). |
| **BL Nr**               | Número de BL del correo/PDF (por etiqueta o prefijo de naviera). |
| **ETD**                 | Fecha estimada de embarque.                                    |
| **ETA**                 | Fecha estimada de desembarque.                                |
| **PCD**                 | Se deja vacío (por indicación).                               |
| **Internal Reference Nr** | Nº de pedido interno según el prefijo del cliente (GF…, P5…, P-…, S…). |
| **Notes**               | Anomalías: *no hay BL*, *falta referencia interna*, etc.      |

Cada fila se lee del **cuerpo del correo y del texto del PDF adjunto**.

## Requisitos

- macOS con la app **Mail** ya configurada con tus cuentas.
- **Python 3.10+**.
- Permiso de **Automatización** para que la terminal controle Mail (la primera
  ejecución lo pide; si no, actívalo en *Ajustes del Sistema › Privacidad y
  seguridad › Automatización*).

## Instalación

```bash
cd <carpeta-del-proyecto>
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso manual

```bash
# Clasificar los correos nuevos en la tabla BLs
python -m mail2excel run
# o:
./scripts/run.sh run

# Enviar el resumen del día
python -m mail2excel summary
```

- `python -m mail2excel run --dry-run` muestra lo que haría **sin escribir**.
- `python -m mail2excel run --summary` clasifica y además envía el resumen.

## Ejecutar varias veces al día (automático)

```bash
./scripts/install-launchd.sh
```

Instala dos tareas de `launchd`:

- **`com.mail2excel.run`** → clasifica correos a las **9, 11, 13, 15 y 17 h**.
- **`com.mail2excel.summary`** → envía el resumen a las **18:05 h**.

Los horarios se editan en `scripts/install-launchd.sh`. Para quitarlas:

```bash
./scripts/uninstall-launchd.sh
```

Logs en `logs/run.log` y `logs/summary.log`. Para forzar una corrida ya:

```bash
launchctl start com.mail2excel.run
```

> La Mac debe estar encendida a esas horas. Si está suspendida, la tarea se
> ejecuta al despertar.

## IA con Groq (modelos Llama)

La extracción combina **reglas** (gratis, local) con **IA de Groq** (modelos
Llama, muy rápidos y con capa gratuita). Hay dos modos, en `config.yaml → ai`:

- **`mode: always`** (por defecto) — la IA se consulta en **cada correo** y sus
  valores mandan; las reglas quedan como red de seguridad para lo que la IA
  deje vacío.
- **`mode: fallback`** — mandan las reglas y la IA solo **rellena los campos que
  falten** (menos llamadas).

Para activarlo:

```bash
pip install groq
```

Y tu clave de Groq (gratis en https://console.groq.com) por cualquiera de estas
vías — el programa las lee en este orden:

1. **Archivo `.env`** en la carpeta del proyecto (cómodo, y **no se sube** a git):
   ```bash
   cp .env.example .env
   # edita .env y pega tu clave:  GROQ_API_KEY=gsk_...
   ```
2. **Variable de entorno** (útil para las tareas automáticas):
   ```bash
   export GROQ_API_KEY="gsk_..."
   ```

> Nunca escribas la clave dentro del código: este repo está en GitHub y quedaría
> pública. El `.env` está en `.gitignore` justamente para evitar eso.

Si falta el paquete o la clave, la automatización **sigue funcionando solo con
reglas** y lo avisa por consola. Las filas tocadas por IA se marcan en *Notes*
con «completado con IA».

Configuración en `config.yaml → ai`:

- **`enabled`** — activar/desactivar la IA.
- **`model`** — `llama-3.3-70b-versatile` por defecto; `llama-3.1-8b-instant`
  es más rápido y barato.
- **`mode`** — `always` o `fallback` (ver arriba).
- **`fallback_fields`** — qué campos gestiona la IA.
- **`max_chars`** — cuánto texto del correo/PDF se envía.

Desactivar solo en una corrida: `python -m mail2excel run --no-ai`.

> Privacidad: con la IA activada, el texto del correo/PDF se envía a Groq. Con
> `enabled: false` nada sale de tu Mac (solo reglas).

## Configuración (`config.yaml`)

- **`source`** — cuenta/buzón de Mail.app, `only_unread` (procesar solo no
  leídos, recomendado) y `save_attachments` (leer PDF).
- **`output`** — ruta del Excel (`~/Downloads/Tabla BLs.xlsx`), hoja
  (`Sheet1`), las **cabeceras exactas** y el formato de fecha.
- **`customers`** — cómo se reconoce cada cliente y el patrón de su nº de
  referencia interno.
- **`bl`** — etiquetas y prefijos de naviera para detectar el BL.
- **`dates`** — etiquetas que preceden a ETD/ETA.
- **`summary`** — destinatario y asunto del resumen.

### Añadir un cliente nuevo

```yaml
customers:
  - name: "Nuevo Cliente"
    match: ["nuevo cliente", "nuevocliente.com"]
    reference_pattern: 'NC\d{4,6}'
```

## Deduplicación

Al reejecutar, cada correo ya registrado se **omite** (clave por BL, o por
referencia interna, o por día+cliente). Puedes correr la automatización tantas
veces al día como quieras sobre el mismo Excel sin duplicar filas, y **respeta
las filas que ya tengas escritas a mano**.

## Probar sin Mac / sin Mail.app

Hay una fuente de prueba basada en JSON (la que usan los tests):

```bash
python -m mail2excel run --source json --input tests/sample_emails.json --output "Tabla BLs.xlsx"
```

## Pruebas

```bash
pip install pytest
pytest -q
```

## Estructura

```
mail2excel/
  __main__.py     # CLI: run / summary
  config.py       # carga de config.yaml
  mail_reader.py  # AppleScript (Mail.app) + guardado de PDF + fuente JSON
  pdf_reader.py   # extracción de texto de los PDF adjuntos
  extractor.py    # clasificación por reglas: cliente, BL, ETD/ETA, referencia, notas
  ai_extractor.py # IA con Groq (Llama) para extraer/rellenar campos
  excel_writer.py # escritura/append a la tabla BLs con deduplicación
  summary.py      # resumen diario + envío por Apple Mail
  dates.py        # normalización de fechas a DD.MM.YY
  models.py       # EmailMessage / BLRecord
config.yaml
requirements.txt
tests/
scripts/
  run.sh
  install-launchd.sh
  uninstall-launchd.sh
```

## Nota sobre la ejecución en la nube

Esta automatización corre **en tu Mac** porque depende de Apple Mail y del Excel
local. Si en el futuro quieres que corra sola en la nube (sin depender de que la
Mac esté encendida), habría que cambiar a **Gmail API + Google Sheets**; la
lógica de clasificación es la misma y se reutiliza.

## Licencia

MIT.
