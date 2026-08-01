# mail2excel — Apple Mail → Excel de facturas/pedidos

Automatización que lee tus correos de **Apple Mail (Mail.app)** en la Mac,
extrae los datos de **facturas y pedidos** (proveedor, nº de factura, nº de
pedido, fecha, base imponible, IVA, total, moneda…) y los vuelca a un archivo
**Excel (.xlsx)**. Se puede ejecutar cuantas veces quieras: no duplica filas.

Todo corre **localmente** en tu Mac vía AppleScript; no usa claves ni APIs
externas.

## Cómo funciona

```
Apple Mail (Mail.app)
        │  AppleScript (osascript)
        ▼
  mail_reader ──► lista de correos (fecha, remitente, asunto, cuerpo)
        │
        ▼
   extractor  ──► aplica las expresiones de config.yaml a cada correo
        │           (proveedor, nº factura, total, IVA, …)
        ▼
 excel_writer ──► escribe/actualiza facturas.xlsx (sin duplicar)
```

## Requisitos

- macOS con la app **Mail** configurada con tus cuentas.
- **Python 3.10+**.
- Permiso de **Automatización** para que tu terminal controle Mail
  (la primera ejecución lo pedirá; si no, actívalo en *Ajustes del Sistema ›
  Privacidad y seguridad › Automatización*).

## Instalación

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso

1. Edita `config.yaml` (buzón, filtros, campos y ruta del Excel).
2. Ejecuta:

```bash
python -m mail2excel run
# o bien:
./scripts/run.sh
```

Verás algo como:

```
› Leyendo correos (fuente: applescript)…
  200 correo(s) leído(s).
  12 correo(s) tras aplicar filtros.
✓ Excel actualizado: ~/Documents/facturas.xlsx
  Filas nuevas: 12 · omitidas (duplicadas): 0 · total en hoja: 12
```

### Ver qué haría, sin escribir

```bash
python -m mail2excel run --dry-run
```

### Probar sin Mac / sin Mail.app

Hay una fuente de prueba basada en JSON (la misma que usan los tests):

```bash
python -m mail2excel run --source json --input tests/sample_emails.json --output salida.xlsx
```

## Configuración (`config.yaml`)

- **`source`** — cuenta y buzón de Mail.app, si procesar solo no leídos y el
  máximo de correos por ejecución.
- **`filters`** — qué correos entran: por remitente, por palabras en el asunto
  (por defecto: *factura, invoice, pedido, recibo, comprobante*), por texto del
  cuerpo y por rango de fechas.
- **`output`** — ruta y nombre de la hoja del Excel.
- **`fields`** — **una columna por campo**. Cada campo define:
  - `type`: `text` (por defecto), `amount` (normaliza importes `1.234,56` / `$1,234.56`) o `date`.
  - `from`: origen alternativo si ninguna expresión coincide (`sender`, `sender_email`, `sender_domain`, `date`, `subject`).
  - `patterns`: lista de expresiones regulares; se toma el **grupo 1** del primer match.

### Añadir o cambiar un campo

Por ejemplo, para capturar un CIF/NIF del proveedor, añade en `fields`:

```yaml
  cif:
    patterns:
      - '(?:cif|nif)\s*[:\-]?\s*([A-Z0-9]{8,10})'
```

La próxima ejecución creará esa columna automáticamente.

> Nota: si cambias las columnas, empieza con un Excel nuevo (u otra ruta), ya
> que la deduplicación compara la estructura de columnas del archivo existente.

## Deduplicación

Cada fila lleva una clave oculta:

- el **número de factura** si se detectó, o
- `fecha + remitente + asunto` en su defecto.

Al reejecutar, los correos ya volcados se **omiten**, así que puedes correr la
automatización a diario sobre el mismo Excel.

## Automatizar la ejecución (opcional)

Para correrla cada día en la Mac, crea un agente de `launchd` que lance
`scripts/run.sh` a una hora fija (p. ej. con
[`launchd`](https://www.launchd.info)) o programa un evento de *Calendar* /
*Automator*. La deduplicación evita entradas repetidas.

## Pruebas

```bash
pip install pytest
pytest -q
```

## Estructura

```
mail2excel/
  __main__.py     # CLI (python -m mail2excel run)
  config.py       # carga de config.yaml
  mail_reader.py  # AppleScript (Mail.app) + fuente JSON de prueba
  extractor.py    # extracción de campos y filtros
  excel_writer.py # escritura/append a .xlsx con deduplicación
  models.py       # EmailMessage / ExtractedRow
config.yaml
requirements.txt
tests/
scripts/run.sh
```

## Licencia

MIT.
