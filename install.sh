#!/usr/bin/env bash
# Instala las skills de video en ~/.claude/skills y chequea dependencias.
# Uso: ./install.sh
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)/skills"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
mkdir -p "$DEST"

for dir in "$SRC"/*/; do
  name="$(basename "$dir")"
  if [ -e "$DEST/$name" ]; then
    bak="$DEST/.backup-$name-$(date +%Y%m%d%H%M%S)"
    mv "$DEST/$name" "$bak"
    echo "↺ $name ya existía → backup en $bak"
  fi
  cp -R "$dir" "$DEST/$name"
  echo "✓ skill instalada: $name"
done

echo
echo "Dependencias:"
missing=()
check() { # nombre, comando, paquete brew, opcional?
  if command -v "$2" >/dev/null 2>&1; then echo "  ✓ $1"; else echo "  ✗ $1 ${4:-}"; missing+=("$3"); fi
}
check "node (>=18)" node node
check "ffmpeg" ffmpeg ffmpeg
check "uv / uvx (voz edge-tts)" uvx uv
check "whisper-cli" whisper-cli whisper-cpp "(opcional: solo para subtitular clips con gente hablando)"

if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$major" -ge 18 ] || echo "  ⚠ node $major es viejo: se necesita >= 18"
fi
if command -v ffmpeg >/dev/null 2>&1; then
  filters="$(ffmpeg -hide_banner -filters 2>/dev/null || true)"
  case "$filters" in *" zscale "*) ;; *) zmissing=1 ;; esac
  [ -z "${zmissing:-}" ] || echo "  ⚠ ffmpeg sin filtro zscale: los clips HDR de iPhone no se van a convertir bien (brew reinstall ffmpeg)"
fi

echo
if [ ${#missing[@]} -gt 0 ]; then
  echo "Faltan: ${missing[*]}"
  echo "  macOS:  brew install ${missing[*]}"
else
  echo "Todo listo."
fi
echo
echo "Opcional (skill suno-cover): Chrome + extensión Claude in Chrome, con sesión iniciada en suno.com."
echo "Reiniciá Claude Code y probá: \"agregale voz en off y subtítulos estilo TikTok a este video: <ruta>\""
