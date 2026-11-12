// Neapolis — 6 s "the city is being built" intro (1920×1080, 30 fps).
// Blueprint lines draw in from the welcome sign, then the city materialises in
// colour block by block — up the avenue to the towers, the sunset sky last —
// while the camera pulls back from the sign to the full panorama.
// Usage:
//   node render-intro.mjs                       → assets/neapolis-intro.mp4 + poster
//   node render-intro.mjs --frames DIR --only 0,90,179   → preview JPGs only
import { createCanvas, loadImage } from '@napi-rs/canvas';
import ffmpeg from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
// --src <image> --out <mp4> (defaults: Bogota keyframe 1 -> videos/clips/0-intro.mp4)
const SRC = resolve(ROOT, arg('--src', 'videos/fotogramas/1-bienvenidos-bogota.png'));
const OUT = resolve(ROOT, arg('--out', 'videos/clips/0-intro.mp4'));
const POSTER = OUT.replace(/\.mp4$/i, '-last.webp');
void readdirSync;

const framesDir = args.includes('--frames') ? args[args.indexOf('--frames') + 1] : null;
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',').map(Number) : null;

const W = 1920, H = 1080, FPS = 24, DUR = 6, NF = FPS * DUR;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------- precompute: city plate (cover-fit to 1920×1080) ----------
const img = await loadImage(readFileSync(SRC));
const s = Math.max(W / img.width, H / img.height);
const dw = img.width * s, dh = img.height * s, ox = (W - dw) / 2, oy = (H - dh) / 2;
const plate = createCanvas(W, H); const px = plate.getContext('2d');
px.imageSmoothingQuality = 'high'; px.drawImage(img, ox, oy, dw, dh);
const city = px.getImageData(0, 0, W, H).data;
const toOut = (x, y) => [ox + x * s, oy + y * s];      // source px → output px

// luminance + Sobel edges → blueprint lines
const N = W * H, lum = new Float32Array(N), edge = new Float32Array(N);
for (let i = 0; i < N; i++) lum[i] = (0.299 * city[i * 4] + 0.587 * city[i * 4 + 1] + 0.114 * city[i * 4 + 2]) / 255;
const sample = [];
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const i = y * W + x;
  const gx = -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] + lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1];
  const gy = -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] + lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1];
  edge[i] = Math.hypot(gx, gy);
  if ((x * 7 + y * 13) % 29 === 0) sample.push(edge[i]);
}
sample.sort((a, b) => a - b); const e95 = sample[Math.floor(sample.length * 0.95)] || 1;
for (let i = 0; i < N; i++) edge[i] = clamp(edge[i] / e95);

// build order: grows from the welcome sign up the avenue; the sky fills in last
// anchors as fractions of the source image (Bogota keyframe 1)
const [sx0, sy0] = toOut(0.355 * img.width, 0.61 * img.height);   // "BIENVENIDOS A BOGOTA" station sign
const [vx, vy] = toOut(0.578 * img.width, 0.326 * img.height);    // avenue vanishing point
const horizon = toOut(0, 0.27 * img.height)[1];
const dmax = Math.hypot(W, H);
const ordL = new Float32Array(N), ordC = new Float32Array(N);
const CELL = 26;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x;
  const fromSign = Math.hypot(x - sx0, y - sy0) / dmax;
  const along = 1 - Math.hypot(x - vx, y - vy) / dmax;      // nearer the avenue's end = later
  let base = 0.45 * fromSign + 0.25 * along + 0.30 * (1 - y / H);
  if (y < horizon) base += 0.35 * (1 - y / horizon);         // sky last
  ordL[i] = base * 0.93 + hash(x >> 2, y >> 2) * 0.07;
  // one start time per block (taken at the block's centre), so each block rises as a unit
  const cxB = ((x / CELL) | 0) * CELL + CELL / 2, cyB = ((y / CELL) | 0) * CELL + CELL / 2;
  let bb = 0.45 * Math.hypot(cxB - sx0, cyB - sy0) / dmax + 0.25 * (1 - Math.hypot(cxB - vx, cyB - vy) / dmax) + 0.30 * (1 - cyB / H);
  if (cyB < horizon) bb += 0.35 * (1 - cyB / horizon);
  ordC[i] = bb * 0.85 + hash((x / CELL) | 0, (y / CELL) | 0) * 0.15;
}
const norm = a => { let lo = Infinity, hi = -Infinity; for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; } for (let i = 0; i < a.length; i++) a[i] = (a[i] - lo) / (hi - lo); };
norm(ordL); norm(ordC);
// inside each block, fill from its bottom edge up (a block "being raised")
const RISE = 0.03;
for (let y = 0; y < H; y++) { const up = 1 - (y % CELL) / (CELL - 1); for (let x = 0; x < W; x++) ordC[y * W + x] += up * RISE; }

// blueprint sheet + annotations (annotations fade out as the city completes)
const bp = createCanvas(W, H); {
  const b = bp.getContext('2d');
  const g = b.createRadialGradient(W / 2, H * 0.55, 120, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, '#133d68'); g.addColorStop(1, '#06182c');
  b.fillStyle = g; b.fillRect(0, 0, W, H);
  for (let x = 0; x <= W; x += 24) { b.fillStyle = x % 120 === 0 ? 'rgba(127,227,255,0.12)' : 'rgba(127,227,255,0.045)'; b.fillRect(x, 0, 1, H); }
  for (let y = 0; y <= H; y += 24) { b.fillStyle = y % 120 === 0 ? 'rgba(127,227,255,0.12)' : 'rgba(127,227,255,0.045)'; b.fillRect(0, y, W, 1); }
}
const notes = createCanvas(W, H); {
  const b = notes.getContext('2d');
  b.font = '600 17px Consolas, monospace'; b.fillStyle = 'rgba(190,240,255,0.9)';
  b.fillText('BOGOTA — MASTER PLAN', 64, 80);
  b.font = '14px Consolas, monospace'; b.fillStyle = 'rgba(190,240,255,0.65)';
  b.fillText('SHEET 01 / 05      SCALE 1:1000', 64, 106);
  b.fillText('ZERO EMISSIONS · 100% RENEWABLE', W - 400, 80);
  b.fillStyle = 'rgba(190,240,255,0.6)';
  for (let k = 0; k <= 10; k++) b.fillRect(W - 400 + k * 24, 98, 1, k % 5 ? 6 : 12);
  b.fillRect(W - 400, 104, 240, 1);
  b.strokeStyle = 'rgba(190,240,255,0.6)'; b.lineWidth = 1.5;
  [[64, 64], [W - 64, 64], [64, H - 64], [W - 64, H - 64]].forEach(([x, y]) => {
    const dx = x < W / 2 ? 1 : -1, dy = y < H / 2 ? 1 : -1;
    b.beginPath(); b.moveTo(x, y + 28 * dy); b.lineTo(x, y); b.lineTo(x + 28 * dx, y); b.stroke();
  });
}

// ---------- frame renderer ----------
const frame = createCanvas(W, H), f = frame.getContext('2d');
const out = createCanvas(W, H), o = out.getContext('2d'); o.imageSmoothingQuality = 'high';

function render(n) {
  const t = n / FPS;
  const eo = x => { x = clamp(x); return 1 - (1 - x) * (1 - x); };
  const p1 = -0.05 + 1.10 * eo((t - 0.1) / 2.3);                       // blueprint lines draw in
  const x2 = clamp((t - 1.5) / 3.4);
  const p2 = -0.06 + (1 + RISE + 0.12) * (0.55 * x2 + 0.45 * ease(x2));  // colour builds up, steady pace

  f.globalAlpha = 1; f.drawImage(bp, 0, 0);
  const id = f.getImageData(0, 0, W, H), d = id.data;
  for (let i = 0, k = 0; i < N; i++, k += 4) {
    let r = d[k], g = d[k + 1], bl = d[k + 2];
    const lv = sstep(ordL[i] - 0.03, ordL[i], p1);
    if (lv > 0) {
      const body = lum[i] * 0.2 * lv;
      r += (60 - r) * body; g += (150 - g) * body; bl += (210 - bl) * body;
      const a = clamp(edge[i] * 1.45) * lv;
      r += (150 - r) * a; g += (232 - g) * a; bl += (255 - bl) * a;
      if (p1 < 1.02) { const scan = Math.max(0, 1 - Math.abs(p1 - ordL[i]) / 0.012); r += 110 * scan; g += 130 * scan; bl += 130 * scan; }
    }
    const c = sstep(ordC[i] - 0.006, ordC[i], p2);
    r += (city[k] - r) * c; g += (city[k + 1] - g) * c; bl += (city[k + 2] - bl) * c;
    // thin warm "construction light" along the rising edge of each block
    const front = Math.max(0, 1 - Math.abs(p2 - ordC[i] - 0.004) / 0.006) * c;
    r += 70 * front; g += 60 * front; bl += 35 * front;
    d[k] = r > 255 ? 255 : r; d[k + 1] = g > 255 ? 255 : g; d[k + 2] = bl > 255 ? 255 : bl;
  }
  f.putImageData(id, 0, 0);
  const na = sstep(0.3, 0.9, t) * (1 - sstep(0.12, 0.5, p2));
  if (na > 0) { f.globalAlpha = na; f.drawImage(notes, 0, 0); f.globalAlpha = 1; }

  // warm sunlight sweep once the city is complete (sun is top-left in the plate)
  const sw = sstep(4.6, 5.9, t);
  if (sw > 0 && sw < 1) {
    const cx = -500 + sw * (W + 1000);
    const lg = f.createLinearGradient(cx - 300, 0, cx + 300, H * 0.6);
    const a = 0.2 * Math.sin(sw * Math.PI);
    lg.addColorStop(0, 'rgba(255,225,170,0)'); lg.addColorStop(0.5, `rgba(255,225,170,${a})`); lg.addColorStop(1, 'rgba(255,225,170,0)');
    f.globalCompositeOperation = 'screen'; f.fillStyle = lg; f.fillRect(0, 0, W, H); f.globalCompositeOperation = 'source-over';
  }

  // camera: start close on the welcome sign, pull back to the full panorama
  const cz = ease(t / 5.3), z = 1.28 + (1 - 1.28) * cz;
  const vw = W / z, vh = H / z;
  const fx = sx0 + 80 + (W / 2 - sx0 - 80) * cz, fy = sy0 - 120 + (H / 2 - sy0 + 120) * cz;
  const cx0 = clamp(fx - vw / 2, 0, W - vw), cy0 = clamp(fy - vh / 2, 0, H - vh);
  o.globalAlpha = 1; o.fillStyle = '#000'; o.fillRect(0, 0, W, H);
  o.globalAlpha = sstep(0, 0.35, t); o.drawImage(frame, cx0, cy0, vw, vh, 0, 0, W, H); o.globalAlpha = 1;
  // vignette fades away so the film lands on the untouched keyframe
  const va = 0.32 * (1 - sstep(4.9, 5.8, t));
  if (va > 0.002) {
    const vg = o.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, W * 0.64);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${va})`);
    o.fillStyle = vg; o.fillRect(0, 0, W, H);
  }
  // last frame = the exact keyframe (seamless hand-off to clip 1)
  if (n === NF - 1) { o.globalAlpha = 1; o.drawImage(plate, 0, 0); }
  return out;
}

// ---------- output ----------
if (only) {
  mkdirSync(framesDir, { recursive: true });
  for (const n of only) writeFileSync(resolve(framesDir, `f${String(n).padStart(3, '0')}.jpg`), render(n).toBuffer('image/jpeg', 88));
  console.log('frames written to', framesDir);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  const ff = spawn(ffmpeg, ['-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-g', '8', '-keyint_min', '8', '-sc_threshold', '0', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'ignore', 'inherit'] });
  const write = buf => new Promise(r => ff.stdin.write(buf) ? r() : ff.stdin.once('drain', r));
  const t0 = Date.now();
  for (let n = 0; n < NF; n++) {
    const c = render(n);
    await write(Buffer.from(c.getContext('2d').getImageData(0, 0, W, H).data.buffer));
    if (n === NF - 1) writeFileSync(POSTER, await c.encode('webp', 90));
    if (n % 30 === 0) process.stdout.write(`frame ${n}/${NF}\n`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s →`, OUT);
}
