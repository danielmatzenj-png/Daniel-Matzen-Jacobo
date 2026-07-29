#!/usr/bin/env python3
"""Claude3D — generador de objetos 3D ultra realistas desde texto.

Convierte una descripción en lenguaje natural en un render fotorrealista:

    python generate.py "una taza de cerámica esmaltada sobre una mesa de madera"

Cómo funciona:
  1. Claude (API de Anthropic) escribe un script de Blender usando el kit de
     realismo Claude3D.
  2. El script se ejecuta en Blender headless (`blender --background --python`).
  3. Si falla, Claude ve el error y lo corrige (bucle de reparación).
  4. Cuando renderiza, Claude VE la imagen resultante y la refina para
     maximizar el realismo (bucle de refinamiento por visión).

También hay un modo en vivo (--live) que controla un Blender ya abierto con el
add-on Claude3D, en lugar de lanzar uno headless.

Requisitos: `pip install anthropic`, Blender instalado en el PATH (o --blender),
y ANTHROPIC_API_KEY configurada (o `ant auth login`).
"""

from __future__ import annotations

import argparse
import base64
import os
import subprocess
import sys
import tempfile

import anthropic

from toolkit_reference import full_reference

MODEL = "claude-opus-5"
REALISM_SOURCE_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "blender_addon", "realism.py"
)

RENDER_TOOL = {
    "name": "render_blender_script",
    "description": (
        "Ejecuta un script de Blender (bpy) para construir y renderizar la "
        "escena, y devuelve la imagen renderizada para que la evalúes. El "
        "módulo del kit de realismo ya está cargado como `r` (NO lo importes) "
        "y la variable OUTPUT_PATH contiene la ruta del render. Tu script debe "
        "terminar llamando a r.render(OUTPUT_PATH)."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "script": {
                "type": "string",
                "description": "Código Python de Blender completo que construye "
                               "la escena y renderiza a OUTPUT_PATH.",
            },
            "notes": {
                "type": "string",
                "description": "Breve explicación de las decisiones de realismo "
                               "y, en iteraciones posteriores, qué has mejorado.",
            },
        },
        "required": ["script"],
    },
}

SYSTEM_PROMPT = (
    "Eres un artista técnico 3D experto en Blender y fotorrealismo. Creas "
    "objetos y escenas 3D ULTRA REALISTAS escribiendo scripts de Blender (bpy) "
    "y los renderizas con la herramienta render_blender_script.\n\n"
    "Flujo de trabajo:\n"
    "1. Escribe un script que construya la escena y la renderice llamando a "
    "r.render(OUTPUT_PATH).\n"
    "2. Recibirás la imagen renderizada. Evalúala con ojo crítico de fotógrafo: "
    "iluminación, materiales, composición, escala, artefactos.\n"
    "3. Si puedes mejorar el realismo y quedan iteraciones, llama de nuevo a la "
    "herramienta con un script mejorado.\n"
    "4. Cuando estés satisfecho (o se acaben las iteraciones), responde con un "
    "resumen breve en texto SIN llamar a la herramienta.\n\n"
    "Reglas del entorno de ejecución:\n"
    "- El kit de realismo está precargado como `r` (y `realism`). NO uses "
    "`import realism`.\n"
    "- La ruta de salida está en la variable OUTPUT_PATH. Renderiza ahí.\n"
    "- Empieza casi siempre con r.clear_scene() y r.setup_cycles().\n\n"
    + full_reference()
)


def _load_realism_source() -> str:
    with open(REALISM_SOURCE_PATH, "r", encoding="utf-8") as fh:
        return fh.read()


def _build_full_script(generated: str, output_path: str) -> str:
    """Antepone el kit de realismo y expone `r` para el script generado."""
    preamble = (
        _load_realism_source()
        + "\n\nimport sys as _sys\n"
        + "r = _sys.modules[__name__]\n"
        + "realism = r\n"
        + f"OUTPUT_PATH = {output_path!r}\n"
        + "# --- script generado por Claude ---\n"
    )
    return preamble + generated


def _run_blender(blender: str, script_path: str, timeout: int) -> tuple[bool, str]:
    try:
        proc = subprocess.run(
            [blender, "--background", "--python", script_path],
            capture_output=True, text=True, timeout=timeout,
        )
    except FileNotFoundError:
        return False, (f"No se encontró Blender ('{blender}'). Instálalo o pasa "
                       "--blender con la ruta al ejecutable.")
    except subprocess.TimeoutExpired:
        return False, f"Blender superó el tiempo límite de {timeout}s."

    output = (proc.stdout or "") + "\n" + (proc.stderr or "")
    if proc.returncode != 0 or "Traceback (most recent call last)" in output:
        # Devuelve solo la cola relevante para no saturar el contexto.
        tail = "\n".join(output.strip().splitlines()[-40:])
        return False, tail
    return True, output


def _image_block(path: str) -> dict:
    with open(path, "rb") as fh:
        data = base64.standard_b64encode(fh.read()).decode("ascii")
    return {
        "type": "image",
        "source": {"type": "base64", "media_type": "image/png", "data": data},
    }


def generate_headless(prompt: str, output: str, blender: str,
                      max_iterations: int, max_repairs: int,
                      samples: int, timeout: int) -> bool:
    client = anthropic.Anthropic()
    messages = [{
        "role": "user",
        "content": (
            f"Crea un objeto/escena 3D ultra realista: {prompt}\n\n"
            f"Renderiza a máxima calidad (usa r.setup_cycles con samples≈{samples}). "
            f"Tienes hasta {max_iterations} iteraciones de refinamiento."
        ),
    }]

    render_path = os.path.join(tempfile.gettempdir(), "claude3d_work.png")
    iterations = 0
    repairs = 0
    last_success = False

    while True:
        with client.messages.stream(
            model=MODEL,
            max_tokens=16000,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            tools=[RENDER_TOOL],
            messages=messages,
        ) as stream:
            response = stream.get_final_message()

        messages.append({"role": "assistant", "content": response.content})

        tool_uses = [b for b in response.content if b.type == "tool_use"]
        text = "".join(b.text for b in response.content if b.type == "text")

        if not tool_uses:
            if text:
                print("\n" + text)
            break

        tool_results = []
        for tu in tool_uses:
            script = tu.input.get("script", "")
            notes = tu.input.get("notes", "")
            if notes:
                print(f"\n[iteración {iterations + 1}] {notes}")

            full_script = _build_full_script(script, render_path)
            with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False,
                                             encoding="utf-8") as tf:
                tf.write(full_script)
                script_file = tf.name

            print("  Ejecutando Blender…")
            ok, log = _run_blender(blender, script_file, timeout)
            os.unlink(script_file)

            if ok and os.path.exists(render_path):
                last_success = True
                iterations += 1
                # Guarda una copia del render actual como salida final.
                _copy(render_path, output)
                print(f"  ✓ Render OK → {output}")
                if iterations >= max_iterations:
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tu.id,
                        "content": [
                            {"type": "text", "text": (
                                "Render correcto (imagen adjunta). Se ha alcanzado "
                                "el límite de iteraciones: da tu resumen final sin "
                                "volver a llamar a la herramienta.")},
                            _image_block(render_path),
                        ],
                    })
                else:
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tu.id,
                        "content": [
                            {"type": "text", "text": (
                                "Render correcto (imagen adjunta). Evalúa el "
                                "realismo y mejóralo si puedes; si ya es excelente, "
                                "responde con tu resumen final sin llamar a la "
                                "herramienta.")},
                            _image_block(render_path),
                        ],
                    })
            else:
                repairs += 1
                print(f"  ✗ Error en Blender (reparación {repairs}/{max_repairs})")
                if repairs > max_repairs:
                    print("  Se agotaron los intentos de reparación.")
                    print(log)
                    return last_success
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tu.id,
                    "is_error": True,
                    "content": (
                        "El script falló al ejecutarse en Blender. Corrígelo y "
                        "vuelve a intentarlo.\n\n" + log
                    ),
                })

        messages.append({"role": "user", "content": tool_results})

    return last_success


def _copy(src: str, dst: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    with open(src, "rb") as s, open(dst, "wb") as d:
        d.write(s.read())


def generate_live(prompt: str, output: str, max_iterations: int,
                  max_repairs: int, samples: int) -> bool:
    """Modo en vivo: controla un Blender abierto con el add-on Claude3D."""
    from bridge_client import BlenderBridge, BridgeError

    bridge = BlenderBridge()
    if not bridge.ping():
        print("No hay Blender en vivo. Abre Blender, activa Claude3D e inicia "
              "el servidor, o usa el modo headless (sin --live).", file=sys.stderr)
        return False

    client = anthropic.Anthropic()
    messages = [{
        "role": "user",
        "content": (f"En la sesión de Blender abierta, crea un objeto/escena 3D "
                    f"ultra realista: {prompt}. Renderiza con samples≈{samples}."),
    }]
    render_path = os.path.join(tempfile.gettempdir(), "claude3d_live.png")
    iterations = repairs = 0
    last_success = False

    while True:
        with client.messages.stream(
            model=MODEL, max_tokens=16000, thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT, tools=[RENDER_TOOL], messages=messages,
        ) as stream:
            response = stream.get_final_message()
        messages.append({"role": "assistant", "content": response.content})

        tool_uses = [b for b in response.content if b.type == "tool_use"]
        text = "".join(b.text for b in response.content if b.type == "text")
        if not tool_uses:
            if text:
                print("\n" + text)
            break

        tool_results = []
        for tu in tool_uses:
            script = tu.input.get("script", "")
            notes = tu.input.get("notes", "")
            if notes:
                print(f"\n[iteración {iterations + 1}] {notes}")
            # Inyecta OUTPUT_PATH en la sesión en vivo antes del script.
            code = f"OUTPUT_PATH = {render_path!r}\n" + script
            try:
                bridge.execute_code(code)
                ok, log = True, ""
            except BridgeError as exc:
                ok, log = False, str(exc)

            if ok:
                last_success = True
                iterations += 1
                _copy(render_path, output) if os.path.exists(render_path) else None
                print(f"  ✓ Ejecutado en vivo → {output}")
                content = [{"type": "text", "text": "Ejecutado correctamente."}]
                if os.path.exists(render_path):
                    content.append(_image_block(render_path))
                if iterations >= max_iterations:
                    content[0]["text"] += " Límite de iteraciones: da tu resumen final."
                tool_results.append({"type": "tool_result",
                                     "tool_use_id": tu.id, "content": content})
            else:
                repairs += 1
                if repairs > max_repairs:
                    print(log)
                    return last_success
                tool_results.append({"type": "tool_result", "tool_use_id": tu.id,
                                     "is_error": True,
                                     "content": "Falló en Blender:\n" + log})
        messages.append({"role": "user", "content": tool_results})

    return last_success


def main():
    parser = argparse.ArgumentParser(
        description="Genera objetos 3D ultra realistas con Claude + Blender.")
    parser.add_argument("prompt", help="Descripción del objeto/escena a crear.")
    parser.add_argument("-o", "--output", default="claude3d_output.png",
                        help="Ruta del render final (PNG).")
    parser.add_argument("--live", action="store_true",
                        help="Controla un Blender abierto con el add-on Claude3D.")
    parser.add_argument("--blender", default=os.environ.get("BLENDER", "blender"),
                        help="Ruta al ejecutable de Blender (modo headless).")
    parser.add_argument("--iterations", type=int, default=3,
                        help="Máximas iteraciones de refinamiento por visión.")
    parser.add_argument("--repairs", type=int, default=4,
                        help="Máximos intentos de reparación de errores.")
    parser.add_argument("--samples", type=int, default=128,
                        help="Muestras de Cycles (más = mejor calidad, más lento).")
    parser.add_argument("--timeout", type=int, default=600,
                        help="Tiempo límite por render headless (segundos).")
    args = parser.parse_args()

    print(f"Generando: {args.prompt}\nModelo: {MODEL}\n")
    if args.live:
        ok = generate_live(args.prompt, args.output, args.iterations,
                           args.repairs, args.samples)
    else:
        ok = generate_headless(args.prompt, args.output, args.blender,
                               args.iterations, args.repairs, args.samples,
                               args.timeout)

    if ok:
        print(f"\n✓ Listo. Render final: {args.output}")
    else:
        print("\n✗ No se pudo completar la generación.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
