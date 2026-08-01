"""Extracción de texto de los PDF adjuntos a los correos."""

from __future__ import annotations

from pathlib import Path


def extract_pdf_text(path: str | Path) -> str:
    """Devuelve el texto de un PDF. '' si no se puede leer o no es PDF."""
    p = Path(path)
    if not p.exists() or p.suffix.lower() != ".pdf":
        return ""

    # pdfplumber da mejor resultado con tablas; si no está, se intenta pypdf.
    try:
        import pdfplumber  # type: ignore

        parts: list[str] = []
        with pdfplumber.open(str(p)) as pdf:
            for page in pdf.pages:
                parts.append(page.extract_text() or "")
        return "\n".join(parts)
    except Exception:
        pass

    try:
        from pypdf import PdfReader  # type: ignore

        reader = PdfReader(str(p))
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception:
        return ""


def extract_many(paths: list[str]) -> str:
    """Concatena el texto de varios PDF."""
    texts = [extract_pdf_text(p) for p in paths]
    return "\n\n".join(t for t in texts if t.strip())
