import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {theme} from './theme';

const {endcard: E, fontFamily, accent, ink, white, shadow} = theme;
type Cta = {line1: string; box: string; line2: string; badge: string};

// Placa CTA: entra cuando la voz arranca el call to action (start, en seg)
export const EndCard: React.FC<{start: number; cta: Cta}> = ({start, cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - start * fps;
  if (local < 0) return null;

  const enter = (i: number) => spring({frame: local - i * E.stagger, fps, config: {damping: 12, mass: 0.6}});
  const item = (i: number, rotate = 0) => {
    const s = enter(i);
    return {
      opacity: interpolate(s, [0, 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
      transform: `translateY(${interpolate(s, [0, 1], [60, 0])}px) rotate(${rotate}deg) scale(${interpolate(s, [0, 1], [0.7, 1])})`,
    };
  };
  const bgOpacity = interpolate(enter(0), [0, 1], [0, E.bgOpacity]);
  const pulse = 1 + 0.03 * Math.sin(frame / 3.5);
  const bounce = 1 + 0.1 * Math.sin(frame / 4);

  const base = {fontFamily, textTransform: 'uppercase', textAlign: 'center'} as const;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(8,8,10,${bgOpacity})`,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 34,
        padding: '0 60px',
      }}
    >
      <div style={{...base, fontWeight: 800, fontSize: E.line1Size, color: white, letterSpacing: -1, ...item(0)}}>
        {cta.line1}
      </div>
      <div style={item(1, E.boxRotate)}>
        <div
          style={{
            ...base,
            fontWeight: 900,
            fontSize: E.boxSize,
            color: ink,
            background: accent,
            padding: '14px 46px',
            borderRadius: 26,
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            letterSpacing: -3,
            transform: `scale(${pulse})`,
          }}
        >
          {cta.box}
        </div>
      </div>
      <div style={{...base, fontWeight: 900, fontSize: E.line2Size, color: white, textShadow: shadow, ...item(2)}}>
        {cta.line2}
      </div>
      <div style={item(3)}>
        <div style={{...base, fontWeight: 900, fontSize: E.badgeSize, color: accent, textShadow: shadow, transform: `scale(${bounce})`}}>
          {cta.badge}
        </div>
      </div>
    </AbsoluteFill>
  );
};
