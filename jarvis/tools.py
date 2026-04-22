"""Herramientas que el asistente puede invocar para interactuar con la computadora.

Cada herramienta es una función Python registrada con su esquema JSON.
El agente envía el esquema al LLM y ejecuta la llamada cuando el modelo la solicita.
"""
from __future__ import annotations

import datetime as _dt
import os
import platform
import shlex
import shutil
import subprocess
import webbrowser
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import psutil


# --------------------------------------------------------------------------- #
# Registro de herramientas
# --------------------------------------------------------------------------- #

@dataclass
class Tool:
    name: str
    description: str
    parameters: dict[str, Any]
    func: Callable[..., Any]
    dangerous: bool = False

    def schema(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolRegistry:
    def __init__(self, workspace_root: str = "~"):
        self.workspace_root = Path(os.path.expanduser(workspace_root)).resolve()
        self._tools: dict[str, Tool] = {}
        self._register_defaults()

    # ------------------------- API pública ------------------------- #

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def schemas(self) -> list[dict[str, Any]]:
        return [t.schema() for t in self._tools.values()]

    def call(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        if name not in self._tools:
            return {"ok": False, "error": f"Herramienta desconocida: {name}"}
        tool = self._tools[name]
        try:
            result = tool.func(**(arguments or {}))
        except TypeError as e:
            return {"ok": False, "error": f"Argumentos inválidos: {e}"}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "error": f"{type(e).__name__}: {e}"}
        return {"ok": True, "result": result}

    def is_dangerous(self, name: str) -> bool:
        return self._tools.get(name, Tool("", "", {}, lambda: None)).dangerous

    # ------------------------ Utilidades ------------------------ #

    def _resolve(self, rel_or_abs: str) -> Path:
        p = Path(os.path.expanduser(rel_or_abs))
        if not p.is_absolute():
            p = (self.workspace_root / p).resolve()
        return p

    # --------------------- Herramientas por defecto --------------------- #

    def _register_defaults(self) -> None:
        # ----- Archivos ----- #
        self.register(Tool(
            name="list_files",
            description="Lista archivos y carpetas dentro de un directorio.",
            parameters={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Ruta absoluta o relativa al workspace."},
                    "pattern": {"type": "string", "description": "Glob opcional, p.ej. '*.py'."},
                },
                "required": ["path"],
            },
            func=self._list_files,
        ))

        self.register(Tool(
            name="read_file",
            description="Lee el contenido de un archivo de texto (máx 200 KB).",
            parameters={
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "max_bytes": {"type": "integer", "description": "Bytes máximos. Por defecto 200000."},
                },
                "required": ["path"],
            },
            func=self._read_file,
        ))

        self.register(Tool(
            name="write_file",
            description="Escribe (o sobreescribe) un archivo de texto con el contenido dado.",
            parameters={
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                    "append": {"type": "boolean", "description": "Si es true, añade al final. Por defecto false."},
                },
                "required": ["path", "content"],
            },
            func=self._write_file,
            dangerous=True,
        ))

        self.register(Tool(
            name="delete_path",
            description="Elimina un archivo o carpeta (recursivamente). Operación peligrosa.",
            parameters={
                "type": "object",
                "properties": {"path": {"type": "string"}},
                "required": ["path"],
            },
            func=self._delete_path,
            dangerous=True,
        ))

        self.register(Tool(
            name="search_files",
            description="Busca archivos cuyo nombre coincide con un patrón glob, recursivamente.",
            parameters={
                "type": "object",
                "properties": {
                    "root": {"type": "string"},
                    "pattern": {"type": "string", "description": "Glob, p.ej. '**/*.pdf'."},
                    "max_results": {"type": "integer"},
                },
                "required": ["root", "pattern"],
            },
            func=self._search_files,
        ))

        # ----- Shell / procesos ----- #
        self.register(Tool(
            name="run_shell",
            description=(
                "Ejecuta un comando en la shell del sistema y devuelve stdout/stderr. "
                "Úsalo con cuidado; operaciones destructivas serán confirmadas por el usuario."
            ),
            parameters={
                "type": "object",
                "properties": {
                    "command": {"type": "string"},
                    "cwd": {"type": "string"},
                    "timeout": {"type": "integer", "description": "Segundos."},
                },
                "required": ["command"],
            },
            func=self._run_shell,
            dangerous=True,
        ))

        self.register(Tool(
            name="open_app",
            description="Abre una aplicación o archivo con la aplicación predeterminada del sistema.",
            parameters={
                "type": "object",
                "properties": {"target": {"type": "string", "description": "Nombre de app o ruta al archivo."}},
                "required": ["target"],
            },
            func=self._open_app,
        ))

        self.register(Tool(
            name="list_processes",
            description="Lista los procesos activos (pid, nombre, uso de CPU y memoria).",
            parameters={
                "type": "object",
                "properties": {"top": {"type": "integer", "description": "Número máximo a devolver."}},
            },
            func=self._list_processes,
        ))

        self.register(Tool(
            name="kill_process",
            description="Termina un proceso por PID. Operación peligrosa.",
            parameters={
                "type": "object",
                "properties": {"pid": {"type": "integer"}},
                "required": ["pid"],
            },
            func=self._kill_process,
            dangerous=True,
        ))

        # ----- Sistema ----- #
        self.register(Tool(
            name="system_info",
            description="Devuelve información del sistema operativo, CPU, memoria y disco.",
            parameters={"type": "object", "properties": {}},
            func=self._system_info,
        ))

        self.register(Tool(
            name="now",
            description="Devuelve la fecha y hora actuales en formato ISO.",
            parameters={"type": "object", "properties": {}},
            func=lambda: _dt.datetime.now().isoformat(timespec="seconds"),
        ))

        # ----- Web ----- #
        self.register(Tool(
            name="open_url",
            description="Abre una URL en el navegador predeterminado.",
            parameters={
                "type": "object",
                "properties": {"url": {"type": "string"}},
                "required": ["url"],
            },
            func=self._open_url,
        ))

        self.register(Tool(
            name="web_search",
            description="Abre una búsqueda en el navegador (DuckDuckGo) con la consulta dada.",
            parameters={
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
            func=self._web_search,
        ))

        # ----- Portapapeles ----- #
        self.register(Tool(
            name="clipboard_read",
            description="Lee el contenido de texto del portapapeles.",
            parameters={"type": "object", "properties": {}},
            func=self._clipboard_read,
        ))

        self.register(Tool(
            name="clipboard_write",
            description="Copia un texto al portapapeles del sistema.",
            parameters={
                "type": "object",
                "properties": {"text": {"type": "string"}},
                "required": ["text"],
            },
            func=self._clipboard_write,
        ))

    # --------------------- Implementación de herramientas --------------------- #

    def _list_files(self, path: str, pattern: str | None = None) -> list[dict[str, Any]]:
        base = self._resolve(path)
        if not base.exists():
            raise FileNotFoundError(str(base))
        items = base.glob(pattern) if pattern else base.iterdir()
        out = []
        for p in items:
            try:
                stat = p.stat()
                out.append({
                    "name": p.name,
                    "path": str(p),
                    "is_dir": p.is_dir(),
                    "size": stat.st_size,
                    "modified": _dt.datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
                })
            except OSError:
                continue
        return sorted(out, key=lambda x: (not x["is_dir"], x["name"].lower()))

    def _read_file(self, path: str, max_bytes: int = 200_000) -> str:
        p = self._resolve(path)
        data = p.read_bytes()[:max_bytes]
        try:
            return data.decode("utf-8")
        except UnicodeDecodeError:
            return data.decode("utf-8", errors="replace")

    def _write_file(self, path: str, content: str, append: bool = False) -> dict[str, Any]:
        p = self._resolve(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        mode = "a" if append else "w"
        with open(p, mode, encoding="utf-8") as f:
            f.write(content)
        return {"path": str(p), "bytes": len(content.encode("utf-8"))}

    def _delete_path(self, path: str) -> dict[str, Any]:
        p = self._resolve(path)
        if p.is_dir():
            shutil.rmtree(p)
        else:
            p.unlink()
        return {"deleted": str(p)}

    def _search_files(self, root: str, pattern: str, max_results: int = 200) -> list[str]:
        base = self._resolve(root)
        results: list[str] = []
        for p in base.rglob(pattern):
            results.append(str(p))
            if len(results) >= max_results:
                break
        return results

    def _run_shell(self, command: str, cwd: str | None = None, timeout: int = 120) -> dict[str, Any]:
        work = self._resolve(cwd) if cwd else None
        completed = subprocess.run(
            command,
            shell=True,
            cwd=str(work) if work else None,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "returncode": completed.returncode,
            "stdout": completed.stdout[-8000:],
            "stderr": completed.stderr[-4000:],
        }

    def _open_app(self, target: str) -> dict[str, Any]:
        system = platform.system()
        if system == "Darwin":
            subprocess.Popen(["open", "-a", target] if not os.path.exists(target) else ["open", target])
        elif system == "Windows":
            os.startfile(target)  # type: ignore[attr-defined]
        else:  # Linux
            if shutil.which(target):
                subprocess.Popen([target])
            else:
                subprocess.Popen(["xdg-open", target])
        return {"opened": target}

    def _list_processes(self, top: int = 20) -> list[dict[str, Any]]:
        procs = []
        for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
            try:
                procs.append(p.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        procs.sort(key=lambda x: (x.get("cpu_percent") or 0), reverse=True)
        return procs[:top]

    def _kill_process(self, pid: int) -> dict[str, Any]:
        p = psutil.Process(pid)
        p.terminate()
        try:
            p.wait(timeout=3)
        except psutil.TimeoutExpired:
            p.kill()
        return {"killed": pid}

    def _system_info(self) -> dict[str, Any]:
        vm = psutil.virtual_memory()
        du = psutil.disk_usage("/")
        return {
            "os": f"{platform.system()} {platform.release()}",
            "python": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "cpu_percent": psutil.cpu_percent(interval=0.2),
            "memory_total_gb": round(vm.total / 1e9, 2),
            "memory_used_percent": vm.percent,
            "disk_total_gb": round(du.total / 1e9, 2),
            "disk_used_percent": du.percent,
            "user": os.environ.get("USER") or os.environ.get("USERNAME"),
            "home": str(Path.home()),
        }

    def _open_url(self, url: str) -> dict[str, Any]:
        webbrowser.open(url, new=2)
        return {"opened": url}

    def _web_search(self, query: str) -> dict[str, Any]:
        url = "https://duckduckgo.com/?q=" + shlex.quote(query).strip("'")
        webbrowser.open(url, new=2)
        return {"opened": url, "query": query}

    def _clipboard_read(self) -> str:
        import pyperclip

        return pyperclip.paste()

    def _clipboard_write(self, text: str) -> dict[str, Any]:
        import pyperclip

        pyperclip.copy(text)
        return {"copied_chars": len(text)}
