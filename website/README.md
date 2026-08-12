# Meridian Studios — Sitio web

Landing page ultra-interactiva para un estudio de diseño y desarrollo web.
Estilo oscuro premium con acento azul, 100% en HTML/CSS/JS sin dependencias
(solo Google Fonts).

## Estructura
- `index.html` — marcado del sitio (Hero, Work, Stats, Services, About, Process, Contact, Footer)
- `styles.css` — estilos, animaciones y diseño responsivo
- `script.js` — interactividad
- `assets/logo.svg` — logotipo "M" de Meridian

## Secciones
Hero · Marquee · Work · Clientes · Stats · Services · About · Testimonios ·
Process · FAQ · Contacto · Footer

## Interacciones incluidas
- **Fondo de partículas** en el hero (canvas): red de nodos que se conecta y
  reacciona al cursor
- **Palabra rotativa con efecto scramble** en el título ("marcas / negocios / …")
- **Parallax multicapa** al hacer scroll (`data-speed`) + hero que se escala y
  desvanece al bajar
- **Marquee reactivo a la velocidad de scroll** (acelera/invierte según te mueves)
- **Revelados con clip-path** (barrido) en imágenes y con máscara en títulos
- **Línea SVG que se dibuja** conectando los pasos del proceso
- Preloader con contador · cursor personalizado con estado "VIEW" + rastro
- Barra de progreso de scroll · nav con blur + menú móvil
- Revelados escalonados al hacer scroll (IntersectionObserver)
- Contadores animados · tilt 3D en tarjetas · botones magnéticos
- FAQ acordeón · testimonios · formulario de contacto con feedback
- Respeta `prefers-reduced-motion`

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
