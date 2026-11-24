---
name: social-video
description: Edita clips verticales para TikTok/Reels/Shorts con Remotion — voz en off con IA (edge-tts), subtítulos karaoke estilo TikTok, hook inicial, placa CTA, música de fondo sintetizada sin copyright y render 1080×1920. Usar SIEMPRE que el usuario pase un video y pida agregarle voz en off, subtítulos, call to action o música; pida "un video para TikTok/Reels/ecommerce/redes"; quiera subtitular un clip donde alguien habla; o pida instalar/preparar el pipeline de videos. Incluye dos templates listos (voz en off IA y talking-head con whisper).
---

# Social video (TikTok / Reels / Shorts)

Pipeline probado para contenido corto vertical. Dos modos, cada uno con un template
Remotion en `assets/` que se copia al proyecto del usuario:

| Modo | Cuándo | Template |
|---|---|---|
| **Voz en off IA** | Clip de producto / b-roll sin habla. La voz la genera edge-tts desde un guion. | `assets/template-voiceover` |
| **Talking-head** | Alguien habla a cámara. Los subtítulos salen de transcribir el audio con whisper. | `assets/template-talking-head` |

Skills hermanas: `remotion-motion-graphics` (reglas de motion design — leerla antes de
tocar componentes) y `suno-cover` (mejorar la música pasándola por Suno).

## 0. Requisitos (verificar antes de empezar)

```bash
node -v            # >= 18
ffmpeg -version    # y: ffmpeg -filters | grep -E " zscale| tonemap "  (para clips HDR de iPhone)
uvx --version      # uv: corre edge-tts sin instalar nada global
whisper-cli -h     # solo modo talking-head (brew install whisper-cpp)
```
Si falta algo, decirle al usuario qué y pedir ok antes de instalar. edge-tts necesita internet
(servicio de Microsoft; solo se envía el guion).

- **macOS** (Claude Code / pestaña Code de Claude Desktop): `brew install node ffmpeg uv whisper-cpp`.
  Sin Homebrew: instalarlo primero (pide la contraseña del usuario → que lo corra él).
- **Windows**: `winget install OpenJS.NodeJS Gyan.FFmpeg astral-sh.uv`.
- **Cowork / VM Linux**: `apt-get install -y ffmpeg nodejs npm` (o nvm si node < 18) y
  `curl -LsSf https://astral.sh/uv/install.sh | sh`. Remotion además descarga su Chromium en el primer
  render y puede pedir libs del sistema (`npx remotion browser ensure` lo muestra). Si npm, edge-tts o
  la descarga de Chromium fallan por red: pedirle al usuario que ponga **Settings → Capabilities →
  acceso de red en "All domains"**. Trabajar siempre dentro de la carpeta que el usuario conectó
  (ahí va `videos/` y el mp4 final); si no hay carpeta conectada, pedirla.
- **Chat común (sandbox remoto, sin carpeta local)**: este pipeline no corre ahí. Decirle al usuario
  que use la pestaña Code o Cowork de Claude Desktop.
- Sin `zscale` en ffmpeg: `prep.mjs` falla con clips HDR → usar como fallback
  `-vf "format=yuv420p"` avisando que los colores pueden quedar lavados.

## 1. Estructura en el proyecto del usuario

```
videos/
├── CLAUDE.md                  ← notas del pipeline para ese proyecto (crear/actualizar)
├── vN/                        ← 1 carpeta por video: source original + datos generados
└── edit/                      ← copia del template (todo se renderiza acá)
    ├── public/<id>.mp4        ← clip convertido (prep.mjs)
    ├── build.mjs | build-captions.mjs   ← CONFIG por video
    └── src/ theme.ts (tokens únicos de estilo), Root, Main, Captions, Hook, EndCard
```

Primera vez en un proyecto:
```bash
mkdir -p videos && cp -R <esta-skill>/assets/template-voiceover videos/edit   # o template-talking-head
cd videos/edit && npm install
npm run setup        # (voiceover) sintetiza music-chill.wav, music-punch.wav, sfx-impact.wav
```
Si `videos/edit` ya existe, NO pisarlo: trabajar sobre lo que hay. Si el proyecto necesita los
dos modos, el segundo template va en `videos/edit-talk`.

## 2. Modo voz en off IA

1. `mkdir ../vN && cp <clip> ../vN/source.mp4`
2. `node prep.mjs ../vN/source.mp4 vN` → `public/vN.mp4` (H.264 SDR; detecta HDR de iPhone y hace tonemap).
3. Mirar el clip antes de escribir nada (contact sheet):
   `ffmpeg -i public/vN.mp4 -vf "fps=1/2.4,scale=-2:480,tile=7x1" -frames:v 1 sheet.jpg`
4. Agregar la entrada en `CONFIG` de `build.mjs` (hay un ejemplo comentado):
   - `script`: el texto del usuario **tal cual** (corregir solo tildes). `ctaScript`: frase final de call to action.
   - `voice`/`rate`/`pitch`: ver "Voz" abajo.
   - `speak`: pronunciación fonética de palabras que la voz dice mal (`{Bluetooth: 'blútut'}`).
     Debe conservar la cantidad de palabras; el subtítulo muestra el guion original.
   - `hook` (overlay de los primeros 3s — que NO repita el primer subtítulo), `cta` (placa final),
     `wordColors` (ej. colores del producto), `music`, `musicStart`, `musicVolume`, `srcVolume`, `tail`.
5. `node build.mjs vN --tts` (genera voz + tiempos por palabra + `src/projects/vN.json` + índice).
   Sin `--tts` reusa la voz; usarlo siempre que cambie guion/voz/rate/speak.
6. `npx remotion render vN out/vN.mp4 --codec=h264 --crf=18`
7. **Verificar** (obligatorio, ver sección 5).

Duración del video = fin de la voz + `tail`. El clip fuente tiene que durar al menos eso.
La placa CTA entra sola cuando la voz empieza `ctaScript`, con un golpe grave (`sfx-impact.wav`).

## 3. Modo talking-head

1. `mkdir ../vN && cp <clip> ../vN/source.mp4 && node prep.mjs ../vN/source.mp4 vN`
2. Transcribir con tiempos por palabra (modelo: `ggml-small.bin`, ~490 MB, se baja una vez de
   `https://huggingface.co/ggerganov/whisper.cpp` — pedir ok al usuario antes de descargar):
   ```bash
   cd ../vN && ffmpeg -y -i source.mp4 -ar 16000 -ac 1 -c:a pcm_s16le audio.wav
   whisper-cli -m <ruta>/ggml-small.bin -f audio.wav -l es -oj -of transcript --max-len 1
   ```
3. Detectar pausas para cortar: `ffmpeg -i audio.wav -af silencedetect=noise=-35dB:d=0.45 -f null -`
   Ojo: a veces marca voz tenue como silencio — verificar con `volumedetect` (~-50 dB = silencio real).
4. Entrada en `CONFIG` de `build-captions.mjs`: `end`, `cuts` (pad ~0.10s hacia adentro), `fixes`
   (palabras mal transcriptas; ignora puntuación final), `hook`, `cta`.
5. `node build-captions.mjs vN && npx remotion render vN out/vN.mp4 --codec=h264 --crf=18`

Las palabras se reconstruyen desde tokens whisper: token que arranca con espacio = palabra nueva.

## 4. Decisiones de estilo que ya funcionaron (no reinventar)

**Estética** (tokens en `src/theme.ts`, única fuente — nunca hex inline en componentes):
1080×1920, 30 fps, Montserrat 900 uppercase, acento `#FFE600`, contorno negro 3px, captions karaoke de
máx 3 palabras / 16 chars con palabra activa en amarillo, `bottom: 430` (zona segura de UI de TikTok),
slow zoom del clip, degradado oscuro arriba/abajo.

**Voz**
- Rioplatense: `es-AR-TomasNeural` (masc.) o `es-AR-ElenaNeural` (fem.); alternativas `es-UY-MateoNeural`,
  `es-UY-ValentinaNeural`. Otros países: `uvx edge-tts --list-voices | grep es-`.
- `rate: '+10%'` a `'+15%'` para ritmo TikTok.
- Si el usuario duda de la voz, generar muestras de 3–4 voces en `vN/voice-samples/` y que elija.
- Anglicismos suenan mal en voces es-*: arreglarlos con `speak` (fonética), no cambiando el guion.

**Música** (todo sintetizado por código → sin copyright)
- `music-punch.wav`: 140 bpm, bounce jersey club/trap, 808, lead pegadizo. **Default** para producto
  viral / público joven. `musicVolume: 0.14`.
- `music-chill.wav`: lo-fi tranqui con graves. Para marcas calmas. `musicVolume: 0.22`.
  (Feedback real: en un producto "viral" el chill sonó a "vender un velador" → ir a punch.)
- Si el usuario dice que la música suena rara/sintética → skill `suno-cover`, y usar `musicStart` para
  saltear la intro del cover.
- Mezcla: voz ~-21 dB mean; música ~12 dB por debajo de su nivel propio en el mix final ≈ -21/-22 dB
  mean total. Medir con `ffmpeg -i out/vN.mp4 -af volumedetect -vn -f null -`.
- Audio original del clip: `srcVolume: 0.06` (textura) o `0`.

**Copy**: respetar el texto del usuario. Si hay que inventar hook/CTA, avisar explícitamente cuáles
textos son inventados y no agregar claims (envíos, stock, precios) que el usuario no dio.

## 5. Verificación (nunca entregar sin esto)

```bash
for t in 0.3 2.9 5 8 11 13.5; do ffmpeg -v error -y -ss $t -i out/vN.mp4 -frames:v 1 -vf scale=-2:640 chk_$t.jpg; done
ffmpeg -v error -y -pattern_type glob -i "chk_*.jpg" -vf tile=6x1 -frames:v 1 check.jpg   # y MIRARLO
```
Revisar: palabras pegadas entre sí (subir `caption.gap`, bajar `activeScale`), texto fuera de la zona
segura, hook que repite el subtítulo, colores lavados (faltó tonemap), placa CTA legible.
**No se puede escuchar el audio**: decirlo y pedirle al usuario que valide voz y música de oído.
Usar el scratchpad para los frames de chequeo, no el proyecto.

## 6. Gotchas

- Clips de iPhone: HEVC HDR + rotación en metadata → siempre pasar por `prep.mjs`.
- `OffthreadVideo`, nunca `<Video>`. Interpolaciones siempre con easing + clamp (ver `remotion-motion-graphics`).
- `src/projects/*.json` e `index.ts` son generados: no editar a mano, no registrar composiciones a mano.
- Renders generan mucho scratch; si da `ENOSPC`, limpiar caches.
- Emojis: se renderizan a color de plataforma; en cajas amarillas evitar emojis amarillos/naranjas.
- Al terminar, dejar/actualizar `videos/CLAUDE.md` con lo particular del proyecto (voz elegida, estilo, feedback del usuario).
