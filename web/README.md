# NEAPOLIS: experiencia web inmersiva

Recorrido cinematográfico por scroll de la ciudad ideal **Neapolis** (proyecto de inglés B1).
Stack: Next.js 15 (App Router + Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion (paquete `motion`), GSAP + ScrollTrigger y Lenis (scroll suave).

## 1. Ejecutar en local desde cero

Requisitos: **Node.js 20 o superior** (probado con Node 24) y npm.

```bash
cd web
npm install
npm run dev
```

Abre **http://localhost:3000**.

| Comando | Para qué sirve |
|---|---|
| `npm install` | Instala las dependencias (solo la primera vez o si cambia `package.json`). |
| `npm run dev` | Servidor de desarrollo con recarga en caliente (Turbopack). |
| `npm run typecheck` | Comprueba los tipos de TypeScript. |
| `npm run build` y luego `npm start` | Build de producción y servidor de producción. |

> **Si el proyecto está en un disco exFAT** (por ejemplo, un disco externo o el `D:` de este equipo), `npm run build` falla con `EISDIR: illegal operation on a directory, readlink`. Es un límite de Node con exFAT, no un error del código. `npm run dev` funciona igual. Para hacer el build de producción, copia la carpeta `web/` a un disco NTFS (por ejemplo `C:\proyectos\neapolis`) o despliega en Vercel.

Crear el proyecto desde cero no hace falta: ya está creado. Como referencia, se montó a mano con `npm i next@15 react@19 react-dom@19 motion gsap @gsap/react lenis @phosphor-icons/react geist` y `npm i -D typescript @types/react @types/react-dom @types/node tailwindcss @tailwindcss/postcss`.

## 2. Estructura

```
web/
├─ public/media/            imágenes y vídeos (lo que sirve el navegador)
├─ src/
│  ├─ app/                  layout.tsx (fuentes, metadatos), page.tsx
│  ├─ assets/
│  │  ├─ media.ts           MANIFIESTO DE MEDIOS: rutas, tamaños y puntos de enfoque
│  │  └─ content.ts         TODOS los textos en inglés, por escena
│  ├─ animations/
│  │  ├─ gsap.ts            registro único de GSAP + ScrollTrigger
│  │  └─ motion.ts          variantes y curvas de Framer Motion
│  ├─ hooks/                useLenis, useImagePreload, useActiveScene
│  ├─ components/
│  │  ├─ experience/        Provider (fases), Loader, IntroFilm, Experience
│  │  ├─ layout/            Header, ProgressRail
│  │  └─ ui/                CoverImage, Hotspot, FeatureCard, GrammarChip, Icon
│  ├─ sections/             HeroFlight (escenas 1→2), ZoomScene(s) (3–5), Finale
│  └─ styles/globals.css    tokens de diseño (Tailwind v4 @theme), glass, cover-box
├─ next.config.ts           configuración de Next.js (imágenes, caché de /media)
└─ postcss.config.mjs       Tailwind v4 (no hay tailwind.config.js: los tokens están en globals.css)
```

**Cómo funciona la experiencia**
1. **Loader**: muestra "NEAPOLIS" y "Loading Smart City Systems...". La barra refleja la carga real de las dos imágenes y del vídeo.
2. **Intro**: un segundo después de terminar la carga se reproduce el vídeo (silenciado, porque los navegadores bloquean el autoplay con sonido). Al acabar, el vídeo crece de formato cine a pantalla completa y se funde con la foto del hero, que tiene el mismo encuadre. Mientras tanto, el scroll está bloqueado.
3. **HeroFlight**: una sección alta con un escenario fijo (sticky). Una sola línea de tiempo de GSAP, controlada por el scroll, mueve la cámara: zoom hacia la estación en la panorámica, enlace con la foto de la estación en el mismo punto, panel y tarjetas. La cámara solo avanza, así que al subir el vuelo se reproduce al revés sin saltos.
4. **ZoomScene**: cada escena se solapa con la anterior y aparece con un fundido encima, de modo que nunca hay un corte de página.
5. **Reparto entre librerías**: GSAP mueve las escenas con el scroll y Framer Motion anima la interfaz (entradas, navegación). Nunca animan el mismo elemento.

## 3. Cambiar imágenes

1. Copia tu imagen a `public/media/` (mejor en `.webp`; JPG o PNG también sirven).
2. Abre `src/assets/media.ts` y cambia `src`, `width` y `height` de la entrada correspondiente:
   - `cityOverview`: escena 1, la panorámica.
   - `station`: escena 2, el final del vuelo.
3. Si cambia la composición, ajusta los puntos, que son **fracciones de la imagen** de 0 a 1 (píxel ÷ tamaño):
   - `flightTargets.stationInOverview` / `stationInStation`: dónde está la estación en cada foto. Con ellos se alinea el enlace entre las dos.
   - `hero.hotspots[].at` y `transport.cards[].anchor` en `src/assets/content.ts`.
4. Escenas 3 a 5: en `zoomScenes`, dentro de `content.ts`, cambia `image` (importa una nueva entrada de `media`) y `focus`. Ahora mismo encuadran detalles de la panorámica.

Convertir a WebP con ffmpeg: `ffmpeg -i foto.png -c:v libwebp -quality 88 public/media/foto.webp`

## 4. Cambiar o añadir vídeos

- **Intro**: sustituye `public/media/intro.mp4`, actualiza `introFilm.width` y `height` en `media.ts` y genera el póster (primer fotograma):
  `ffmpeg -i intro.mp4 -frames:v 1 -c:v libwebp -quality 90 public/media/intro-poster.webp`
- Codificación recomendada (sin audio, arranque rápido, búsqueda fluida):
  `ffmpeg -i fuente.mp4 -an -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -g 8 -movflags +faststart public/media/intro.mp4`
- **Vídeo controlado por el scroll** (un vídeo que avanza al hacer scroll): añade un `<video muted playsInline preload="auto">` dentro del escenario sticky de una sección y, en su timeline de GSAP, `tl.to(video, { currentTime: video.duration, ease: "none" })`. Codifícalo con `-g 8` o menor para que la búsqueda de fotogramas sea fluida.
- El navegador guarda `/media/*` en caché durante un año (`next.config.ts`). Si sustituyes un archivo y ves la versión vieja, cambia el nombre del archivo.

## 5. Accesibilidad y rendimiento

- `prefers-reduced-motion`: no hay intro ni zoom; las escenas se cuentan solo con fundidos y el scroll es el nativo.
- Solo se animan `transform` y `opacity`. El desenfoque de movimiento es de 1,5 px y solo en la capa de la panorámica.
- Las escenas fuera de pantalla se cargan con `next/dynamic`; las imágenes usan `next/image` con AVIF/WebP y `sizes` ajustado.
- El vídeo de la intro se precarga mientras se muestra el loader.
