# social-video-skills

Skills de Claude (Claude Desktop y Claude Code) para producir videos verticales para redes
(TikTok / Reels / Shorts) a partir de un clip: voz en off con IA, subtítulos karaoke, hook, placa de
call to action y música de fondo, todo renderizado con Remotion.

## Instalar en Claude Desktop (app de escritorio)

El pipeline corre **en tu compu** (ffmpeg, Node, Remotion), así que necesita una superficie de Claude
con acceso local. En la app Claude Desktop hay tres; solo dos sirven:

| Dónde | ¿Funciona? | Notas |
|---|---|---|
| **Pestaña Code** | ✅ Recomendado | Corre directo en tu máquina, igual que donde se armó y probó esto. |
| **Cowork** | ⚠️ Debería, sin probar | Corre en una VM local; hay que abrir la red y puede faltar instalar herramientas adentro. |
| **Chat común** | ❌ No | Las skills corren en un sandbox remoto sin acceso a tus archivos ni a ffmpeg. |

### Opción A — pestaña Code (recomendada)

1. Abrí Claude Desktop → pestaña **Code** → elegí una carpeta de trabajo (por ejemplo `Documentos/videos`).
2. Pegá este prompt:

> Instalá las skills de video de https://github.com/perzequiel/social-video-skills: cloná el repo en
> `~/social-video-skills`, corré `./install.sh`, instalá las dependencias que falten (node, ffmpeg, uv)
> y avisame cuando esté listo.

3. Aceptá los permisos que pida. Cuando termine, abrí una sesión nueva en la pestaña Code y pedile el video.

No hace falta instalar Claude Code por terminal. Para actualizar: "actualizá las skills de video
(`git pull && ./install.sh` en `~/social-video-skills`)".

### Opción B — Cowork

1. **Settings → Capabilities**: activar ejecución de código y poner el acceso de red en **All domains**
   (la voz usa servidores de Microsoft y Remotion descarga Chromium; con la red por defecto falla).
2. **Customize → Plugins → Add → Add marketplace** → `perzequiel/social-video-skills` → instalar y activar
   el plugin `social-video`. (Alternativa: **Customize → Skills → + → Upload a skill** con los `.zip` de
   [Releases](https://github.com/perzequiel/social-video-skills/releases).)
3. Empezar una tarea y **conectar la carpeta** donde está el video; el resultado sale en esa misma carpeta.
4. La primera vez Claude tiene que instalar node/ffmpeg/uv dentro de la VM; probá con un video corto.

La skill `suno-cover` (Chrome) está pensada para la pestaña Code.

### Claude Code (terminal)

Mismo prompt de la opción A, o como plugin:

```
/plugin marketplace add perzequiel/social-video-skills
/plugin install social-video@social-video-skills
```

## Qué trae

| Skill | Para qué |
|---|---|
| `social-video` | El pipeline completo + dos templates Remotion: **voz en off IA** (clip de producto + guion) y **talking-head** (subtitula a alguien hablando con whisper). |
| `remotion-motion-graphics` | Reglas de motion design para que los videos no se vean genéricos. |
| `suno-cover` | Pasa la música por Suno usando tu Chrome (requiere cuenta de Suno y la extensión Claude in Chrome). |

## Requisitos

- Claude Desktop (pestaña Code o Cowork, plan pago) o Claude Code
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
