"""CLI de mail2excel.

Clasificar los correos nuevos en la tabla BLs (varias veces al día):
    python -m mail2excel run

Enviar el resumen del día (al final de la jornada):
    python -m mail2excel summary

Probar sin Mac / sin Mail.app:
    python -m mail2excel run --source json --input tests/sample_emails.json --output "Tabla BLs.xlsx"
"""

from __future__ import annotations

import argparse
import sys

from .ai_extractor import apply_ai_fallback, ai_enabled
from .config import load_config, load_env
from .excel_writer import write_records
from .extractor import classify_all
from .mail_reader import read_messages
from .summary import send_summary


def _cmd_run(args: argparse.Namespace) -> int:
    cfg = load_config(args.config)
    out = cfg.get("output", {})
    source = args.source or cfg.get("source", {}).get("type", "applescript")
    output = args.output or out.get("path", "Tabla BLs.xlsx")
    sheet = out.get("sheet", "Sheet1")
    headers = out.get("headers", [])

    print(f"› Leyendo correos (fuente: {source})…")
    emails = read_messages(cfg, source=source, input_path=args.input)
    print(f"  {len(emails)} correo(s) leído(s).")

    records = classify_all(emails, cfg)
    print(f"  {len(records)} correo(s) clasificado(s) tras filtros.")

    if ai_enabled(cfg) and not args.no_ai:
        ai = apply_ai_fallback(records, cfg)
        if ai.get("motivo"):
            print(f"  (IA de respaldo desactivada: {ai['motivo']})")
        elif ai["consultados"]:
            print(
                f"  IA de respaldo: {ai['consultados']} correo(s) consultado(s), "
                f"{ai['campos_completados']} campo(s) completado(s)."
            )

    if args.dry_run:
        _preview(records, headers, cfg)
        print("\n(dry-run: no se escribió ningún archivo.)")
        return 0

    summary = write_records(records, output_path=output, headers=headers, sheet_name=sheet)
    print(
        f"✓ Tabla actualizada: {output}\n"
        f"  Filas nuevas: {summary['nuevas']} · "
        f"omitidas (duplicadas): {summary['omitidas']} · "
        f"total en hoja: {summary['total']}"
    )

    if summary["nuevas"]:
        anomalies = [r for r in summary["added_records"] if r.get("notes")]
        if anomalies:
            print(f"  ⚠ {len(anomalies)} fila(s) con anomalías (ver columna Notes).")

    if args.summary:
        print()
        send_summary(cfg)
    return 0


def _cmd_summary(args: argparse.Namespace) -> int:
    cfg = load_config(args.config)
    send_summary(cfg, date_label=args.date)
    return 0


def _preview(records, headers, cfg) -> None:
    if not records:
        print("  (sin filas que mostrar)")
        return
    from .excel_writer import _header_map

    hmap = _header_map(headers)
    print("\nVista previa:")
    for rec in records[:25]:
        cells = rec.row(headers, hmap)
        print("  • " + " | ".join(f"{h}={v}" for h, v in zip(headers, cells) if str(v) != ""))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="mail2excel",
        description="Clasifica correos (facturas/BLs) de Apple Mail en la tabla BLs.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Lee correos nuevos y actualiza la tabla BLs.")
    run.add_argument("-c", "--config", default=None, help="Ruta a config.yaml.")
    run.add_argument("--source", choices=["applescript", "json"], default=None,
                     help="Fuente de correos ('applescript' = Apple Mail; 'json' = prueba).")
    run.add_argument("--input", default=None, help="Archivo JSON de correos (con --source json).")
    run.add_argument("-o", "--output", default=None, help="Ruta del Excel de salida.")
    run.add_argument("--dry-run", action="store_true", help="Muestra lo que haría sin escribir.")
    run.add_argument("--summary", action="store_true", help="Enviar también el resumen tras el run.")
    run.add_argument("--no-ai", action="store_true", help="Desactivar el respaldo con IA en esta ejecución.")
    run.set_defaults(func=_cmd_run)

    summ = sub.add_parser("summary", help="Envía el resumen diario por correo.")
    summ.add_argument("-c", "--config", default=None, help="Ruta a config.yaml.")
    summ.add_argument("--date", default=None, help="Día a resumir en formato DD.MM.YY (por defecto hoy).")
    summ.set_defaults(func=_cmd_summary)

    return parser


def main(argv: list[str] | None = None) -> int:
    load_env()  # carga GROQ_API_KEY desde .env si existe
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except (RuntimeError, ValueError, FileNotFoundError) as exc:
        print(f"✗ Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
