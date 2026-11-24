// Convierte un clip fuente a public/<id>.mp4 (H.264 SDR, rotación aplicada).
// Los iPhone graban HEVC HDR (HLG): sin tonemap los colores salen lavados.
// Uso: node prep.mjs <archivo-fuente> <id>
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const [input, id] = process.argv.slice(2);
if (!input || !id) throw new Error('Uso: node prep.mjs <archivo-fuente> <id>');
const out = fileURLToPath(new URL(`./public/${id}.mp4`, import.meta.url));
const probe = (entries) =>
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'csv=p=0', input]).toString().trim();
const transfer = probe('stream=color_transfer');
const hdr = /arib-std-b67|smpte2084/.test(transfer);
const hasAudio = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', input]).toString().trim() !== '';
const vf = hdr
  ? ['-vf', 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p']
  : ['-pix_fmt', 'yuv420p'];
execFileSync(
  'ffmpeg',
  ['-v', 'error', '-y', '-i', input, '-map', '0:v:0', ...(hasAudio ? ['-map', '0:a:0', '-c:a', 'aac', '-b:a', '160k'] : []), ...vf, '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-movflags', '+faststart', out],
  {stdio: 'inherit'},
);
console.log(`ok ${out} | ${hdr ? 'HDR→SDR (' + transfer + ')' : 'SDR'} | ${probe('stream=width,height')} | ${execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim()}s`);
