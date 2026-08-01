"""Estructuras de datos compartidas."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class EmailMessage:
    """Un correo leído de Apple Mail (o de una fuente de prueba)."""

    date: str = ""          # Fecha de recepción, formato "YYYY-MM-DD HH:MM:SS"
    sender: str = ""        # Remitente crudo, p. ej. 'Proveedor SA <facturas@proveedor.com>'
    subject: str = ""       # Asunto
    body: str = ""          # Cuerpo en texto plano
    mailbox: str = ""       # Buzón de origen (informativo)

    @property
    def searchable(self) -> str:
        """Texto sobre el que se aplican las expresiones de extracción."""
        return f"{self.subject}\n{self.body}"

    @property
    def sender_name(self) -> str:
        """Nombre visible del remitente ('Proveedor SA')."""
        raw = self.sender.strip()
        if "<" in raw:
            name = raw.split("<", 1)[0].strip().strip('"')
            if name:
                return name
        return raw

    @property
    def sender_email(self) -> str:
        """Dirección de correo del remitente ('facturas@proveedor.com')."""
        raw = self.sender.strip()
        if "<" in raw and ">" in raw:
            return raw.split("<", 1)[1].split(">", 1)[0].strip()
        return raw

    @property
    def sender_domain(self) -> str:
        email = self.sender_email
        return email.split("@", 1)[1] if "@" in email else ""


@dataclass
class ExtractedRow:
    """Una fila lista para escribir en Excel: metadatos del correo + campos extraídos."""

    email: EmailMessage
    fields: dict[str, Any] = field(default_factory=dict)

    def as_record(self, field_order: list[str]) -> dict[str, Any]:
        """Devuelve la fila como dict ordenado (meta + campos configurados)."""
        record: dict[str, Any] = {
            "fecha_correo": self.email.date,
            "remitente": self.email.sender_name,
            "correo_remitente": self.email.sender_email,
            "asunto": self.email.subject,
        }
        for name in field_order:
            record[name] = self.fields.get(name, "")
        return record

    def dedupe_key(self) -> str:
        """Clave para evitar duplicados al reejecutar la automatización."""
        num = str(self.fields.get("numero_factura") or "").strip()
        if num:
            return f"factura::{num.lower()}"
        return f"correo::{self.email.date}|{self.email.sender_email}|{self.email.subject}".lower()
