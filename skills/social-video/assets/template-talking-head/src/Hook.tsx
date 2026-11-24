import {useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {theme} from './theme';

const {hook: H, fontFamily, accent} = theme;

// Segundos de impacto: headline animado arriba
export const Hook: React.FC<{top: string; box: string}> = ({top, box}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t > H.endSec + 0.4) return null;

  const inSpring = spring({frame, fps, config: {damping: 12, mass: 0.6}});
  const out = interpolate(t, [H.endSec, H.endSec + 0.35], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(inSpring, [0, 1], [-160, 0]);
  const pulse = 1 + 0.04 * Math.sin(frame / 3.2);

  return (
    <div
      style={{
        position: 'absolute',
        top: H.top,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        opacity: out,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: H.topSize,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: -1,
          WebkitTextStroke: theme.stroke,
          paintOrder: 'stroke fill',
          textShadow: '0 6px 20px rgba(0,0,0,0.8)',
          transform: `scale(${pulse})`,
        }}
      >
        {top}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: H.boxSize,
          color: theme.ink,
          background: accent,
          padding: '10px 34px',
          borderRadius: 22,
          transform: `rotate(${H.boxRotate}deg) scale(${pulse})`,
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
          letterSpacing: -2,
          textAlign: 'center',
        }}
      >
        {box}
      </div>
    </div>
  );
};
