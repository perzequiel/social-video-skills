import {Composition} from 'remotion';
import {Main} from './Main';
import {projects} from './projects';

const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {projects.map((p) => (
        <Composition
          key={p.id}
          id={p.id}
          component={Main}
          durationInFrames={Math.ceil(p.data.total * FPS)}
          fps={FPS}
          width={1080}
          height={1920}
          defaultProps={{project: p}}
        />
      ))}
    </>
  );
};

export type Word = {t: string; a: number; b: number};
export type Project = {
  id: string;
  src: string;
  voice: string;
  srcVolume: number;
  music: string | null;
  musicStart: number;
  musicVolume: number;
  hook: {top: string; box: string};
  cta: {line1: string; box: string; line2: string; badge: string};
  wordColors: Record<string, string>;
  data: {total: number; ctaStart: number; fps: number; words: Word[]};
};
