import {Composition} from 'remotion';
import {Main} from './Main';
import {theme} from './theme';
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
          durationInFrames={Math.ceil((p.data.total + theme.endcard.tailSec) * FPS)}
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
  hook: {top: string; box: string};
  cta: {line1: string; box: string; line2: string; badge: string};
  data: {blocks: number[][]; offsets: number[]; total: number; fps: number; words: Word[]};
};
