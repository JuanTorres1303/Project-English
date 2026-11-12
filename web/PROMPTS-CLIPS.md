# Prompts para los clips del recorrido (método de midudev/mcp-higgsfield-landing)

**Regla:** un clip por cada par de escenas. **Primer fotograma** = la imagen de la escena actual; **último fotograma** = la imagen de la escena siguiente. Mismo modelo, misma duración y mismos ajustes en todos los clips:
- formato 16:9
- 1080p si es posible
- sin sonido
- de 5 a 8 s

Para encadenarlos se concatenan directamente, sin transiciones.

## 0. Imágenes de las escenas 3, 4 y 5 (hacer antes de los clips)

Genera cada imagen **a partir de `public/media/flight-end.webp`** (imagen a imagen o "reference image"). Así conservan la misma luz de atardecer, el estilo y la ciudad.

- **Escena 3, Schools & Green Jobs:**
  `Same city, same golden sunset light and photorealistic aerial style. A modern green school campus with glass classrooms, rooftop gardens and solar panels next to a clean eco factory with green roofs. Students walking, no text, no signs, 16:9.`
- **Escena 4, Health & Fun:**
  `Same city, same golden sunset light and photorealistic aerial style. A large central park with trees, a lake and fountains, people doing outdoor sports, a modern smart hospital with a green roof at the edge of the park. No text, no signs, 16:9.`
- **Escena 5, Daily Life:**
  `Same city at dusk, warm lights turning on in solar homes and apartment towers with balconies full of plants, the elevated metro passing, cyclists going home. Calm, clean air. No text, no signs, 16:9.`

> Pon "no text, no signs" para que no salgan más rótulos en español.

## 1. Clip 2 → 3 (estación → colegios)

Primer fotograma: `flight-end.webp` · Último fotograma: imagen de la escena 3

```
16:9 widescreen, smooth cinematic aerial drone shot over a sustainable city at golden sunset, one continuous take. The camera glides slowly forward above the elevated metro station, rises gently over the rooftops and descends toward the green school campus and the eco factory with solar roofs. Gentle ease in and ease out, settling exactly on the final frame. Constant focal length, no cuts, no fades, no zoom jumps, no camera shake. Preserve the architecture, colors and warm light exactly. Photorealistic. Silent video, no audio.
```

## 2. Clip 3 → 4 (colegios → parque y hospital)

```
16:9 widescreen, smooth cinematic aerial drone shot over a sustainable city at golden sunset, one continuous take. The camera turns gently away from the school campus and flies forward over tree lined streets toward the large central park with the lake, fountains and the smart hospital at its edge. Gentle ease in and ease out, settling exactly on the final frame. Constant focal length, no cuts, no fades, no zoom jumps, no camera shake. Preserve the architecture, colors and warm light exactly. Photorealistic. Silent video, no audio.
```

## 3. Clip 4 → 5 (parque → vida diaria al anochecer)

```
16:9 widescreen, smooth cinematic aerial drone shot over a sustainable city, one continuous take. The camera rises slowly from the central park and drifts forward over residential towers with plant covered balconies while the sunset turns into dusk and warm windows light up. Gentle ease in and ease out, settling exactly on the final frame. Constant focal length, no cuts, no fades, no zoom jumps, no camera shake. Photorealistic. Silent video, no audio.
```

## Negative prompt (todos)

```
cut, scene change, fade, dissolve, crossfade, morphing, warping geometry, flicker, sudden zoom, fisheye distortion, shaky handheld, fast motion, text, signs, letters, watermark, black bars, letterbox, vertical framing, audio, music
```

## Qué hacer con cada clip (lo hago yo cuando me lo pases)

1. Dejar el `.mp4` en la carpeta del proyecto.
2. Quitar la marca de agua, si la tiene:
   `node tools/intro/dewatermark-clip.mjs in.mp4 limpio.mp4 X Y ANCHO ALTO`
3. Codificarlo para el scroll (GOP 6):
   `ffmpeg -i limpio.mp4 -an -vf scale=1920:1080:flags=lanczos -c:v libx264 -preset slow -crf 20 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart web/public/media/flight-2-3.mp4`
4. Sacar su último fotograma como imagen de la escena siguiente:
   `ffmpeg -sseof -0.05 -i flight-2-3.mp4 -frames:v 1 -c:v libwebp -quality 90 web/public/media/scene3.webp`
5. En `src/assets/world.ts`:
   - `transport.clipToNext` = el clip
   - `schools.still` = `scene3.webp`

Herramientas con primer y último fotograma: Hailuo/MiniMax, Kling, DeeVid, Luma, Vidu. midudev usó **MiniMax H3**, con 8 s por clip y 1080p.
