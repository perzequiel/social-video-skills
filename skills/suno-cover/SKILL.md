---
name: suno-cover
description: Pasa un audio (beat/música sintetizada o demo) por Suno para que suene profesional, usando el Chrome del usuario con su sesión de Suno, y lo enchufa en un video Remotion. Usar cuando el usuario diga "pasalo por suno", "mejorá la música con suno", "hacé un cover en suno", o cuando la música de fondo de un video suene rara/sintética y haya que mejorarla.
---

# Suno cover (vía Chrome del usuario)

Suno no tiene API pública oficial: el flujo es automatizar suno.com con las tools
`mcp__claude-in-chrome__*` (cargar antes la skill `claude-in-chrome`). Usa la cuenta
y los créditos del usuario.

## Antes de empezar (confirmar con el usuario)

- Generar gasta **créditos** (cada Create produce 2 covers).
- Descargar gasta **1 "download"** del cupo del plan (Free mostraba 6). Confirmar antes de descargar.
- Plan Free: **solo MP3/M4A** (WAV da error "WAV downloads aren't available on your current plan")
  y la licencia es **no comercial** hasta donde sabemos → avisar si el video es publicidad.
- No se puede escuchar el resultado: el usuario elige cuál cover usar.

## Flujo probado (nov 2026, UI v6-mini)

1. **Preparar el audio**: mp3 < 10 MB (límite de `file_upload`).
   `ffmpeg -i in.wav -c:a libmp3lame -b:a 320k out.mp3`
2. `navigate` → `https://suno.com/create`. Esperar ~4s (pasa por "Restoring your session").
   Si aparece popup de promo, cerrarlo con la X. Si pide login → frenar y pedirle al usuario que inicie sesión.
3. **Subir**: `find` "file input" → `file_upload` al `file-input (hidden)` (NO clickear "Upload audio": abre el picker nativo).
4. Diálogo de upload: escribir descripción del audio, elegir tag (**Song Demo** para un beat), **Continue**.
   El audio queda adjunto en el panel Create con modo **Cover** ya seleccionado y Lyrics `[Instrumental]`.
5. Scrollear el panel izquierdo hasta **Styles** (viene precargado con la descripción): click, `cmd+a`, tipear el prompt de estilo.
   Ejemplo punchy: `instrumental, modern jersey club trap beat, 140 bpm, punchy kick, deep 808 sub bass, crisp claps, fast hi-hat rolls, bright catchy synth lead, happy energetic uplifting, viral TikTok product ad, polished professional mix, no vocals`
6. **Create** (gasta créditos). Aparecen 2 filas "… COVER" arriba en My Songs; tardan ~1 min
   (listas cuando muestran duración en vez de spinner).
7. **Descargar** (tras ok del usuario sobre cuál): menú `…` de la fila → **Download** → el diálogo es
   multi-selección: destildar M4A, tildar **MP3** → **Unlock & Download** (1ª vez) / **Download**.
   El archivo cae en `~/Downloads/<nombre-del-upload>.mp3` (verificar con `ls -lt ~/Downloads | head`).
8. Cerrar la pestaña.

## Enchufarlo al video (pipeline Remotion de `videos/edit`)

1. `cp ~/Downloads/<nombre>.mp3 edit/public/music-suno.mp3`
2. Suno agrega intro/outro (el cover dura ~2 min aunque el original sea 27s). Buscar dónde entra el drop con RMS por segundo:
   ```bash
   ffmpeg -i edit/public/music-suno.mp3 -t 60 -af "asetnsamples=44100,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-" -f null - 2>/dev/null | grep RMS | awk -F= '{printf "%d:%.0f ", NR-1, $2}'
   ```
   El salto de nivel marca el inicio; alinearlo a compás (a 140 bpm, compás = 1.714s; 8 compases = 13.71s).
3. En `CONFIG` de `edit/build.mjs`: `music: 'music-suno.mp3'`, `musicStart: <seg>`, `musicVolume` tal que la música
   quede ~12 dB bajo su nivel original en el mix (cover a -14 dB mean → `0.25`).
4. `node build.mjs <id> && npx remotion render <id> out/<id>.mp4 --codec=h264 --crf=18`, y medir con `volumedetect`.

## Si la UI cambió

Sacar screenshot en cada paso y adaptarse; tras 2–3 intentos fallidos frenar y avisar al usuario.
Actualizar esta skill con lo que haya cambiado.
