import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {theme} from './theme';

const {endcard: E, fontFamily, accent, ink} = theme;
type Cta = {line1: string; box: string; line2: string; badge: string};

// Placa CTA tras el habla
export const EndCard: React.FC<{total: number; cta: Cta}> = ({total, cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < total - 0.15) return null;

  const local = frame - total * fps;
  const inS = spring({frame: local, fps, config: {damping: 13, mass: 0.7}});
  const bgOpacity = interpolate(inS, [0, 1], [0, E.bgOpacity]);
  const scale = interpolate(inS, [0, 1], [0.8, 1]);
  const arrow = 1 + 0.12 * Math.sin(frame / 4);

  const shadow = '0 6px 20px rgba(0,0,0,0.8)';
  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(8,8,10,${bgOpacity})`,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 30,
        padding: '0 60px',
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: E.line1Size,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: -1,
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        {cta.line1}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: E.boxSize,
          color: ink,
          background: accent,
          padding: '14px 46px',
          borderRadius: 26,
          transform: `rotate(${E.boxRotate}deg) scale(${scale})`,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          letterSpacing: -3,
          textAlign: 'center',
        }}
      >
        {cta.box}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: E.line2Size,
          color: '#fff',
          textTransform: 'uppercase',
          transform: `scale(${scale})`,
          textShadow: shadow,
          textAlign: 'center',
        }}
      >
        {cta.line2}
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 900,
          fontSize: E.badgeSize,
          color: accent,
          transform: `scale(${arrow})`,
          textShadow: shadow,
        }}
      >
        {cta.badge}
      </div>
    </AbsoluteFill>
  );
};
