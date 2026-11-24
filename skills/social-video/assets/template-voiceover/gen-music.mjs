// Música de fondo 100% sintetizada (sin copyright): chill, graves marcados, melodía alegre.
// Uso: node gen-music.mjs  → public/music-chill.wav (loop de 8 compases, 96 bpm, Fa mayor)
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const SR = 44100;
const BPM = 96;
const BEAT = 60 / BPM;
const BARS = 8;
const N = Math.ceil(BARS * 4 * BEAT * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const duck = new Float32Array(N).fill(1); // sidechain del bombo
const hz = (m) => 440 * 2 ** ((m - 69) / 12);

// semilla fija → mismo archivo siempre
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;

const add = (t0, dur, pan, fn, ducked = true) => {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    const v = fn(i / SR) * (ducked ? duck[s0 + i] : 1);
    L[s0 + i] += v * gl;
    R[s0 + i] += v * gr;
  }
};
const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t / d);

// --- instrumentos ---
const kick = (t0) => {
  const s0 = Math.floor(t0 * SR);
  for (let i = 0; i < 0.3 * SR && s0 + i < N; i++) duck[s0 + i] = 1 - 0.4 * Math.exp(-i / SR / 0.12);
  let ph = 0;
  add(t0, 0.4, 0, (t) => {
    ph += (2 * Math.PI * (48 + 90 * Math.exp(-t / 0.035))) / SR;
    return Math.sin(ph) * env(t, 0.002, 0.14) * 0.85;
  }, false);
};
const snare = (t0) => {
  let lp = 0;
  add(t0, 0.25, 0.1, (t) => {
    lp += 0.25 * (rnd() - lp);
    return (lp * 0.9 + Math.sin(2 * Math.PI * 190 * t) * 0.25) * env(t, 0.002, 0.07) * 0.22;
  });
};
const hat = (t0, g) => {
  let lp = 0;
  add(t0, 0.08, -0.25, (t) => {
    const n = rnd();
    lp += 0.5 * (n - lp);
    return (n - lp) * env(t, 0.001, 0.02) * g;
  });
};
// bajo: seno + armónicos saturados (se percibe grave aun en parlante de celular)
const bass = (t0, dur, m) => {
  const f = hz(m);
  add(t0, dur + 0.15, 0, (t) => {
    const rel = t > dur ? Math.exp(-(t - dur) / 0.04) : 1;
    const x = Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(4 * Math.PI * f * t) + 0.15 * Math.sin(6 * Math.PI * f * t);
    return Math.tanh(1.6 * x) * Math.min(1, t / 0.008) * (0.75 + 0.25 * Math.exp(-t / 0.25)) * rel * 0.42;
  });
};
// teclado tipo rhodes
const keys = (t0, notes) =>
  notes.forEach((m, k) => {
    const f = hz(m);
    add(t0 + k * 0.012, 1.6, (k - 1.5) * 0.3, (t) => {
      const trem = 1 + 0.12 * Math.sin(2 * Math.PI * 4.5 * t);
      return (Math.sin(2 * Math.PI * f * t) + 0.22 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t / 0.3)) * env(t, 0.006, 0.55) * trem * 0.085;
    });
  });
// melodía: pluck tipo campanita + eco ping-pong
const pluck = (t0, m) => {
  const f = hz(m);
  [0, 1, 2, 3].forEach((e) =>
    add(t0 + e * BEAT * 0.75, 0.9, e === 0 ? 0.15 : e % 2 ? -0.6 : 0.6, (t) => {
      return (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t / 0.08) + 0.08 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t / 0.05)) * env(t, 0.003, 0.22) * 0.15 * 0.42 ** e;
    }),
  );
};

// --- arreglo: Fmaj7 | Dm7 | Bbmaj7 | C(add9) ---
const CH = [
  {root: 41, notes: [57, 60, 64, 65]},
  {root: 38, notes: [57, 60, 62, 65]},
  {root: 46, notes: [58, 62, 65, 69]},
  {root: 36, notes: [55, 60, 62, 64]},
];
const MEL = [
  [[0, 72], [0.5, 69], [1, 72], [2, 74], [2.5, 72], [3, 69]],
  [[0, 77], [1, 74], [1.5, 72], [2.5, 69], [3, 72]],
  [[0, 74], [0.5, 77], [1, 74], [2, 72], [2.5, 70], [3, 74]],
  [[0, 76], [1, 79], [1.5, 76], [2.5, 74], [3, 72]],
];
// primero bombos (definen el sidechain)
for (let b = 0; b < BARS; b++) {
  const t = b * 4 * BEAT;
  kick(t);
  kick(t + 2 * BEAT);
  if (b % 2) kick(t + 2.5 * BEAT);
}
for (let b = 0; b < BARS; b++) {
  const t = b * 4 * BEAT;
  const c = CH[b % 4];
  snare(t + BEAT);
  snare(t + 3 * BEAT);
  for (let h = 0; h < 8; h++) hat(t + h * 0.5 * BEAT + (h % 2 ? 0.02 : 0), h % 2 ? 0.05 : 0.03);
  bass(t, 1.4 * BEAT, c.root);
  bass(t + 1.5 * BEAT, 0.9 * BEAT, c.root);
  bass(t + 2.5 * BEAT, 0.45 * BEAT, c.root + 12);
  bass(t + 3 * BEAT, 0.9 * BEAT, c.root);
  keys(t, c.notes);
  keys(t + 1.5 * BEAT, c.notes);
  for (const [beat, m] of MEL[b % 4]) pluck(t + beat * BEAT, m);
}

// master: soft clip + normalizar a -3 dB
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.2);
  R[i] = Math.tanh(R[i] * 1.2);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const g = 0.708 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4);
}
const out = fileURLToPath(new URL('./public/music-chill.wav', import.meta.url));
writeFileSync(out, buf);
console.log(`ok ${out} | ${(N / SR).toFixed(2)}s`);
