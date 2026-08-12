# Meridian Studios — Sitio web

Landing page ultra-interactiva para un estudio de diseño y desarrollo web.
Estilo oscuro premium con acento azul, 100% en HTML/CSS/JS sin dependencias
(solo Google Fonts).

## Estructura
- `index.html` — marcado del sitio (Hero, Work, Stats, Services, About, Process, Contact, Footer)
- `styles.css` — estilos, animaciones y diseño responsivo
- `script.js` — interactividad
- `assets/logo.svg` — logotipo "M" de Meridian

## Interacciones incluidas
- Preloader con contador
- Cursor personalizado con estados (hover / view)
- Barra de progreso de scroll
- Nav con blur al hacer scroll + menú móvil
- Animaciones de revelado al hacer scroll (IntersectionObserver)
- Contadores animados en las estadísticas
- Efecto tilt 3D en tarjetas de proyectos y about
- Parallax del glow de fondo y del visual del hero
- Marquee infinito
- Formulario de contacto con feedback

## Cómo verlo
Abre `index.html` en el navegador, o sirve la carpeta:

```bash
cd website
python3 -m http.server 8000
# http://localhost:8000
```

## Personalizar
- **Color de marca:** variables `--blue` / `--blue-2` en `styles.css`.
- **Textos y proyectos:** edita directamente `index.html`.
- **Fuentes:** `Space Grotesk` (títulos) e `Inter` (cuerpo).
