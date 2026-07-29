"""Claude3D Bridge — add-on de Blender.

Expone un servidor socket dentro de Blender para que Claude (a través del
servidor MCP o del generador headless) pueda inspeccionar la escena, ejecutar
código bpy y renderizar en vivo.

Instalación:
  1. Comprime la carpeta `blender_addon` en un .zip (o usa la carpeta tal cual).
  2. Blender > Edit > Preferences > Add-ons > Install... y elige el .zip.
  3. Activa "Claude3D Bridge".
  4. En el visor 3D pulsa `N`, pestaña "Claude3D", y "Iniciar servidor".

IMPORTANTE sobre hilos: la API de Blender (bpy) NO es thread-safe. El servidor
acepta conexiones en un hilo aparte, pero todo el código bpy se ejecuta en el
hilo principal mediante un temporizador (bpy.app.timers). Cada petición se
encola y el hilo de red espera a que el hilo principal la procese.
"""

bl_info = {
    "name": "Claude3D Bridge",
    "author": "Claude3D",
    "version": (1, 0, 0),
    "blender": (3, 6, 0),
    "location": "Vista 3D > Barra lateral (N) > Claude3D",
    "description": "Puente para controlar Blender desde Claude y crear objetos 3D ultra realistas",
    "category": "3D View",
}

import io
import json
import queue
import socket
import struct
import threading
import traceback
from contextlib import redirect_stdout

import bpy

from . import realism

HOST = "127.0.0.1"
PORT = 8765

# Estado global del servidor (un solo servidor por sesión de Blender).
_server = None
_job_queue: "queue.Queue" = queue.Queue()


# ---------------------------------------------------------------------------
# Protocolo de framing (longitud de 4 bytes + JSON), igual que bridge_client.py
# ---------------------------------------------------------------------------
def _recv_exactly(conn, n):
    chunks = []
    while n > 0:
        chunk = conn.recv(n)
        if not chunk:
            raise ConnectionError("cliente desconectado")
        chunks.append(chunk)
        n -= len(chunk)
    return b"".join(chunks)


def _recv_frame(conn):
    (length,) = struct.unpack(">I", _recv_exactly(conn, 4))
    return _recv_exactly(conn, length)


def _send_frame(conn, payload: bytes):
    conn.sendall(struct.pack(">I", len(payload)) + payload)


# ---------------------------------------------------------------------------
# Ejecución de comandos (SIEMPRE en el hilo principal)
# ---------------------------------------------------------------------------
def _handle_command(request: dict) -> dict:
    cmd = request.get("type")
    params = request.get("params", {})

    if cmd == "ping":
        return {"status": "ok", "result": "pong"}

    if cmd == "get_scene_info":
        return {"status": "ok", "result": _scene_info()}

    if cmd == "get_object_info":
        return {"status": "ok", "result": _object_info(params.get("name", ""))}

    if cmd == "execute_code":
        return _execute_code(params.get("code", ""))

    if cmd == "render":
        path = params.get("output_path", "/tmp/claude3d_render.png")
        samples = params.get("samples", 128)
        realism.render(path, samples=samples)
        return {"status": "ok", "result": {"output_path": path}}

    return {"status": "error", "message": f"Comando desconocido: {cmd}"}


def _scene_info() -> dict:
    scene = bpy.context.scene
    objects = []
    for obj in scene.objects:
        objects.append({
            "name": obj.name,
            "type": obj.type,
            "location": list(obj.location),
        })
    return {
        "name": scene.name,
        "engine": scene.render.engine,
        "frame": scene.frame_current,
        "object_count": len(objects),
        "objects": objects[:200],
        "camera": scene.camera.name if scene.camera else None,
    }


def _object_info(name: str) -> dict:
    obj = bpy.data.objects.get(name)
    if obj is None:
        return {"error": f"No existe el objeto '{name}'."}
    info = {
        "name": obj.name,
        "type": obj.type,
        "location": list(obj.location),
        "rotation_euler": list(obj.rotation_euler),
        "scale": list(obj.scale),
        "dimensions": list(obj.dimensions),
        "modifiers": [m.name for m in obj.modifiers],
        "materials": [m.name for m in obj.data.materials] if getattr(obj.data, "materials", None) else [],
    }
    if obj.type == "MESH":
        info["vertices"] = len(obj.data.vertices)
        info["polygons"] = len(obj.data.polygons)
    return info


def _execute_code(code: str) -> dict:
    """Ejecuta código bpy con acceso a `r` (realism), bpy, math y mathutils.

    Captura stdout y, si el código define una variable `result`, la devuelve.
    """
    import math
    import mathutils

    namespace = {
        "bpy": bpy,
        "r": realism,
        "realism": realism,
        "math": math,
        "mathutils": mathutils,
        "__name__": "__claude3d__",
    }
    stdout = io.StringIO()
    try:
        with redirect_stdout(stdout):
            exec(code, namespace)
    except Exception:
        return {
            "status": "error",
            "message": f"Error al ejecutar el código:\n{traceback.format_exc()}",
        }

    result = namespace.get("result")
    payload = {"stdout": stdout.getvalue()}
    if result is not None:
        try:
            json.dumps(result)  # ¿Es serializable?
            payload["result"] = result
        except (TypeError, ValueError):
            payload["result"] = repr(result)
    return {"status": "ok", "result": payload}


# ---------------------------------------------------------------------------
# Temporizador del hilo principal: drena la cola de trabajos
# ---------------------------------------------------------------------------
def _process_jobs():
    while not _job_queue.empty():
        job = _job_queue.get_nowait()
        try:
            job["response"] = _handle_command(job["request"])
        except Exception:
            job["response"] = {"status": "error", "message": traceback.format_exc()}
        finally:
            job["event"].set()
    return 0.05  # Vuelve a ejecutarse en 50 ms.


# ---------------------------------------------------------------------------
# Servidor socket (hilo de red)
# ---------------------------------------------------------------------------
class BridgeServer:
    def __init__(self, host=HOST, port=PORT):
        self.host = host
        self.port = port
        self._sock = None
        self._thread = None
        self._running = False

    def start(self):
        if self._running:
            return
        self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.bind((self.host, self.port))
        self._sock.listen(5)
        self._sock.settimeout(1.0)
        self._running = True
        self._thread = threading.Thread(target=self._accept_loop, daemon=True)
        self._thread.start()
        if not bpy.app.timers.is_registered(_process_jobs):
            bpy.app.timers.register(_process_jobs, persistent=True)

    def stop(self):
        self._running = False
        if self._sock:
            try:
                self._sock.close()
            except Exception:
                pass
        self._sock = None
        if bpy.app.timers.is_registered(_process_jobs):
            bpy.app.timers.unregister(_process_jobs)

    def _accept_loop(self):
        while self._running:
            try:
                conn, _ = self._sock.accept()
            except socket.timeout:
                continue
            except OSError:
                break
            threading.Thread(target=self._handle_conn, args=(conn,),
                             daemon=True).start()

    def _handle_conn(self, conn):
        try:
            with conn:
                raw = _recv_frame(conn)
                request = json.loads(raw.decode("utf-8"))
                # Encola el trabajo y espera a que el hilo principal lo procese.
                job = {"request": request, "event": threading.Event(),
                       "response": None}
                _job_queue.put(job)
                if not job["event"].wait(timeout=600):
                    response = {"status": "error",
                                "message": "Tiempo de espera agotado en Blender."}
                else:
                    response = job["response"]
                _send_frame(conn, json.dumps(response).encode("utf-8"))
        except Exception:
            traceback.print_exc()


# ---------------------------------------------------------------------------
# Interfaz de usuario (panel + operadores)
# ---------------------------------------------------------------------------
class CLAUDE3D_OT_start(bpy.types.Operator):
    bl_idname = "claude3d.start_server"
    bl_label = "Iniciar servidor Claude3D"
    bl_description = "Abre el puente para que Claude controle esta sesión de Blender"

    def execute(self, context):
        global _server
        if _server is None:
            _server = BridgeServer()
        try:
            _server.start()
        except OSError as exc:
            self.report({"ERROR"}, f"No se pudo abrir el puerto {PORT}: {exc}")
            return {"CANCELLED"}
        self.report({"INFO"}, f"Servidor Claude3D escuchando en {HOST}:{PORT}")
        return {"FINISHED"}


class CLAUDE3D_OT_stop(bpy.types.Operator):
    bl_idname = "claude3d.stop_server"
    bl_label = "Detener servidor Claude3D"
    bl_description = "Cierra el puente de Claude"

    def execute(self, context):
        global _server
        if _server is not None:
            _server.stop()
        self.report({"INFO"}, "Servidor Claude3D detenido")
        return {"FINISHED"}


class CLAUDE3D_PT_panel(bpy.types.Panel):
    bl_label = "Claude3D"
    bl_idname = "CLAUDE3D_PT_panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Claude3D"

    def draw(self, context):
        layout = self.layout
        running = _server is not None and _server._running
        box = layout.box()
        box.label(text="Puente Claude ↔ Blender",
                  icon="LINKED" if running else "UNLINKED")
        box.label(text=f"{HOST}:{PORT}")
        if running:
            box.label(text="Estado: ACTIVO", icon="CHECKMARK")
            layout.operator("claude3d.stop_server", icon="PAUSE")
        else:
            box.label(text="Estado: detenido", icon="X")
            layout.operator("claude3d.start_server", icon="PLAY")


_classes = (
    CLAUDE3D_OT_start,
    CLAUDE3D_OT_stop,
    CLAUDE3D_PT_panel,
)


def register():
    for cls in _classes:
        bpy.utils.register_class(cls)


def unregister():
    global _server
    if _server is not None:
        _server.stop()
        _server = None
    for cls in reversed(_classes):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
