# social-video-skills

Skills de [Claude Code](https://claude.com/claude-code) para producir videos verticales para redes
(TikTok / Reels / Shorts) a partir de un clip: voz en off con IA, subtítulos karaoke, hook, placa de
call to action y música de fondo, todo renderizado con Remotion.

## Instalar con un prompt

Abrí Claude Code en cualquier carpeta y pegá:

> Instalá las skills de video de https://github.com/perzequiel/social-video-skills: cloná el repo en
> `~/social-video-skills`, corré `./install.sh`, instalá las dependencias que falten y avisame cuando esté listo.

Después reiniciá Claude Code. Para actualizar: `git pull && ./install.sh` en esa carpeta.

### Alternativa: como plugin

```
/plugin marketplace add perzequiel/social-video-skills
/plugin install social-video@social-video-skills
```

### Manual

```bash
git clone https://github.com/perzequiel/social-video-skills.git ~/social-video-skills
cd ~/social-video-skills && ./install.sh
```

## Qué trae

| Skill | Para qué |
|---|---|
| `social-video` | El pipeline completo + dos templates Remotion: **voz en off IA** (clip de producto + guion) y **talking-head** (subtitula a alguien hablando con whisper). |
| `remotion-motion-graphics` | Reglas de motion design para que los videos no se vean genéricos. |
| `suno-cover` | Pasa la música por Suno usando tu Chrome (requiere cuenta de Suno y la extensión Claude in Chrome). |

## Requisitos

- Claude Code
- `node` ≥ 18, `ffmpeg` (con `zscale` para clips HDR de iPhone), `uv` — en macOS: `brew install node ffmpeg uv`
- Opcional: `whisper-cpp` (modo talking-head), Chrome + extensión Claude in Chrome (Suno)
- Internet para la voz (edge-tts usa el servicio de voces de Microsoft; solo se envía el guion)

## Cómo se usa

Con las skills instaladas, pedile a Claude en el proyecto donde quieras los videos:

> Tomá este video `/ruta/al/clip.mp4` y agregale una voz en off que diga: "…". Subtítulos bien TikTok,
> música con punch y un call to action al final.

> Subtitulá este clip donde hablo a cámara, cortá las pausas y poné un hook arriba: `/ruta/clip.mov`

> La música suena rara, pasala por Suno.

Claude crea `videos/` en tu proyecto (una carpeta por video + `edit/` con el proyecto Remotion),
renderiza a `videos/edit/out/<id>.mp4` y revisa frames antes de entregar. El audio no lo puede
escuchar: validalo vos.

## Notas

- La música incluida se sintetiza por código (`gen-music*.mjs`), no tiene copyright.
- Suno: generar gasta créditos y el plan Free es de uso no comercial (revisá sus términos).
