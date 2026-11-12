# Auditoría de diseño: NEAPOLIS (2026-11-11)

Criterios usados:
- Skill **landing-page-design** de Elaya (instalada en `.claude/skills/landing-page-design`).
- Skill **design-taste-frontend**.
- El proyecto de referencia del vídeo de midudev ("Crea una Landing ESPECTACULAR con Claude Code", repositorio `midudev/mcp-higgsfield-landing`): vídeo controlado por el scroll, clips con primer y último fotograma, y el primer fotograma de cada clip como imagen de fondo.

## 1. Transición vídeo → página (la queja principal)

| Problema | Causa | Arreglo |
|---|---|---|
| El vídeo "se traba" al final | Había 0,8 s de fotograma congelado al final y el traspaso esperaba al evento `ended`. | El traspaso arranca 2 s antes del final, mientras la cámara todavía se mueve, guiándose por el reloj del vídeo (`requestAnimationFrame` sobre `currentTime`). |
| Cambio brusco de encuadre | La foto del hero no coincidía con el último fotograma del vídeo. | Medí por comparación de imagen dónde cae la foto dentro del último fotograma (`introFilm.heroWindow` en `media.ts`). El vídeo crece hasta que esa ventana coincide píxel a píxel con la foto y luego se funde con ella. |
| "Pum, entra todo de golpe" | Al pasar a `ready` aparecían a la vez la cabecera, el rail, el texto, los marcadores y el oscurecimiento, y además se recalculaba todo ScrollTrigger. | Entrada coreografiada con `revealTimeline` (en `animations/motion.ts`): oscurecimiento (0 s) → "Welcome to" (0,25 s) → título con máscara (0,4 s) → texto (0,75 s) → botones (0,95 s) → cabecera (1,15 s) → rail (1,35 s) → marcadores (1,6 s y siguientes). `ScrollTrigger.refresh()` se ejecuta al terminar (2,6 s), nunca durante la entrada. |

## 2. Cambios por la skill landing-page-design

- **Curva única** `cubic-bezier(0.22, 1, 0.36, 1)` (B7) en todas las entradas de Motion y en los hovers.
- **Tamaños de letra** ajustados a la escala de Tailwind (B1): 13 valores arbitrarios (`text-[13px]` y similares) corregidos con `tools/snap-type.mjs`.
- **Título del hero** con degradado de texto #FFF → #9B9B9B (B5), máscara por líneas y ancho máximo de 680 px. Sin pesos ultra negritos.
- **Sin guiones en el texto** (B1): Eco-Factory → Eco Factory; Eco-Jobs → Green Jobs; zero-emission y solar-powered reescritos.
- **Frase destacada obligatoria** (B11): nueva sección `Tagline`, con las palabras iluminándose una a una con el scroll. Usa comparativos B1.
- **Estados** (B9 y B10): foco visible en los botones, `:active` con `scale(0.98)`, enlace "Skip to content", 404 propia (`app/not-found.tsx`) y favicon (`app/icon.tsx`).
- **Texto legible:** la navegación y las viñetas de las tarjetas suben un paso de escala (`text-sm`).

## 3. Excepciones decididas (la skill dice que el usuario manda)

- **Fondos:** la skill limita los fondos oscuros a #000/#181818/…; se mantiene **tu paleta** #0B0F14/#111827/#161B22, que pediste expresamente.
- **Degradados de fondo:** la skill los prohíbe, pero se mantienen los **velos** sobre la fotografía. Son necesarios para leer el texto encima de la foto y el proyecto de referencia hace lo mismo. No hay degradados decorativos.
- **Part A (conversión: FAQ, prueba social, riesgo):** no aplica. Es una presentación académica, no una página de venta.

## 4. Realismo de las transiciones entre escenas

Hoy el paso de la escena 1 a la 2 es un **zoom sobre la foto + enlace en el mismo punto**: queda bien, pero no es un vuelo real. Para que sea realista como en la referencia:

1. Genera un clip de 5 a 8 s con **primer fotograma = `city-overview`** y **último fotograma = `station`** (Hailuo/MiniMax o Kling, función "first & last frame"), en 16:9 y sin audio.
2. Codifícalo para que avance fluido con el scroll:
   `ffmpeg -i clip.mp4 -an -vf scale=1920:-2 -c:v libx264 -preset slow -crf 22 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart public/media/flight-1-2.mp4`
3. En `src/assets/media.ts`: `flightClip = { src: "/media/flight-1-2.mp4", width: 1920, height: 1080 }`.

La web ya está preparada: carga el clip como blob, lo controla con el scroll y al final cede el paso a la foto de la estación, idéntica al último fotograma. Las escenas 3 a 5 seguirían el mismo patrón, con un clip por tramo.

## 5. Pendiente

- Imágenes propias para las escenas 3 a 5. Ninguna imagen muestra un colegio.
- Rótulos en español en las fotos y el vídeo.
- Probar el traspaso de la intro en Chrome con la pestaña visible. El panel de Claude pausa los vídeos cuando está oculto, así que la prueba visual del traspaso no se pudo cerrar desde aquí; la lógica y el encaje medido sí están verificados.
