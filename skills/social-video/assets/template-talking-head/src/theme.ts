// ====== BASE ÚNICA DE ESTILO ======
// Tokens compartidos por TODOS los videos. Cambiar acá = cambia en todos.
// Mantiene coherencia visual entre clips.
import {loadFont} from '@remotion/google-fonts/Montserrat';

export const {fontFamily} = loadFont('normal', {weights: ['700', '800', '900']});

export const theme = {
  fontFamily,
  accent: '#FFE600',
  white: '#FFFFFF',
  ink: '#0a0a0a',
  stroke: '3px #000',
  shadow: '0 6px 22px rgba(0,0,0,0.85)',

  // zoom lento del video (Ken Burns)
  zoom: [1.06, 1.12] as [number, number],

  // captions karaoke
  caption: {
    fontSize: 92,
    bottom: 430,
    maxWords: 3,
    maxChars: 16,
    gap: '4px 26px',
    activeScale: 1.08,
  },

  // hook (primeros segundos de impacto)
  hook: {
    endSec: 3.2,
    top: 150,
    topSize: 64,
    boxSize: 110,
    boxRotate: -3,
  },

  // placa CTA final
  endcard: {
    tailSec: 2.6,
    bgOpacity: 0.82,
    line1Size: 56,
    boxSize: 120,
    boxRotate: -2,
    line2Size: 60,
    badgeSize: 84,
  },
} as const;
