"""Lectura de correos desde Apple Mail (Mail.app) vía AppleScript.

Incluye una fuente alternativa basada en JSON para poder desarrollar y probar
la lógica fuera de una Mac (por ejemplo en CI o en Linux).
"""

from __future__ import annotations

import json
import platform
import subprocess
from pathlib import Path
from typing import Any

from .models import EmailMessage

# Separadores de registro/campo: caracteres de control ASCII que no aparecen
# de forma natural en el texto de un correo.
RS = "\x1e"  # separador de registro (entre correos)
US = "\x1f"  # separador de campo (dentro de un correo)

# Plantilla de AppleScript. Los marcadores {{...}} se sustituyen en Python.
APPLESCRIPT_TEMPLATE = r"""
on pad(n)
    set n to n as integer
    if n < 10 then return "0" & (n as string)
    return n as string
end pad

on isoDate(d)
    set y to year of d as integer
    set mo to (month of d as integer)
    set dy to day of d as integer
    set hh to hours of d as integer
    set mi to minutes of d as integer
    set se to seconds of d as integer
    return (y as string) & "-" & pad(mo) & "-" & pad(dy) & " " & pad(hh) & ":" & pad(mi) & ":" & pad(se)
end isoDate

set rs to (ASCII character 30)
set us to (ASCII character 31)
set output to ""

tell application "Mail"
    set theMessages to {{MAILBOX_EXPR}}
    {{UNREAD_FILTER}}
    set msgCount to count of theMessages
    if msgCount > {{LIMIT}} then
        set theMessages to items 1 thru {{LIMIT}} of theMessages
    end if
    repeat with m in theMessages
        try
            set d to my isoDate(date received of m)
        on error
            set d to ""
        end try
        try
            set s to sender of m
        on error
            set s to ""
        end try
        try
            set sub to subject of m
        on error
            set sub to ""
        end try
        try
            set c to content of m
        on error
            set c to ""
        end try
        set output to output & d & us & s & us & sub & us & c & rs
    end repeat
end tell

return output
"""


def _build_mailbox_expr(account: str | None, mailbox: str) -> str:
    """Construye la expresión AppleScript que referencia el buzón."""
    if account:
        return f'messages of mailbox "{mailbox}" of account "{account}"'
    if mailbox.strip().lower() in ("inbox", "entrada", ""):
        # 'inbox' es el buzón unificado de todas las cuentas en Mail.app.
        return "messages of inbox"
    return f'messages of mailbox "{mailbox}"'


def _render_script(
    account: str | None,
    mailbox: str,
    only_unread: bool,
    limit: int,
) -> str:
    mailbox_expr = _build_mailbox_expr(account, mailbox)
    unread_filter = (
        "set theMessages to (a reference to (every item of theMessages whose read status is false))"
        if only_unread
        else ""
    )
    # Con filtro de no-leídos es más eficiente construir la referencia directamente.
    if only_unread:
        mailbox_expr = mailbox_expr + " whose read status is false"
        unread_filter = ""

    return (
        APPLESCRIPT_TEMPLATE
        .replace("{{MAILBOX_EXPR}}", mailbox_expr)
        .replace("{{UNREAD_FILTER}}", unread_filter)
        .replace("{{LIMIT}}", str(int(limit)))
    )


def _parse_output(raw: str, mailbox: str) -> list[EmailMessage]:
    messages: list[EmailMessage] = []
    for record in raw.split(RS):
        record = record.strip("\n\r")
        if not record.strip():
            continue
        parts = record.split(US)
        # Rellena por si un campo faltó.
        while len(parts) < 4:
            parts.append("")
        date, sender, subject, body = parts[0], parts[1], parts[2], parts[3]
        messages.append(
            EmailMessage(
                date=date.strip(),
                sender=sender.strip(),
                subject=subject.strip(),
                body=body,
                mailbox=mailbox,
            )
        )
    return messages


def read_from_apple_mail(
    account: str | None = None,
    mailbox: str = "inbox",
    only_unread: bool = False,
    limit: int = 200,
) -> list[EmailMessage]:
    """Lee correos de Mail.app. Solo funciona en macOS."""
    if platform.system() != "Darwin":
        raise RuntimeError(
            "La lectura de Apple Mail solo funciona en macOS. "
            "Usa la fuente 'json' (--source json --input archivo.json) para probar en otros sistemas."
        )

    script = _render_script(account, mailbox, only_unread, limit)
    try:
        proc = subprocess.run(
            ["osascript", "-"],
            input=script,
            capture_output=True,
            text=True,
            timeout=600,
        )
    except FileNotFoundError as exc:  # pragma: no cover - depende del sistema
        raise RuntimeError("No se encontró 'osascript'. ¿Estás en macOS?") from exc

    if proc.returncode != 0:
        raise RuntimeError(
            "AppleScript falló al leer Mail.app. "
            "Concede permisos de Automatización a la app de terminal en "
            "Ajustes del Sistema > Privacidad y seguridad > Automatización.\n"
            f"Detalle: {proc.stderr.strip()}"
        )

    return _parse_output(proc.stdout, mailbox)


def read_from_json(path: str | Path) -> list[EmailMessage]:
    """Lee correos de un archivo JSON (lista de objetos con date/sender/subject/body).

    Útil para pruebas y para desarrollar fuera de una Mac.
    """
    data: Any = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "messages" in data:
        data = data["messages"]
    if not isinstance(data, list):
        raise ValueError("El JSON debe ser una lista de correos o {'messages': [...]}.")

    messages: list[EmailMessage] = []
    for item in data:
        messages.append(
            EmailMessage(
                date=str(item.get("date", "")),
                sender=str(item.get("sender", "")),
                subject=str(item.get("subject", "")),
                body=str(item.get("body", "")),
                mailbox=str(item.get("mailbox", "json")),
            )
        )
    return messages


def read_messages(cfg: dict[str, Any], source: str, input_path: str | None) -> list[EmailMessage]:
    """Punto de entrada único: elige la fuente según la configuración/CLI."""
    if source == "json":
        if not input_path:
            raise ValueError("La fuente 'json' requiere --input con la ruta al archivo.")
        return read_from_json(input_path)

    src = cfg.get("source", {})
    return read_from_apple_mail(
        account=src.get("account") or None,
        mailbox=src.get("mailbox", "inbox"),
        only_unread=bool(src.get("only_unread", False)),
        limit=int(src.get("max_messages", 200)),
    )
