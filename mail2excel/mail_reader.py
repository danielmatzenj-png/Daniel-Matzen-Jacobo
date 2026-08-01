"""Lectura de correos desde Apple Mail (Mail.app) vía AppleScript.

Guarda los PDF adjuntos, extrae su texto y ofrece una fuente JSON alternativa
para desarrollar y probar la lógica fuera de una Mac.
"""

from __future__ import annotations

import json
import platform
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from .models import EmailMessage
from .pdf_reader import extract_many

RS = "\x1e"  # separador de registro (entre correos)
US = "\x1f"  # separador de campo
GS = "\x1d"  # separador de adjuntos dentro del campo

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
set gs to (ASCII character 29)
set attFolder to "{{ATTACH_DIR}}"
set output to ""
set i to 0

tell application "Mail"
    set theMessages to {{MAILBOX_EXPR}}
    set msgCount to count of theMessages
    if msgCount > {{LIMIT}} then
        set theMessages to items 1 thru {{LIMIT}} of theMessages
    end if
    repeat with m in theMessages
        set i to i + 1
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
        set attPaths to ""
        {{SAVE_ATTACHMENTS}}
        set output to output & d & us & s & us & sub & us & c & us & attPaths & rs
    end repeat
end tell

return output
"""

SAVE_ATTACHMENTS_SNIPPET = r"""
        try
            repeat with a in (mail attachments of m)
                try
                    set fn to name of a
                    if fn ends with ".pdf" or fn ends with ".PDF" then
                        set savePath to attFolder & "/" & (i as string) & "_" & fn
                        save a in (POSIX file savePath)
                        set attPaths to attPaths & savePath & gs
                    end if
                end try
            end repeat
        end try
"""


def _build_mailbox_expr(account: str | None, mailbox: str, only_unread: bool) -> str:
    if account:
        base = f'messages of mailbox "{mailbox}" of account "{account}"'
    elif mailbox.strip().lower() in ("inbox", "entrada", ""):
        base = "messages of inbox"
    else:
        base = f'messages of mailbox "{mailbox}"'
    if only_unread:
        base = base + " whose read status is false"
    return base


def _render_script(account, mailbox, only_unread, limit, attach_dir, save_attachments) -> str:
    mailbox_expr = _build_mailbox_expr(account, mailbox, only_unread)
    return (
        APPLESCRIPT_TEMPLATE
        .replace("{{MAILBOX_EXPR}}", mailbox_expr)
        .replace("{{LIMIT}}", str(int(limit)))
        .replace("{{ATTACH_DIR}}", attach_dir)
        .replace("{{SAVE_ATTACHMENTS}}", SAVE_ATTACHMENTS_SNIPPET if save_attachments else "")
    )


def _parse_output(raw: str, mailbox: str) -> list[EmailMessage]:
    messages: list[EmailMessage] = []
    for record in raw.split(RS):
        record = record.strip("\n\r")
        if not record.strip():
            continue
        parts = record.split(US)
        while len(parts) < 5:
            parts.append("")
        date, sender, subject, body, attachments = parts[:5]
        att_paths = [p for p in attachments.split(GS) if p.strip()]
        messages.append(
            EmailMessage(
                date=date.strip(),
                sender=sender.strip(),
                subject=subject.strip(),
                body=body,
                mailbox=mailbox,
                attachments=att_paths,
            )
        )
    return messages


def read_from_apple_mail(
    account: str | None = None,
    mailbox: str = "inbox",
    only_unread: bool = False,
    limit: int = 200,
    save_attachments: bool = True,
) -> list[EmailMessage]:
    """Lee correos de Mail.app (solo macOS) y extrae el texto de los PDF adjuntos."""
    if platform.system() != "Darwin":
        raise RuntimeError(
            "La lectura de Apple Mail solo funciona en macOS. "
            "Usa la fuente 'json' (--source json --input archivo.json) para probar en otros sistemas."
        )

    attach_dir = tempfile.mkdtemp(prefix="mail2excel_att_")
    script = _render_script(account, mailbox, only_unread, limit, attach_dir, save_attachments)
    try:
        proc = subprocess.run(
            ["osascript", "-"],
            input=script,
            capture_output=True,
            text=True,
            timeout=900,
        )
    except FileNotFoundError as exc:  # pragma: no cover
        raise RuntimeError("No se encontró 'osascript'. ¿Estás en macOS?") from exc

    if proc.returncode != 0:
        raise RuntimeError(
            "AppleScript falló al leer Mail.app. Concede permisos de Automatización a "
            "la terminal en Ajustes del Sistema > Privacidad y seguridad > Automatización.\n"
            f"Detalle: {proc.stderr.strip()}"
        )

    messages = _parse_output(proc.stdout, mailbox)
    for msg in messages:
        if msg.attachments:
            msg.attachment_text = extract_many(msg.attachments)
    return messages


def read_from_json(path: str | Path) -> list[EmailMessage]:
    """Fuente de prueba: lista de correos con date/sender/subject/body y, opcional,
    'attachment_text' (para simular el contenido del PDF) o 'attachments' (rutas)."""
    data: Any = json.loads(Path(path).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "messages" in data:
        data = data["messages"]
    if not isinstance(data, list):
        raise ValueError("El JSON debe ser una lista de correos o {'messages': [...]}.")

    messages: list[EmailMessage] = []
    for item in data:
        att = item.get("attachments", []) or []
        att_text = str(item.get("attachment_text", "") or "")
        if not att_text and att:
            att_text = extract_many([str(p) for p in att])
        messages.append(
            EmailMessage(
                date=str(item.get("date", "")),
                sender=str(item.get("sender", "")),
                subject=str(item.get("subject", "")),
                body=str(item.get("body", "")),
                mailbox=str(item.get("mailbox", "json")),
                attachments=[str(p) for p in att],
                attachment_text=att_text,
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
        save_attachments=bool(src.get("save_attachments", True)),
    )
