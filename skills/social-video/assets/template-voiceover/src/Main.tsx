import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Captions} from './Captions';
import {Hook} from './Hook';
import {EndCard} from './EndCard';
import {theme} from './theme';
import type {Project} from './Root';

const Clip: React.FC<{src: string; volume: number}> = ({src, volume}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], theme.zoom, {
    easing: theme.ease,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: 'black', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        <OffthreadVideo
          src={staticFile(src)}
          volume={volume}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Main: React.FC<{project: Project}> = ({project}) => {
  const {src, voice, srcVolume, music, musicStart, musicVolume, data, hook, cta, wordColors} = project;
  const {fps, durationInFrames} = useVideoConfig();
  // fade in corto / fade out al final
  const musicVol = (f: number) =>
    musicVolume *
    interpolate(f, [0, 0.4 * fps, durationInFrames - 1.0 * fps, durationInFrames], [0, 1, 1, 0], {
      easing: theme.ease,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <Clip src={src} volume={srcVolume} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <Captions words={data.words} until={data.ctaStart} wordColors={wordColors} />
      <Hook top={hook.top} box={hook.box} />
      <EndCard start={data.ctaStart} cta={cta} />
      <Audio src={staticFile(voice)} />
      {music ? <Audio src={staticFile(music)} volume={musicVol} trimBefore={Math.round(musicStart * fps)} /> : null}
      <Sequence from={Math.round(data.ctaStart * fps)} layout="none">
        <Audio src={staticFile('sfx-impact.wav')} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
