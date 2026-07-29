"""Referencia compartida del kit de realismo Claude3D.

Este texto se inyecta en el prompt de sistema de Claude (tanto en el servidor
MCP como en el generador headless) para que el modelo conozca las funciones de
alto nivel disponibles al escribir código bpy. Mantenerlo sincronizado con
`blender_addon/realism.py`.
"""

API_REFERENCE = r"""
Al escribir código de Blender (bpy) tienes disponible el módulo de realismo
como `r` (equivalente a `import realism as r`). Úsalo siempre que puedas en
lugar de reinventar la API de bajo nivel:

ESCENA
  r.clear_scene(keep_camera=False, keep_lights=False)
  r.setup_cycles(samples=128, denoise=True, resolution=(1920,1080),
                 exposure=1.0, transparent=False)

MATERIALES PBR
  mat = r.pbr_material(name, base_color=(R,G,B), metallic=0..1, roughness=0..1,
                       specular=0.5, ior=1.45, transmission=0..1,
                       emission_color=(R,G,B), emission_strength=0,
                       alpha=1.0, coat=0..1)
  r.apply_material(obj, mat)
  r.add_texture_noise_roughness(mat, scale=5, detail=8, low=0.2, high=0.7)
      # micro-variación de rugosidad -> rompe el aspecto plástico

ILUMINACIÓN
  r.hdri_world(hdri_path=None, color=(R,G,B), strength=1.0)
  r.three_point_lighting(target=(0,0,0), key_energy=1000, warmth=1.0)
  r.studio_lighting(strength=1.0)        # set de producto neutro
  r.sun_light(energy=3.0, angle_deg=45, rotation_deg=30)  # exterior

CÁMARA
  cam = r.add_camera(location=(7,-7,5), look_at=(0,0,0), lens=50,
                     dof_target=(0,0,0), f_stop=2.8)  # dof = desenfoque foto
  r.frame_selected(margin=1.25)          # encuadra toda la escena

GEOMETRÍA Y ACABADO
  r.smooth_shade(obj)
  r.add_subsurf(obj, levels=2)           # superficies orgánicas suaves
  r.bevel_edges(obj, width=0.02, segments=3)  # aristas realistas (¡importante!)
  r.ground_plane(size=50, color=(0.2,0.2,0.2), roughness=0.7)

RENDER
  r.render(output_path, samples=128)     # renderiza a PNG y devuelve la ruta

Objetos base de Blender: bpy.ops.mesh.primitive_{cube,uv_sphere,cylinder,
cone,torus,plane,monkey}_add(...). Tras crear, usa bpy.context.active_object.
"""

REALISM_TIPS = r"""
CLAVES PARA MÁXIMO REALISMO (aplícalas siempre salvo que el usuario pida otra cosa):
1. Motor Cycles con denoising (r.setup_cycles) — nunca Eevee para fotorrealismo.
2. Materiales PBR correctos: metales con metallic=1, vidrio con transmission=1
   e ior~1.45, plásticos/madera con metallic=0 y roughness medio-alto.
3. Biselar TODAS las aristas duras (r.bevel_edges): las aristas perfectas
   delatan el CGI al no captar reflejos.
4. Iluminación de estudio o HDRI: los reflejos del entorno son esenciales.
5. Añadir micro-variación de rugosidad para superficies creíbles.
6. Suelo que recibe sombras/reflejos (r.ground_plane) para anclar el objeto.
7. Cámara con distancia focal ~50mm y profundidad de campo sutil.
8. Color management Filmico (ya lo hace r.setup_cycles).
9. Subdivisión + sombreado suave en formas orgánicas.
10. Composición: encuadre con r.frame_selected, objeto ligeramente descentrado.
"""


def full_reference() -> str:
    """Devuelve la referencia completa (API + consejos) para el prompt de sistema."""
    return API_REFERENCE + "\n" + REALISM_TIPS
