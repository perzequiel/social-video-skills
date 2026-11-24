import {AbsoluteFill, OffthreadVideo, Series, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {Captions} from './Captions';
import {Hook} from './Hook';
import {EndCard} from './EndCard';
import {theme} from './theme';
import type {Project} from './Root';

const FPS = 30;

const Clips: React.FC<{src: string; blocks: number[][]; total: number}> = ({src, blocks, total}) => {
  const frame = useCurrentFrame();
  const dur = total * FPS;
  const scale = interpolate(frame, [0, dur], theme.zoom, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        <Series>
          {blocks.map((b, i) => {
            const len = Math.round((b[1] - b[0]) * FPS);
            const trimBefore = Math.round(b[0] * FPS);
            return (
              <Series.Sequence key={i} durationInFrames={len}>
                <OffthreadVideo
                  src={staticFile(src)}
                  trimBefore={trimBefore}
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              </Series.Sequence>
            );
          })}
        </Series>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Main: React.FC<{project: Project}> = ({project}) => {
  const {src, data, hook, cta} = project;
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Clips src={src} blocks={data.blocks} total={data.total} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <Captions words={data.words} />
      <Hook top={hook.top} box={hook.box} />
      <EndCard total={data.total} cta={cta} />
    </AbsoluteFill>
  );
};
