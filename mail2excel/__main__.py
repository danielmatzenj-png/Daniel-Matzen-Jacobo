"""CLI de mail2excel.

Uso típico en la Mac:

    python -m mail2excel run

Prueba fuera de la Mac (sin Mail.app):

    python -m mail2excel run --source json --input tests/sample_emails.json --output salida.xlsx
"""

from __future__ import annotations

import argparse
import sys

from .config import field_order, load_config
from .excel_writer import write_rows
from .extractor import extract_all
from .mail_reader import read_messages


def _cmd_run(args: argparse.Namespace) -> int:
    cfg = load_config(args.config)

    source = args.source or cfg.get("source", {}).get("type", "applescript")
    output = args.output or cfg.get("output", {}).get("path", "facturas.xlsx")
    sheet = cfg.get("output", {}).get("sheet", "Facturas")
    order = field_order(cfg)

    print(f"› Leyendo correos (fuente: {source})…")
    emails = read_messages(cfg, source=source, input_path=args.input)
    print(f"  {len(emails)} correo(s) leído(s).")

    rows = extract_all(emails, fields=cfg.get("fields", {}), filters=cfg.get("filters", {}))
    print(f"  {len(rows)} correo(s) tras aplicar filtros.")

    if args.dry_run:
        _print_preview(rows, order)
        print("\n(dry-run: no se escribió ningún archivo.)")
        return 0

    summary = write_rows(rows, output_path=output, field_order=order, sheet_name=sheet)
    print(
        f"✓ Excel actualizado: {output}\n"
        f"  Filas nuevas: {summary['nuevas']} · "
        f"omitidas (duplicadas): {summary['omitidas']} · "
        f"total en hoja: {summary['total']}"
    )
    return 0


def _print_preview(rows, order) -> None:
    if not rows:
        print("  (sin filas que mostrar)")
        return
    print("\nVista previa:")
    for row in rows[:20]:
        rec = row.as_record(order)
        print(f"  • {rec['fecha_correo']} | {rec['remitente']} | {rec['asunto']}")
        for name in order:
            val = rec.get(name, "")
            if val != "":
                print(f"      - {name}: {val}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="mail2excel",
        description="Extrae datos de facturas/pedidos de Apple Mail a un Excel.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Lee correos y actualiza el Excel.")
    run.add_argument("-c", "--config", default=None, help="Ruta a config.yaml.")
    run.add_argument(
        "--source",
        choices=["applescript", "json"],
        default=None,
        help="Fuente de correos. 'applescript' = Apple Mail (macOS); 'json' = archivo de prueba.",
    )
    run.add_argument("--input", default=None, help="Archivo JSON de correos (con --source json).")
    run.add_argument("-o", "--output", default=None, help="Ruta del Excel de salida.")
    run.add_argument("--dry-run", action="store_true", help="Muestra lo que haría sin escribir.")
    run.set_defaults(func=_cmd_run)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except (RuntimeError, ValueError, FileNotFoundError) as exc:
        print(f"✗ Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
