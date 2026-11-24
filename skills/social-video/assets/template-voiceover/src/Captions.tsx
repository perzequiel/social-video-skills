import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {theme} from './theme';
import type {Word} from './Root';

type Chunk = {words: Word[]; a: number; b: number};
const PUNCT = /[.,!?;]$/;
const HOLD = 0.35; // seg que queda la frase tras la última palabra
const {caption: C, fontFamily, accent, white, ink, stroke, strokeLight, shadow} = theme;
const key = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Agrupa en frases cortas, corta en puntuación
function buildChunks(words: Word[]): Chunk[] {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  let chars = 0;
  const flush = () => {
    if (cur.length) {
      chunks.push({words: cur, a: cur[0].a, b: cur[cur.length - 1].b + HOLD});
      cur = [];
      chars = 0;
    }
  };
  for (const w of words) {
    cur.push(w);
    chars += w.t.length + 1;
    if (PUNCT.test(w.t) || cur.length >= C.maxWords || chars > C.maxChars) flush();
  }
  flush();
  for (let i = 0; i < chunks.length - 1; i++) {
    chunks[i].b = Math.min(chunks[i].b, chunks[i + 1].a);
  }
  return chunks;
}

export const Captions: React.FC<{words: Word[]; until: number; wordColors: Record<string, string>}> = ({
  words,
  until,
  wordColors,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t >= until) return null;

  const chunk = buildChunks(words).find((c) => t >= c.a && t < c.b);
  if (!chunk) return null;

  const localFrame = frame - chunk.a * fps;
  const pop = spring({frame: localFrame, fps, config: {damping: 14, mass: 0.5}});
  const enterY = interpolate(pop, [0, 1], [40, 0]);
  const enterScale = interpolate(pop, [0, 1], [0.85, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: C.bottom,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 70px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: C.gap,
          justifyContent: 'center',
          opacity: pop,
          transform: `translateY(${enterY}px) scale(${enterScale})`,
        }}
      >
        {chunk.words.map((w, i) => {
          const said = t >= w.a;
          const active = said && t < w.b;
          const custom = wordColors[key(w.t)];
          // palabra de color (rojo/azul/negro): queda pintada desde que se dice
          const color = custom && said ? custom : active ? accent : white;
          const dark = color === ink || color === '#111111';
          const wordPop = spring({frame: frame - w.a * fps, fps, config: {damping: 11, mass: 0.4}});
          const scale = active ? interpolate(wordPop, [0, 1], [1, C.activeScale]) : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontWeight: 900,
                fontSize: C.fontSize,
                lineHeight: 1.05,
                color,
                textTransform: 'uppercase',
                letterSpacing: -1,
                WebkitTextStroke: dark ? strokeLight : stroke,
                paintOrder: 'stroke fill',
                textShadow: shadow,
                transform: `scale(${scale})`,
              }}
            >
              {w.t.replace(/[.,]$/, '')}
            </span>
          );
        })}
      </div>
    </div>
  );
};
