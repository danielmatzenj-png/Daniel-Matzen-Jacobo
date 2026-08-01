"""Estructuras de datos compartidas."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

# Claves internas de una fila de la tabla BLs (independientes del texto del encabezado).
COLUMN_KEYS = [
    "status",
    "day",
    "customer",
    "bl_nr",
    "etd",
    "eta",
    "pcd",
    "internal_reference",
    "notes",
]


@dataclass
class EmailMessage:
    """Un correo leído de Apple Mail (o de una fuente de prueba)."""

    date: str = ""          # Fecha de envío/recepción, "YYYY-MM-DD HH:MM:SS"
    sender: str = ""        # Remitente crudo, p. ej. 'La Minita <ops@laminita.com>'
    subject: str = ""       # Asunto
    body: str = ""          # Cuerpo en texto plano
    mailbox: str = ""       # Buzón de origen (informativo)
    attachments: list[str] = field(default_factory=list)   # rutas locales a adjuntos
    attachment_text: str = ""  # texto extraído de los PDF adjuntos

    @property
    def searchable(self) -> str:
        """Texto sobre el que se aplican las expresiones de extracción."""
        return f"{self.subject}\n{self.body}\n{self.attachment_text}"

    @property
    def sender_name(self) -> str:
        """Nombre visible del remitente ('La Minita')."""
        raw = self.sender.strip()
        if "<" in raw:
            name = raw.split("<", 1)[0].strip().strip('"')
            if name:
                return name
        return raw

    @property
    def sender_email(self) -> str:
        """Dirección de correo del remitente ('ops@laminita.com')."""
        raw = self.sender.strip()
        if "<" in raw and ">" in raw:
            return raw.split("<", 1)[1].split(">", 1)[0].strip()
        return raw

    @property
    def sender_domain(self) -> str:
        email = self.sender_email
        return email.split("@", 1)[1] if "@" in email else ""


@dataclass
class BLRecord:
    """Una fila lista para la tabla BLs. Las claves son las de COLUMN_KEYS."""

    email: EmailMessage
    values: dict[str, Any] = field(default_factory=dict)

    def get(self, key: str) -> Any:
        return self.values.get(key, "")

    def row(self, headers: list[str], header_to_key: dict[str, str]) -> list[Any]:
        """Devuelve los valores en el orden de las cabeceras del Excel."""
        return [self.values.get(header_to_key.get(h, ""), "") for h in headers]

    def dedupe_key(self) -> str:
        """Evita registrar dos veces el mismo BL al reejecutar."""
        return record_key(
            self.values.get("bl_nr"),
            self.values.get("internal_reference"),
            self.values.get("day"),
            self.values.get("customer"),
        )


def record_key(bl_nr: Any, reference: Any, day: Any, customer: Any) -> str:
    """Clave de deduplicación derivable tanto de una fila nueva como del Excel.

    Solo usa datos presentes en la propia tabla, para poder comparar contra las
    filas ya escritas sin necesidad de columnas ocultas.
    """
    bl = str(bl_nr or "").strip().lower()
    if bl:
        return f"bl::{bl}"
    ref = str(reference or "").strip().lower()
    if ref:
        return f"ref::{ref}"
    return f"dc::{str(day or '').strip().lower()}|{str(customer or '').strip().lower()}"
