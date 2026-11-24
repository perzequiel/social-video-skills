// Genera voz en off (edge-tts) + src/projects/<id>.json
// Uso: node build.mjs v1          (reusa la voz si ya existe)
//      node build.mjs v1 --tts    (regenera la voz: cambió el guion/voz/rate)
// Luego: npx remotion render <id> out/<id>.mp4 --codec=h264 --crf=18
import {readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const FPS = 30;
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

// ====== CONFIG POR VIDEO ======
// script = lo que dice la voz. ctaScript = frase final (se dice sobre la placa CTA).
// hook = overlay primeros 3s. cta = placa final. wordColors = color de palabra activa.
// music/musicVolume = música de fondo (node gen-music.mjs). speak = pronunciación.
// srcVolume = volumen del audio original del clip (0 = mute). tail = seg extra tras la voz.
const CONFIG = {
  // EJEMPLO (borrar/copiar). Requiere public/v1.mp4 (ver prep.mjs) y carpeta ../v1/
  // v1: {
  //   dir: 'v1',
  //   src: 'v1.mp4',
  //   voice: 'es-AR-TomasNeural', // uvx edge-tts --list-voices
  //   rate: '+10%',
  //   pitch: '+0Hz',
  //   srcVolume: 0.06,
  //   music: 'music-punch.wav', // o 'music-chill.wav', o un cover de Suno, o null
  //   musicStart: 0, // seg del tema donde arranca (saltear intros)
  //   musicVolume: 0.14,
  //   speak: {Bluetooth: 'blútut'}, // pronunciación fonética; el subtítulo muestra el guion
  //   tail: 1.3,
  //   script: 'Este es el nuevo parlante viral que funciona a conducción ósea. Disponibles en color rojo, azul y negro. Conexión Bluetooth. Aceptamos todos los métodos de pago.',
  //   ctaScript: '¡No te quedes sin el tuyo, pedilo ahora!',
  //   wordColors: {rojo: '#FF4438', azul: '#4D8DFF'},
  //   hook: {top: '¿YA LO VISTE?', box: 'VIRAL'},
  //   cta: {line1: 'NO TE QUEDES SIN', box: 'EL TUYO', line2: 'PEDILO AHORA', badge: '👇 COMPRALO YA'},
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

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function build(id, forceTts) {
  const c = CONFIG[id];
  if (!c) throw new Error('config no encontrada para ' + id);
  const voiceFile = `${id}-voice.mp3`;
  const mp3 = here(`./public/${voiceFile}`);
  const wjson = here(`../${c.dir}/voice-words.json`);
  mkdirSync(here(`../${c.dir}/`), {recursive: true});
  const full = `${c.script} ${c.ctaScript}`;
  let spoken = full;
  for (const [k, v] of Object.entries(c.speak || {})) spoken = spoken.replaceAll(k, v);

  if (forceTts || !existsSync(mp3) || !existsSync(wjson)) {
    execFileSync(
      'uvx',
      ['--with', 'edge-tts', 'python', here('./tts.py'), spoken, c.voice, c.rate, c.pitch, mp3, wjson],
      {stdio: 'inherit'},
    );
  }

  // Tiempos de edge-tts + puntuación del guion (para cortar frases)
  const timed = JSON.parse(readFileSync(wjson, 'utf8'));
  const tokens = full.split(/\s+/).filter((t) => norm(t) !== '');
  const aligned = tokens.length === timed.length;
  if (!aligned) console.warn(`Ojo [${id}]: guion y tiempos no alinean (¿falta --tts?), uso texto sin puntuación`);
  const words = timed.map((w, i) => ({t: aligned ? tokens[i].replace(/[¡¿]/g, '') : w.t, a: w.a, b: w.b}));

  const nMain = c.script.split(/\s+/).filter((t) => norm(t) !== '').length;
  const ctaStart = +(words[nMain].a - 0.2).toFixed(3);
  const total = +(words[words.length - 1].b + c.tail).toFixed(3);

  const project = {
    id,
    src: c.src,
    voice: voiceFile,
    srcVolume: c.srcVolume,
    music: c.music || null,
    musicStart: c.musicStart ?? 0,
    musicVolume: c.musicVolume ?? 0.2,
    hook: c.hook,
    cta: c.cta,
    wordColors: c.wordColors || {},
    data: {total, ctaStart, fps: FPS, words: words.slice(0, nMain)},
  };
  writeFileSync(here(`./src/projects/${id}.json`), JSON.stringify(project));
  console.log(`[${id}] ok | ${total}s | cta @${ctaStart}s | ${words.length} palabras`);
}

const args = process.argv.slice(2);
const forceTts = args.includes('--tts');
const ids = args.filter((a) => !a.startsWith('--'));
for (const id of ids.length ? ids : Object.keys(CONFIG)) build(id, forceTts);
writeIndex();
