"""Servidor MCP de Claude3D.

Expone Blender como un conjunto de herramientas MCP para que Claude Desktop o
Claude Code puedan controlar una sesión de Blender en vivo y crear objetos 3D
ultra realistas.

Requiere que Blender esté abierto con el add-on `claude_bridge` y el servidor
iniciado (panel Claude3D > Iniciar servidor).

Configuración en Claude Desktop (claude_desktop_config.json):

    {
      "mcpServers": {
        "claude3d": {
          "command": "python",
          "args": ["-m", "mcp_server.server"],
          "cwd": "/ruta/a/claude3d"
        }
      }
    }

Ejecución directa (para pruebas): python -m mcp_server.server
"""

from __future__ import annotations

import os
import sys

# Permite ejecutar como módulo o como script suelto.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp.server.fastmcp import FastMCP  # noqa: E402

from bridge_client import BlenderBridge, BridgeError  # noqa: E402
from toolkit_reference import full_reference  # noqa: E402

mcp = FastMCP("claude3d")
bridge = BlenderBridge()


@mcp.tool()
def toolkit_reference() -> str:
    """Devuelve la referencia del kit de realismo Claude3D.

    Llama a esta herramienta ANTES de escribir código para conocer las
    funciones de alto nivel (`r.pbr_material`, `r.studio_lighting`, etc.) y las
    claves para lograr el máximo realismo.
    """
    return full_reference()


@mcp.tool()
def get_scene_info() -> str:
    """Inspecciona la escena de Blender: objetos, cámara, motor de render."""
    try:
        info = bridge.get_scene_info()
    except BridgeError as exc:
        return f"ERROR: {exc}"
    lines = [
        f"Escena: {info['name']}  |  motor: {info['engine']}  |  "
        f"cámara: {info['camera']}",
        f"Objetos ({info['object_count']}):",
    ]
    for obj in info["objects"]:
        loc = ", ".join(f"{c:.2f}" for c in obj["location"])
        lines.append(f"  - {obj['name']} [{obj['type']}] @ ({loc})")
    return "\n".join(lines)


@mcp.tool()
def get_object_info(name: str) -> str:
    """Devuelve detalles de un objeto: transform, dimensiones, materiales, malla."""
    try:
        info = bridge.get_object_info(name)
    except BridgeError as exc:
        return f"ERROR: {exc}"
    import json
    return json.dumps(info, indent=2, ensure_ascii=False)


@mcp.tool()
def execute_blender_code(code: str) -> str:
    """Ejecuta código Python de Blender (bpy) en la sesión en vivo.

    Dispones de `r` (el kit de realismo — llama antes a toolkit_reference),
    `bpy`, `math` y `mathutils`. Para crear objetos ultra realistas: usa Cycles
    (`r.setup_cycles`), materiales PBR (`r.pbr_material`), iluminación de estudio
    o HDRI, biselado de aristas y suelo con sombras.

    Define una variable `result` si quieres devolver un valor al terminar.
    """
    try:
        out = bridge.execute_code(code)
    except BridgeError as exc:
        return f"ERROR: {exc}"
    parts = []
    if out.get("stdout"):
        parts.append("stdout:\n" + out["stdout"])
    if "result" in out:
        parts.append(f"result: {out['result']}")
    return "\n".join(parts) if parts else "OK (sin salida)."


@mcp.tool()
def render_scene(output_path: str = "", samples: int = 128) -> str:
    """Renderiza la escena actual con Cycles a un PNG y devuelve la ruta.

    Si no se indica ruta, usa el directorio temporal del sistema.
    """
    if not output_path:
        import tempfile
        output_path = os.path.join(tempfile.gettempdir(), "claude3d_render.png")
    try:
        out = bridge.render(output_path, samples=samples)
    except BridgeError as exc:
        return f"ERROR: {exc}"
    return f"Render guardado en: {out['output_path']}"


def main():
    if not bridge.ping():
        print(
            "AVISO: no se detecta Blender en 127.0.0.1:8765.\n"
            "Abre Blender, activa el add-on Claude3D y pulsa 'Iniciar servidor'.\n"
            "El servidor MCP arrancará igualmente y reintentará en cada llamada.",
            file=sys.stderr,
        )
    mcp.run()


if __name__ == "__main__":
    main()
