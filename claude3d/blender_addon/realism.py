"""Kit de herramientas de realismo para Blender (bpy).

Este módulo es el "motor de realismo" compartido por todo Claude3D. Ofrece
funciones de alto nivel para construir escenas ultra realistas sin tener que
recordar la API de bajo nivel de Blender: materiales PBR, iluminación de
estudio, entornos HDRI, cámara con encuadre automático, subdivisión/suavizado
y renderizado con Cycles + denoising.

Está pensado para ser usado de dos formas:

1. Dentro de Blender (lo importa el add-on `claude_bridge`), de modo que Claude
   puede llamar a `r.pbr_material(...)`, `r.studio_lighting()`, etc. desde el
   código que ejecuta en vivo.
2. Como preámbulo en scripts headless generados por `generate.py`: su código
   fuente se antepone al script generado para que las mismas funciones estén
   disponibles al lanzar `blender --background --python script.py`.

Todas las funciones asumen que se ejecutan dentro de Blender (con `bpy`
disponible). El módulo se puede *leer* como texto fuera de Blender sin
problemas; solo falla si se intenta *ejecutar* sin `bpy`.
"""

from __future__ import annotations

import math

try:  # Solo existe dentro de Blender.
    import bpy
    import mathutils
except Exception:  # pragma: no cover - permite leer el módulo fuera de Blender.
    bpy = None
    mathutils = None


# ---------------------------------------------------------------------------
# Gestión de escena
# ---------------------------------------------------------------------------
def clear_scene(keep_camera: bool = False, keep_lights: bool = False) -> None:
    """Vacía la escena (objetos, materiales huérfanos) para empezar de cero."""
    for obj in list(bpy.data.objects):
        if keep_camera and obj.type == "CAMERA":
            continue
        if keep_lights and obj.type == "LIGHT":
            continue
        bpy.data.objects.remove(obj, do_unlink=True)

    # Limpia datos huérfanos para evitar fugas de memoria entre generaciones.
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for datum in list(block):
            if datum.users == 0:
                block.remove(datum)


def setup_cycles(
    samples: int = 128,
    denoise: bool = True,
    resolution: tuple[int, int] = (1920, 1080),
    exposure: float = 1.0,
    transparent: bool = False,
) -> None:
    """Configura Cycles con denoising y color management filmico.

    Cycles es el motor de trazado de rayos de Blender: es la clave del
    fotorrealismo (iluminación global, reflejos, refracciones reales).
    """
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"

    # Usa GPU si está disponible; si no, cae a CPU sin fallar.
    prefs = bpy.context.preferences.addons.get("cycles")
    if prefs is not None:
        try:
            cprefs = prefs.preferences
            for backend in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
                try:
                    cprefs.compute_device_type = backend
                    cprefs.get_devices()
                    if any(d.type != "CPU" for d in cprefs.devices):
                        scene.cycles.device = "GPU"
                        for d in cprefs.devices:
                            d.use = True
                        break
                except (TypeError, RuntimeError):
                    continue
        except Exception:
            pass  # Sin GPU disponible: se renderiza por CPU.

    scene.cycles.samples = samples
    scene.cycles.use_denoising = denoise
    scene.cycles.use_adaptive_sampling = True

    scene.render.resolution_x, scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparent

    # Color management filmico: rango dinámico realista en vez de recortes duros.
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = math.log2(exposure) if exposure > 0 else 0.0


# ---------------------------------------------------------------------------
# Materiales PBR
# ---------------------------------------------------------------------------
def pbr_material(
    name: str,
    base_color: tuple[float, float, float] = (0.8, 0.8, 0.8),
    metallic: float = 0.0,
    roughness: float = 0.5,
    specular: float = 0.5,
    ior: float = 1.45,
    transmission: float = 0.0,
    emission_color: tuple[float, float, float] | None = None,
    emission_strength: float = 0.0,
    alpha: float = 1.0,
    coat: float = 0.0,
):
    """Crea un material PBR basado en Principled BSDF.

    PBR (Physically Based Rendering) es lo que hace que un material se vea
    creíble bajo cualquier luz. Parámetros clave:
      - base_color: color difuso (RGB 0-1).
      - metallic: 0 = dieléctrico (plástico, madera), 1 = metal.
      - roughness: 0 = espejo pulido, 1 = totalmente mate.
      - transmission: 1 = transparente (vidrio, agua) — combinar con ior.
      - emission_*: para materiales que emiten luz (pantallas, neón).
      - coat: capa de barniz encima (coches, cerámica).
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf is None:  # Algunas versiones limpian los nodos por defecto.
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")
        output = nodes.get("Material Output") or nodes.new("ShaderNodeOutputMaterial")
        mat.node_tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    def _set(input_name, value):
        # Los nombres de inputs cambian entre versiones de Blender; se ignora
        # con seguridad lo que no exista en esta versión.
        if input_name in bsdf.inputs:
            bsdf.inputs[input_name].default_value = value

    _set("Base Color", (*base_color, 1.0))
    _set("Metallic", metallic)
    _set("Roughness", roughness)
    _set("IOR", ior)
    _set("Alpha", alpha)
    _set("Transmission Weight", transmission)   # Blender 4.x
    _set("Transmission", transmission)          # Blender 3.x
    _set("Specular IOR Level", specular)        # Blender 4.x
    _set("Specular", specular)                  # Blender 3.x
    _set("Coat Weight", coat)                   # Blender 4.x
    _set("Coat", coat)                          # Blender 3.x

    if emission_color is not None and emission_strength > 0:
        _set("Emission Color", (*emission_color, 1.0))  # Blender 4.x
        _set("Emission", (*emission_color, 1.0))        # Blender 3.x
        _set("Emission Strength", emission_strength)

    if alpha < 1.0 or transmission > 0.0:
        mat.blend_method = "BLEND"
    return mat


def apply_material(obj, mat) -> None:
    """Asigna un material a un objeto, reemplazando los existentes."""
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def add_texture_noise_roughness(mat, scale: float = 5.0, detail: float = 8.0,
                                low: float = 0.2, high: float = 0.7) -> None:
    """Añade micro-variación procedural a la rugosidad de un material.

    Las superficies reales nunca tienen rugosidad perfectamente uniforme; un
    poco de ruido procedural rompe el aspecto "CGI plástico".
    """
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    tex = nt.nodes.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = scale
    tex.inputs["Detail"].default_value = detail
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["To Min"].default_value = low
    ramp.inputs["To Max"].default_value = high
    nt.links.new(tex.outputs["Fac"], ramp.inputs["Value"])
    if "Roughness" in bsdf.inputs:
        nt.links.new(ramp.outputs["Result"], bsdf.inputs["Roughness"])


# ---------------------------------------------------------------------------
# Iluminación
# ---------------------------------------------------------------------------
def hdri_world(hdri_path: str | None = None,
               color: tuple[float, float, float] = (0.05, 0.05, 0.05),
               strength: float = 1.0) -> None:
    """Configura el mundo con un HDRI (si se da ruta) o un color plano.

    Un HDRI (imagen de rango dinámico alto del entorno) es la forma más rápida
    de obtener iluminación y reflejos realistas: aporta luz, color y reflejos
    de un entorno real de 360 grados.
    """
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()

    output = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = strength
    nt.links.new(bg.outputs["Background"], output.inputs["Surface"])

    if hdri_path:
        env = nt.nodes.new("ShaderNodeTexEnvironment")
        try:
            env.image = bpy.data.images.load(hdri_path, check_existing=True)
            nt.links.new(env.outputs["Color"], bg.inputs["Color"])
            return
        except Exception:
            pass  # Ruta inválida: cae al color plano.
    bg.inputs["Color"].default_value = (*color, 1.0)


def _add_area_light(name, location, rotation, energy, size, color=(1, 1, 1)):
    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.energy = energy
    light_data.size = size
    light_data.color = color
    obj = bpy.data.objects.new(name, light_data)
    obj.location = location
    obj.rotation_euler = rotation
    bpy.context.collection.objects.link(obj)
    return obj


def three_point_lighting(target=(0, 0, 0), key_energy: float = 1000.0,
                         warmth: float = 1.0) -> None:
    """Iluminación clásica de tres puntos (key, fill, back).

    Es el esquema estándar en fotografía y cine: una luz principal fuerte,
    una de relleno suave para las sombras y una de contra para separar el
    objeto del fondo.
    """
    _add_area_light("Key", (4, -4, 6), (math.radians(45), 0, math.radians(45)),
                    key_energy, 3.0, color=(1.0, 0.95 * warmth, 0.9 * warmth))
    _add_area_light("Fill", (-5, -2, 3), (math.radians(60), 0, math.radians(-30)),
                    key_energy * 0.35, 5.0, color=(0.9, 0.95, 1.0))
    _add_area_light("Back", (0, 5, 5), (math.radians(-60), 0, 0),
                    key_energy * 0.5, 2.0)


def studio_lighting(strength: float = 1.0) -> None:
    """Set de estudio: fondo neutro suave + tres puntos. Ideal para productos."""
    hdri_world(color=(0.5, 0.5, 0.5), strength=0.3 * strength)
    three_point_lighting(key_energy=1200.0 * strength)


def sun_light(energy: float = 3.0, angle_deg: float = 45.0,
              rotation_deg: float = 30.0) -> None:
    """Luz solar direccional para escenas de exterior."""
    data = bpy.data.lights.new(name="Sun", type="SUN")
    data.energy = energy
    data.angle = math.radians(0.5)  # Sombras suaves realistas.
    obj = bpy.data.objects.new("Sun", data)
    obj.rotation_euler = (math.radians(angle_deg), 0, math.radians(rotation_deg))
    bpy.context.collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------------------
# Cámara
# ---------------------------------------------------------------------------
def add_camera(location=(7, -7, 5), look_at=(0, 0, 0),
               lens: float = 50.0, dof_target=None, f_stop: float = 2.8):
    """Crea una cámara apuntando a `look_at`, opcionalmente con profundidad de campo.

    Una distancia focal de ~50mm imita la visión humana. La profundidad de
    campo (dof) añade desenfoque fotográfico que da sensación de realismo.
    """
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = lens
    cam = bpy.data.objects.new("Camera", cam_data)
    cam.location = location
    bpy.context.collection.objects.link(cam)

    # Apunta la cámara al objetivo con una restricción de seguimiento.
    direction = mathutils.Vector(look_at) - mathutils.Vector(location)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    if dof_target is not None:
        cam_data.dof.use_dof = True
        cam_data.dof.aperture_fstop = f_stop
        dist = (mathutils.Vector(look_at) - mathutils.Vector(location)).length
        cam_data.dof.focus_distance = dist

    bpy.context.scene.camera = cam
    return cam


def frame_selected(camera=None, margin: float = 1.25) -> None:
    """Ajusta la cámara para encuadrar todos los objetos de malla de la escena."""
    cam = camera or bpy.context.scene.camera
    if cam is None:
        return
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    if not meshes:
        return
    # Centro y radio aproximado del conjunto.
    coords = []
    for o in meshes:
        for corner in o.bound_box:
            coords.append(o.matrix_world @ mathutils.Vector(corner))
    center = sum(coords, mathutils.Vector()) / len(coords)
    radius = max((c - center).length for c in coords)

    direction = (cam.location - center).normalized()
    cam.location = center + direction * radius * 2.5 * margin
    cam.rotation_euler = (center - cam.location).to_track_quat("-Z", "Y").to_euler()


# ---------------------------------------------------------------------------
# Geometría y acabado
# ---------------------------------------------------------------------------
def smooth_shade(obj) -> None:
    """Activa sombreado suave (normales interpoladas) en un objeto de malla."""
    for poly in obj.data.polygons:
        poly.use_smooth = True


def add_subsurf(obj, levels: int = 2, render_levels: int | None = None):
    """Añade un modificador de subdivisión para superficies orgánicas suaves."""
    mod = obj.modifiers.new("Subdivision", "SUBSURF")
    mod.levels = levels
    mod.render_levels = render_levels if render_levels is not None else levels + 1
    smooth_shade(obj)
    return mod


def bevel_edges(obj, width: float = 0.02, segments: int = 3):
    """Bisela las aristas: las aristas perfectamente afiladas delatan el CGI.

    En el mundo real ninguna arista es infinitamente afilada; un bisel sutil
    captura reflejos de luz y hace que el objeto se vea manufacturado.
    """
    mod = obj.modifiers.new("Bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    return mod


def ground_plane(size: float = 50.0, color=(0.2, 0.2, 0.2), roughness: float = 0.7):
    """Añade un suelo grande con material para recibir sombras y reflejos."""
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "Ground"
    mat = pbr_material("Ground", base_color=color, roughness=roughness)
    apply_material(plane, mat)
    return plane


# ---------------------------------------------------------------------------
# Renderizado
# ---------------------------------------------------------------------------
def render(output_path: str, samples: int | None = None) -> str:
    """Renderiza la escena actual a un PNG y devuelve la ruta.

    Si aún no se ha configurado Cycles, aplica una configuración razonable.
    """
    scene = bpy.context.scene
    if scene.render.engine != "CYCLES":
        setup_cycles(samples=samples or 128)
    elif samples is not None:
        scene.cycles.samples = samples

    if scene.camera is None:
        add_camera()

    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)
    return output_path
