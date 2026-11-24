// ====== BASE ÚNICA DE ESTILO ======
// Tokens compartidos por TODOS los videos. Cambiar acá = cambia en todos.
import {Easing} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';

export const {fontFamily} = loadFont('normal', {weights: ['700', '800', '900']});

export const theme = {
  fontFamily,
  accent: '#FFE600',
  white: '#FFFFFF',
  ink: '#0a0a0a',
  stroke: '3px #000',
  strokeLight: '3px #fff',
  shadow: '0 6px 22px rgba(0,0,0,0.85)',
  ease: Easing.inOut(Easing.sin),

  // zoom lento del video (Ken Burns)
  zoom: [1.04, 1.12] as [number, number],

  // captions karaoke
  caption: {
    fontSize: 92,
    bottom: 430,
    maxWords: 3,
    maxChars: 16,
    gap: '4px 34px',
    activeScale: 1.05,
  },

  // hook (primeros segundos de impacto)
  hook: {
    endSec: 3.0,
    top: 170,
    topSize: 64,
    boxSize: 120,
    boxRotate: -3,
  },

  // placa CTA final (aparece cuando la voz dice el CTA)
  endcard: {
    bgOpacity: 0.78,
    line1Size: 60,
    boxSize: 130,
    boxRotate: -2,
    line2Size: 72,
    badgeSize: 64,
    stagger: 4,
  },
} as const;
