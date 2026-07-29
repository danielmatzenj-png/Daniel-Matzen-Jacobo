"""Cliente del puente de Blender (solo biblioteca estándar).

Habla con el servidor socket que expone el add-on `claude_bridge` dentro de
Blender. El protocolo es sencillo: cada mensaje va precedido por su longitud en
4 bytes big-endian, y el cuerpo es JSON UTF-8.

Lo usan tanto el servidor MCP (`mcp_server/server.py`) como el generador en modo
--live (`generate.py`).
"""

from __future__ import annotations

import json
import socket
import struct

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


class BridgeError(RuntimeError):
    """Error al comunicarse con Blender o al ejecutar un comando dentro de él."""


def _send_frame(sock: socket.socket, payload: bytes) -> None:
    sock.sendall(struct.pack(">I", len(payload)) + payload)


def _recv_exactly(sock: socket.socket, n: int) -> bytes:
    chunks = []
    remaining = n
    while remaining > 0:
        chunk = sock.recv(remaining)
        if not chunk:
            raise BridgeError("Conexión cerrada por Blender antes de tiempo.")
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def _recv_frame(sock: socket.socket) -> bytes:
    (length,) = struct.unpack(">I", _recv_exactly(sock, 4))
    return _recv_exactly(sock, length)


class BlenderBridge:
    """Conexión de corta duración a un Blender que ejecuta el add-on Claude3D."""

    def __init__(self, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT,
                 timeout: float = 300.0):
        self.host = host
        self.port = port
        self.timeout = timeout

    def command(self, cmd_type: str, **params) -> dict:
        """Envía un comando y devuelve el diccionario de respuesta.

        Lanza BridgeError si Blender no responde o el comando falla.
        """
        request = {"type": cmd_type, "params": params}
        try:
            with socket.create_connection((self.host, self.port), timeout=10) as sock:
                sock.settimeout(self.timeout)
                _send_frame(sock, json.dumps(request).encode("utf-8"))
                raw = _recv_frame(sock)
        except (ConnectionRefusedError, OSError) as exc:
            raise BridgeError(
                f"No se pudo conectar a Blender en {self.host}:{self.port}. "
                "¿Está Blender abierto con el servidor Claude3D iniciado "
                "(panel 'Claude3D' en la barra lateral N)?"
            ) from exc

        try:
            response = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise BridgeError(f"Respuesta inválida de Blender: {raw!r}") from exc

        if response.get("status") == "error":
            raise BridgeError(response.get("message", "Error desconocido en Blender."))
        return response.get("result", {})

    # Atajos de conveniencia ------------------------------------------------
    def ping(self) -> bool:
        try:
            self.command("ping")
            return True
        except BridgeError:
            return False

    def execute_code(self, code: str) -> dict:
        return self.command("execute_code", code=code)

    def get_scene_info(self) -> dict:
        return self.command("get_scene_info")

    def get_object_info(self, name: str) -> dict:
        return self.command("get_object_info", name=name)

    def render(self, output_path: str, samples: int = 128) -> dict:
        return self.command("render", output_path=output_path, samples=samples)
