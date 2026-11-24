import {useCurrentFrame, interpolate, spring, useVideoConfig} from 'remotion';
import {theme} from './theme';
import type {Word} from './Root';

type Chunk = {words: Word[]; a: number; b: number};
const PUNCT = /[.,!?;]$/;
const {caption: C, fontFamily, accent, white, stroke, shadow} = theme;

// Agrupa en frases cortas, corta en puntuación
function buildChunks(words: Word[]): Chunk[] {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  let chars = 0;
  const flush = () => {
    if (cur.length) {
      chunks.push({words: cur, a: cur[0].a, b: cur[cur.length - 1].b});
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
    chunks[i].b = Math.max(chunks[i].b, chunks[i + 1].a);
  }
  return chunks;
}

export const Captions: React.FC<{words: Word[]}> = ({words}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

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
          transform: `translateY(${enterY}px) scale(${enterScale})`,
        }}
      >
        {chunk.words.map((w, i) => {
          const active = t >= w.a && t < w.b;
          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontWeight: 900,
                fontSize: C.fontSize,
                lineHeight: 1.05,
                color: active ? accent : white,
                textTransform: 'uppercase',
                letterSpacing: -1,
                WebkitTextStroke: stroke,
                paintOrder: 'stroke fill',
                textShadow: shadow,
                transform: active ? `scale(${C.activeScale})` : 'scale(1)',
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </div>
  );
};
