# MIJA Snacks — Sitio web (Crunchy Maíz Tostado)

Landing page de marca/catálogo para **MIJA Snacks**, producto de maíz tostado
_Crunchy Maíz Tostado_ en sus tres sabores: **Con Sal**, **BBQ** y **Chili-Limón**.

Sitio estático, autónomo (sin dependencias de build) y bilingüe (ES/EN),
con scroll suave, animaciones al hacer scroll, parallax y transiciones de color por sabor.

## Estructura

```
mija-snacks/
├── index.html          # Página única con todas las secciones
├── css/styles.css      # Sistema de diseño + animaciones
├── js/i18n.js          # Diccionario bilingüe ES / EN
├── js/main.js          # Interacciones (scroll, parallax, idioma, temas)
└── assets/             # Logo, emblema y granos (SVG vectoriales)
    ├── logo.svg
    ├── emblem.svg
    ├── kernels.svg
    ├── kernel.svg
    └── favicon.svg
```

## Cómo verlo localmente

Al usar `fetch`/módulos no es necesario; aun así conviene servirlo por HTTP:

```bash
cd mija-snacks
python3 -m http.server 8000
# abre http://localhost:8000
```

O simplemente abre `index.html` en el navegador (todo el contenido va embebido).

## Características

- **Bilingüe ES/EN** con selector en la barra de navegación (recuerda la elección).
- **Efectos de scroll**: barra de progreso, aparición progresiva de elementos,
  parallax de granos en el hero y contadores animados.
- **Sección de sabores** con cambio fluido de color de fondo según el sabor visible
  y bolsas doypack reconstruidas en CSS/SVG (con leve inclinación 3D al pasar el cursor).
- **Responsive** con menú móvil y respeto a `prefers-reduced-motion`.
- **Identidad vectorial**: logo, emblema y granos hechos en SVG (nítidos en cualquier
  resolución, sin imágenes externas).

## Publicar

Es un sitio estático: se puede publicar tal cual en **GitHub Pages**, **Netlify**,
**Vercel** o cualquier hosting estático apuntando a la carpeta `mija-snacks/`.

## Notas

- Los colores, textos, correo de contacto y enlaces de redes sociales son marcadores
  editables en `index.html` / `js/i18n.js`.
- El correo `hola@mijasnacks.com` y los enlaces sociales (`#`) son de ejemplo:
  reemplázalos por los reales.
