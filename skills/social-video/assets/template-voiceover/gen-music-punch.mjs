// Beat moderno sintetizado (sin copyright): 140 bpm, bounce tipo jersey club/trap,
// 808 saturado, bombo con pegada, claps, hi-hats con rolls y lead supersaw pegadizo.
// Uso: node gen-music-punch.mjs → public/music-punch.wav + public/sfx-impact.wav
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const SR = 44100;
const BPM = 140;
const STEP = 60 / BPM / 4; // semicorchea
const BARS = 16;
const N = Math.ceil(BARS * 16 * STEP * SR);
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;

const mk = (n) => ({L: new Float32Array(n), R: new Float32Array(n), n});
const mix = mk(N);
const duck = new Float32Array(N).fill(1);

const add = (bus, t0, dur, pan, fn, duckAmt = 0) => {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && s0 + i < bus.n; i++) {
    const d = duckAmt ? 1 - duckAmt * (1 - duck[s0 + i]) : 1;
    const v = fn(i / SR) * d;
    bus.L[s0 + i] += v * gl;
    bus.R[s0 + i] += v * gr;
  }
};
const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t / d);
// sierra limitada en banda, con brillo que decae (efecto filtro)
const saw = (f, t, bright) => {
  const K = Math.min(24, Math.floor(9000 / f));
  let x = 0;
  for (let k = 1; k <= K; k++) x += (Math.sin(2 * Math.PI * k * f * t) / k) * Math.exp(-(k - 1) * bright);
  return x * 0.6;
};

const kick = (bus, t0, mark = true) => {
  if (mark) {
    const s0 = Math.floor(t0 * SR);
    for (let i = 0; i < 0.25 * SR && s0 + i < N; i++) duck[s0 + i] = Math.min(duck[s0 + i], 1 - Math.exp(-i / SR / 0.09));
  }
  let ph = 0;
  add(bus, t0, 0.3, 0, (t) => {
    ph += (2 * Math.PI * (52 + 170 * Math.exp(-t / 0.022))) / SR;
    const click = t < 0.004 ? rnd() * 0.5 * (1 - t / 0.004) : 0;
    return Math.tanh((Math.sin(ph) * env(t, 0.001, 0.13) + click) * 1.8) * 0.8;
  });
};
const clap = (t0, g = 0.4) => {
  [0, 0.011, 0.023].forEach((o, k) => {
    let lp = 0;
    add(mix, t0 + o, 0.22, k === 1 ? 0.2 : -0.2, (t) => {
      const n = rnd();
      lp += 0.35 * (n - lp);
      return (n - lp * 0.8) * env(t, 0.001, k === 2 ? 0.09 : 0.012) * g;
    });
  });
};
const hat = (t0, g, d = 0.018, pan = 0.3) => {
  let lp = 0;
  add(mix, t0, d * 5, pan, (t) => {
    const n = rnd();
    lp += 0.6 * (n - lp);
    return (n - lp) * env(t, 0.0005, d) * g;
  });
};
const b808 = (t0, dur, m, glideTo) => {
  let ph = 0;
  const f0 = hz(m);
  const f1 = glideTo ? hz(glideTo) : f0;
  add(mix, t0, dur + 0.08, 0, (t) => {
    const f = f0 + (f1 - f0) * Math.min(1, t / (dur * 0.6)) ** 2 + 30 * Math.exp(-t / 0.015);
    ph += (2 * Math.PI * f) / SR;
    const rel = t > dur ? Math.exp(-(t - dur) / 0.025) : 1;
    return Math.tanh(Math.sin(ph) * 2.6) * Math.min(1, t / 0.004) * (0.7 + 0.3 * Math.exp(-t / 0.3)) * rel * 0.46;
  }, 0.7);
};
const lead = (t0, m, g = 1) => {
  const f = hz(m);
  [0, 1, 2].forEach((e) =>
    [-0.012, 0, 0.012].forEach((det, k) =>
      add(mix, t0 + e * STEP * 3, 0.5, e === 0 ? (k - 1) * 0.5 : e % 2 ? -0.7 : 0.7, (t) => {
        return saw(f * (1 + det), t, 0.05 + t * 1.6) * env(t, 0.003, 0.16) * 0.085 * g * 0.38 ** e;
      }, 0.5),
    ),
  );
};
const pad = (t0, dur, notes) =>
  notes.forEach((m, k) => {
    const f = hz(m);
    add(mix, t0, dur, (k - 1) * 0.6, (t) => {
      const e = Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.05);
      return (saw(f * 1.004, t, 0.35) + saw(f * 0.996, t, 0.35)) * e * 0.028;
    }, 1);
  });
const riser = (t0, dur) => {
  let lp = 0;
  add(mix, t0, dur, 0, (t) => {
    const p = t / dur;
    const n = rnd();
    lp += (0.05 + 0.6 * p * p) * (n - lp);
    return (n - lp) * p * p * 0.16;
  });
};
const crash = (t0) => {
  let lp = 0;
  add(mix, t0, 1.2, 0, (t) => {
    const n = rnd();
    lp += 0.7 * (n - lp);
    return (n - lp) * env(t, 0.002, 0.3) * 0.2;
  });
};

// --- arreglo: Dm | Bb | F | C (vi–IV–I–V) ---
const CH = [
  {root: 38, notes: [62, 65, 69]},
  {root: 34, notes: [58, 62, 65]},
  {root: 41, notes: [60, 65, 69]},
  {root: 36, notes: [60, 64, 67]},
];
const MEL = [
  [[0, 74], [3, 77], [6, 74], [8, 81], [11, 79], [14, 77]],
  [[0, 74], [3, 77], [6, 74], [8, 82], [11, 81], [14, 77]],
  [[0, 72], [3, 77], [6, 72], [8, 81], [11, 79], [14, 77]],
  [[0, 76], [3, 79], [6, 76], [8, 84], [10, 79], [12, 76], [14, 79]],
];
const KICKS = [0, 4, 8, 11, 14]; // bounce jersey club
const at = (bar, step) => (bar * 16 + step) * STEP;

for (let b = 0; b < BARS; b++) for (const s of KICKS) kick(mix, at(b, s));
for (let b = 0; b < BARS; b++) {
  const c = CH[b % 4];
  const fill = b % 4 === 3;
  if (b % 4 === 0) crash(at(b, 0));
  clap(at(b, 4));
  clap(at(b, 12));
  for (let s = 0; s < 16; s += 2) hat(at(b, s), s % 4 === 2 ? 0.1 : 0.07);
  hat(at(b, 10), 0.07, 0.06, -0.3); // hat abierto
  // rolls
  const roll = b % 2 ? [6, 6.5, 7, 7.5] : [14, 14.5, 15, 15.5];
  roll.forEach((s, k) => hat(at(b, s), 0.05 + 0.012 * k, 0.012, -0.1));
  if (fill) {
    riser(at(b, 8), 8 * STEP);
    for (let s = 12; s < 16; s += 0.5) clap(at(b, s), 0.1 + 0.02 * (s - 12));
  }
  // 808
  b808(at(b, 0), 5.5 * STEP, c.root);
  b808(at(b, 8), 2.6 * STEP, c.root);
  b808(at(b, 11), 2.6 * STEP, c.root);
  b808(at(b, 14), 1.8 * STEP, c.root + 12, fill ? c.root + 7 : undefined);
  pad(at(b, 0), 16 * STEP, c.notes);
  for (const [s, m] of MEL[b % 4]) {
    lead(at(b, s), m);
    if (b >= 8) lead(at(b, s), m + 12, 0.35); // segunda vuelta: octava arriba
  }
}

const write = (bus, name, peakDb) => {
  let peak = 0;
  for (let i = 0; i < bus.n; i++) {
    bus.L[i] = Math.tanh(bus.L[i] * 1.5);
    bus.R[i] = Math.tanh(bus.R[i] * 1.5);
    peak = Math.max(peak, Math.abs(bus.L[i]), Math.abs(bus.R[i]));
  }
  const g = 10 ** (peakDb / 20) / peak;
  const buf = Buffer.alloc(44 + bus.n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + bus.n * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(bus.n * 4, 40);
  for (let i = 0; i < bus.n; i++) {
    buf.writeInt16LE(Math.round(bus.L[i] * g * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(bus.R[i] * g * 32767), 46 + i * 4);
  }
  const out = fileURLToPath(new URL(`./public/${name}`, import.meta.url));
  writeFileSync(out, buf);
  console.log(`ok ${name} | ${(bus.n / SR).toFixed(2)}s`);
};
write(mix, 'music-punch.wav', -2);

// SFX: impacto grave para la entrada del CTA
const fx = mk(Math.floor(1.2 * SR));
let ph = 0;
let lp = 0;
add(fx, 0, 1.2, 0, (t) => {
  ph += (2 * Math.PI * (38 + 110 * Math.exp(-t / 0.06))) / SR;
  const n = rnd();
  lp += 0.3 * (n - lp);
  return Math.tanh(Math.sin(ph) * 2) * env(t, 0.002, 0.3) * 0.8 + (n - lp) * env(t, 0.001, 0.12) * 0.3;
});
write(fx, 'sfx-impact.wav', -3);
