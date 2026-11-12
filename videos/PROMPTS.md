# Clips del recorrido (escenas 1 → 5)

Fotogramas en `videos/fotogramas/`. Un clip por cada par de imágenes:

| Clip | Primer fotograma | Último fotograma | Archivo de salida |
|---|---|---|---|
| 0 (intro) | ninguno: ver truco abajo | `1-bienvenidos-bogota.png` | `clips/0-intro.mp4` |
| 1 | `1-bienvenidos-bogota.png` | `2-estacion-banderas.png` | `clips/1-a-2.mp4` |
| 2 | `2-estacion-banderas.png` | `3-fabrica.png` | `clips/2-a-3.mp4` |
| 3 | `3-fabrica.png` | `4-hospital.png` | `clips/3-a-4.mp4` |
| 4 | `4-hospital.png` | `5-vida-diaria.png` | `clips/4-a-5.mp4` |

**Ajustes, iguales en todos los clips** (mismo modelo para que no cambie el "look"):
- formato 16:9, 1080p
- 8 s y 24 fps
- sin audio

**Si una herramienta pide el prompt más corto,** usa solo el primer párrafo de cada uno: ahí está lo esencial.
**Tu prompt original** tenía unos 4.500 caracteres; Hailuo corta en unos 2.000 y Kling en unos 2.500. Estos rondan los 1.200–1.600.

**Regla de oro:** sube siempre los fotogramas exactos de esta carpeta. El último fotograma de un clip y el primero del siguiente son el mismo archivo; por eso encajan sin corte.

---

## Clip 0 · Intro: la ciudad se construye

Casi ninguna herramienta permite poner solo el último fotograma. **Truco:** genera el vídeo **al revés**: primer fotograma = `1-bienvenidos-bogota.png` y la ciudad "se deshace" hasta quedar en terreno vacío. Luego yo lo invierto con ffmpeg y queda una construcción que termina exactamente en tu imagen.

```
16:9, hyperrealistic cinematic aerial shot, locked-off high drone position that never moves. Starting from this exact frame of a finished sustainable city at sunset, the city slowly deconstructs in reverse building order: people and vehicles disappear first, then trees and parks sink into the ground, buildings lower floor by floor into their foundations, the elevated metro and the station dismantle, the avenues fade into bare earth, until only flat empty land remains under the same sunset sky. Same camera position, same light direction, same horizon and mountains for the whole shot. Smooth, steady, continuous transformation, no cuts. Photorealistic. Silent video, no audio.
```

---

## Clip 1 · Bienvenidos a Bogotá → Estación Banderas
*(tu prompt, condensado)*

```
16:9, hyperrealistic cinematic aerial shot, one continuous take with a professional gimbal-stabilized drone over a sustainable smart city at sunset. The camera starts exactly at the first frame, high above the main urban corridor, looking at the elevated metro station "Bienvenidos a Bogotá" among green skyscrapers, the hospital, the shopping centre, tree-lined avenues, cycle lanes and electric buses. The drone glides very slowly forward along the metro tracks while gradually descending, as a real operator approaching the heart of the transport system. The station grows from a secondary element into the centre of the frame; platforms, glass roofs, stairs, buses, cycle lane and people take more and more of the image while the rest of the city stays coherent behind. The motion comes from physically flying through space, not from digital zoom. In the last seconds the camera completes the descent and settles exactly on the final frame, with the "ESTACIÓN BANDERAS" sign perfectly readable and the train, avenue, buses, towers and hospital matching the target image. Same city, same sunset, same light direction, same architecture throughout. Slow, elegant, contemplative. Silent video, no audio.
```

## Clip 2 · Estación Banderas → Fábrica

```
16:9, hyperrealistic cinematic drone shot, one continuous take over the same sustainable smart city at sunset. The camera starts exactly at the first frame in front of "Estación Banderas", rises slowly above the station roof and the metro tracks, glides forward over the tree-lined avenue and the rooftops, then gently descends toward a modern eco factory with solar panels and steel silos on its roof. In the last seconds it lowers to street level and turns smoothly to face the factory head-on, settling exactly on the final frame: the "FÁBRICA" sign centred and readable, glass facade, young trees, the street and parked cars in front. Slow, steady, gimbal-stabilized forward flight with a gentle rise and descent, constant focal length, no digital zoom. Same warm sunset light and sky direction throughout. Photorealistic architectural visualization. Silent video, no audio.
```

## Clip 3 · Fábrica → Hospital

```
16:9, hyperrealistic cinematic camera move at eye level, one continuous take in the same sustainable smart city at sunset. The camera starts exactly at the first frame facing the "FÁBRICA" facade, then glides slowly sideways and forward along the street, passing young trees and green planters, turns gently toward a landscaped garden with flowers and walks into it, arriving in front of a modern hospital with a large glass facade, a red cross and the "HOSPITAL" sign, a pond with small fountains, benches and people walking. It settles exactly on the final frame, with the wayfinding sign on the left and the hospital centred. Smooth steadicam motion, slow and calm, constant focal length, no zoom. Same golden sunset light throughout. Photorealistic. Silent video, no audio.
```

## Clip 4 · Hospital → Vida diaria

```
16:9, hyperrealistic cinematic steadicam shot at eye level, one continuous take in the same sustainable smart city at sunset turning into dusk. The camera starts exactly at the first frame in the hospital garden, moves slowly forward along the path past the fountains and the flowers, leaves the garden and turns gently onto a wide pedestrian boulevard with a red cycle lane, cafés with warm lights, trees, people walking and cycling, an electric articulated bus labelled "Banderas" and glass towers against a pink and orange sky. It settles exactly on the final frame, with the cycle lane on the right, the digital wayfinding totem in the foreground and the walking people centred. Slow, relaxed and natural movement, constant focal length, no zoom. Photorealistic. Silent video, no audio.
```

---

## Negative prompt (en todos)

```
cut, scene change, fade, dissolve, crossfade, morphing, warping geometry, melting buildings, flicker, sudden zoom, fast motion, vertigo effect, fisheye, shaky handheld, different city, different time of day, text changes, extra signs, watermark, black bars, letterbox, vertical framing, audio, music
```

## Cuando tengas cada clip

Déjalo en `videos/clips/` con el nombre de la tabla. Yo me encargo de:
1. Quitar la marca de agua, si la tiene.
2. Revisar que empiece y termine en sus fotogramas. Si el modelo se desvía, se nota en las uniones.
3. Codificarlo para el scroll: 1080p, GOP 6 y sin audio.
4. Invertir la intro si usaste el truco.

**Herramientas con primer y último fotograma:**
- **Hailuo (MiniMax):** la que ya usas. midudev usó MiniMax H3, 8 s y 1080p.
- **Kling 3.0:** "start/end frame".
- **DeeVid:** cuidado, el clip que te dio era de 480p. Busca la opción de 1080p.
- **Luma, Vidu, Higgsfield.**
