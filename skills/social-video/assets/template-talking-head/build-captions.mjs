// Genera src/projects/<id>.json desde ../<dir>/transcript.json
// Uso: node build-captions.mjs v1      (o v2, o sin arg = todos)
// Luego: npm run render  (o: npx remotion render <id> out/<id>.mp4 --codec=h264 --crf=18)
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

const FPS = 30;

// ====== CONFIG POR VIDEO ======
// cuts = pausas (segundos del video ORIGINAL) que se eliminan.
// fixes = correcciones de texto (palabras que el merge de tokens pega mal).
// hook = overlay de impacto primeros 3s. cta = placa final.
const CONFIG = {
  // EJEMPLO (borrar/copiar). Requiere public/v1.mp4 y ../v1/transcript.json (whisper-cli)
  // v1: {
  //   dir: 'v1',
  //   src: 'v1.mp4',
  //   end: 22.4, // duración útil del original (recorta cola muda)
  //   cuts: [[6.84, 7.3], [8.55, 9.11]], // pausas a eliminar (seg del original)
  //   fixes: {sabes: 'sabés'}, // correcciones del transcript
  //   hook: {top: 'TEXTO DE ARRIBA', box: 'IMPACTO'},
  //   cta: {line1: 'LÍNEA 1', box: 'CAJA', line2: 'LÍNEA 2', badge: '👇 GRATIS'},
  // },
};

// Regenera src/projects/index.ts con todos los <id>.json (Root.tsx lo importa)
function writeIndex() {
  const dir = here('./src/projects/');
  const ids = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
  const lines = [
    '// GENERADO por el build — no editar a mano',
    "import type {Project} from '../Root';",
    ...ids.map((id, i) => `import p${i} from './${id}.json';`),
    `export const projects = [${ids.map((_, i) => 'p' + i).join(', ')}] as unknown as Project[];`,
    '',
  ];
  writeFileSync(dir + 'index.ts', lines.join('\n'));
}

function build(id) {
  const c = CONFIG[id];
  if (!c) throw new Error('config no encontrada para ' + id);
  const tfile = c.transcript || 'transcript.json';
  const j = JSON.parse(readFileSync(new URL(`../${c.dir}/${tfile}`, import.meta.url), 'utf8'));

  // Reconstruir palabras: nueva palabra cuando el token arranca con espacio
  const words = [];
  for (const s of j.transcription) {
    const raw = s.text;
    const clean = raw.trim();
    if (clean === '') continue;
    const isNew = /^\s/.test(raw) || words.length === 0;
    if (isNew) words.push({t: clean, a: s.offsets.from / 1000, b: s.offsets.to / 1000});
    else {
      const w = words[words.length - 1];
      w.t += clean;
      w.b = s.offsets.to / 1000;
    }
  }
  // fixes: matchea ignorando puntuación final, la reconserva
  if (c.fixes)
    for (const w of words) {
      const m = w.t.match(/^(.*?)([.,!?;]*)$/);
      const stem = m[1];
      const punct = m[2];
      if (c.fixes[w.t]) w.t = c.fixes[w.t];
      else if (c.fixes[stem]) w.t = c.fixes[stem] + punct;
    }

  // Bloques conservados (complemento de los cortes)
  const blocks = [];
  let p = 0;
  for (const [cs, ce] of c.cuts) {
    blocks.push([+p.toFixed(3), +cs.toFixed(3)]);
    p = ce;
  }
  blocks.push([+p.toFixed(3), c.end]);

  const off = [];
  let tot = 0;
  for (const b of blocks) {
    off.push(+tot.toFixed(3));
    tot += b[1] - b[0];
  }

  const map = (t) => {
    let nt = t;
    for (const [cs, ce] of c.cuts) {
      if (t >= ce) nt -= ce - cs;
      else if (t > cs) nt -= t - cs;
    }
    return +nt.toFixed(3);
  };

  const cap = words.map((w) => ({t: w.t.trim(), a: map(w.a), b: map(w.b)}));

  const project = {
    id,
    src: c.src,
    hook: c.hook,
    cta: c.cta,
    data: {blocks, offsets: off, total: +tot.toFixed(3), fps: FPS, words: cap},
  };
  writeFileSync(new URL(`./src/projects/${id}.json`, import.meta.url), JSON.stringify(project));
  console.log(`[${id}] ok | ${+tot.toFixed(3)}s | ${cap.length} palabras`);
  console.log('   ' + cap.map((w) => w.t).join(' '));
}

const arg = process.argv[2];
const ids = arg ? [arg] : Object.keys(CONFIG);
for (const id of ids) build(id);
writeIndex();
