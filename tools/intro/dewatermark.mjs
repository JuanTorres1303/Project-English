// Remove the "MiniMax | Hailuo AI" watermark from the Neapolis intro, keeping the full frame.
// 1) Estimate the watermark's per-pixel opacity (alpha) from the first desert frames,
//    where the background is smooth.  2) For every frame, only inside the watermark's box:
//    invert the alpha blend on soft edge pixels and inpaint (onion-peel fill from
//    surrounding real pixels) the near-opaque glyph pixels. Everything else is untouched.
// Usage: node dewatermark.mjs [--preview DIR]   (preview = write a few before/after crops only)
import ffmpeg from 'ffmpeg-static';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = resolve(ROOT, readdirSync(ROOT).find(n => /^Hailuo_Video.*\.mp4$/i.test(n)));
const OUT = resolve(ROOT, 'assets', 'neapolis-intro.mp4');
const args = process.argv.slice(2);
const preview = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;

const W = 2944, H = 1248, FB = W * H * 3;
// watermark box (measured), with margin
const RX = 2190, RY = 1088, RW = 730, RH = 112;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function decodeFrames(extra = []) {
  const r = spawnSync(ffmpeg, ['-v', 'error', '-i', SRC, ...extra, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 2 ** 31 });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  return r.stdout;
}

// ---------- 1) alpha estimate from the first 8 frames (smooth desert) ----------
const head = decodeFrames(['-frames:v', '8']);
const NFH = head.length / FB;
const N = RW * RH;
const acc = new Float32Array(N);
const WM = 248;                       // watermark ink brightness
for (let f = 0; f < NFH; f++) {
  const base = f * FB;
  const L = new Float32Array(N);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = base + ((RY + y) * W + RX + x) * 3;
    L[y * RW + x] = (head[k] + head[k + 1] + head[k + 2]) / 3;
  }
  // background = per-row robust low percentile over a horizontal window (desert is smooth)
  const B = new Float32Array(N), win = 40;
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const vals = [];
    for (let dx = -win; dx <= win; dx += 4) { const xx = clamp(x + dx, 0, RW - 1); for (let dy = -6; dy <= 6; dy += 3) { const yy = clamp(y + dy, 0, RH - 1); vals.push(L[yy * RW + xx]); } }
    vals.sort((a, b) => a - b); B[y * RW + x] = vals[Math.floor(vals.length * 0.3)];
  }
  for (let i = 0; i < N; i++) acc[i] += clamp((L[i] - B[i]) / (WM - B[i]));
}
const alpha = acc.map(v => v / NFH);
for (let i = 0; i < N; i++) if (alpha[i] < 0.06) alpha[i] = 0;
// slight dilation of the mask so compression halos are covered
const A = new Float32Array(N);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  let m = alpha[y * RW + x];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < RW && yy < RH) m = Math.max(m, alpha[yy * RW + xx] * 0.85); }
  A[y * RW + x] = m;
}
// binary hole = glyph pixels (alpha > 0.25) grown by DIL px to swallow anti-aliasing + codec halo
const DIL = 8;
const core = new Uint8Array(N); for (let i = 0; i < N; i++) core[i] = alpha[i] > 0.15 ? 1 : 0;
// drop isolated speckles: keep a core pixel only if ≥ 12 of its 5×5 neighbours are core too
const core2 = new Uint8Array(N);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  if (!core[y * RW + x]) continue; let c = 0;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < RW && yy < RH) c += core[yy * RW + xx]; }
  core2[y * RW + x] = c >= 12 ? 1 : 0;
}
const hole = new Uint8Array(N);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  if (!core2[y * RW + x]) continue;
  for (let dy = -DIL; dy <= DIL; dy++) for (let dx = -DIL; dx <= DIL; dx++) {
    const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < RW && yy < RH && dx * dx + dy * dy <= DIL * DIL) hole[yy * RW + xx] = 1;
  }
}
// precompute, for each hole pixel, the nearest known pixel in the 4 directions
const nb = new Int32Array(N * 4).fill(-1), nd = new Float32Array(N * 4);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  const i = y * RW + x; if (!hole[i]) continue;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  dirs.forEach(([dx, dy], d) => {
    let xx = x, yy = y, s = 0;
    while (true) { xx += dx; yy += dy; s++; if (xx < 0 || yy < 0 || xx >= RW || yy >= RH) return; if (!hole[yy * RW + xx]) { nb[i * 4 + d] = yy * RW + xx; nd[i * 4 + d] = s; return; } }
  });
}

// ---------- 2) per-frame repair, region only ----------
function repair(buf, off) {
  // read the region (pre-repair values; hole pixels are only ever written, never read)
  const P = new Uint8Array(N * 3);
  for (let y = 0; y < RH; y++) { const k = off + ((RY + y) * W + RX) * 3; buf.copy(P, y * RW * 3, k, k + RW * 3); }
  // fill each hole pixel from its 4 nearest known pixels, weighted 1/dist² (horizontal pair
  // favoured: the watermark is a wide, short strip, so vertical spans are the short ones)
  for (let i = 0; i < N; i++) {
    if (!hole[i]) continue;
    let s0 = 0, s1 = 0, s2 = 0, ws = 0;
    for (let d = 0; d < 4; d++) {
      const j = nb[i * 4 + d]; if (j < 0) continue;
      const w = 1 / (nd[i * 4 + d] * nd[i * 4 + d]);
      s0 += P[j * 3] * w; s1 += P[j * 3 + 1] * w; s2 += P[j * 3 + 2] * w; ws += w;
    }
    if (!ws) continue;
    P[i * 3] = s0 / ws; P[i * 3 + 1] = s1 / ws; P[i * 3 + 2] = s2 / ws;
  }
  // smooth inside the hole only (kills directional streaks), then add matching grain
  for (let pass = 0; pass < 4; pass++) {
    const Q = P.slice();
    for (let y = 2; y < RH - 2; y++) for (let x = 2; x < RW - 2; x++) {
      const i = y * RW + x; if (!hole[i]) continue;
      let s0 = 0, s1 = 0, s2 = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const j = i + dy * RW + dx; s0 += Q[j * 3]; s1 += Q[j * 3 + 1]; s2 += Q[j * 3 + 2]; }
      P[i * 3] = s0 / 25; P[i * 3 + 1] = s1 / 25; P[i * 3 + 2] = s2 / 25;
    }
  }
  for (let i = 0; i < N; i++) {
    if (!hole[i]) continue;
    const y = (i / RW) | 0, x = i - y * RW, k = off + ((RY + y) * W + RX + x) * 3;
    const g = (Math.random() - 0.5) * 7;
    buf[k] = clamp(P[i * 3] + g, 0, 255); buf[k + 1] = clamp(P[i * 3 + 1] + g, 0, 255); buf[k + 2] = clamp(P[i * 3 + 2] + g, 0, 255);
  }
}

if (preview) {
  mkdirSync(preview, { recursive: true });
  // alpha mask preview
  const m = Buffer.alloc(N * 3); for (let i = 0; i < N; i++) m[i * 3] = m[i * 3 + 1] = m[i * 3 + 2] = Math.round(A[i] * 255);
  const enc = (raw, w, h, name) => spawnSync(ffmpeg, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', resolve(preview, name)], { input: raw });
  enc(m, RW, RH, 'mask.png');
  for (const t of [0.2, 1.5, 3.0, 5.1]) {
    const fr = decodeFrames(['-ss', String(t), '-frames:v', '1']);
    const crop = (b) => { const o = Buffer.alloc(900 * 220 * 3); for (let y = 0; y < 220; y++) b.copy(o, y * 900 * 3, ((1028 + y) * W + 2044) * 3, ((1028 + y) * W + 2044 + 900) * 3); return o; };
    const before = crop(fr); repair(fr, 0); const after = crop(fr);
    enc(Buffer.concat([before, after]), 900, 440, `t${t}.png`);
  }
  console.log('preview written to', preview);
} else {
  const dec = spawn(ffmpeg, ['-v', 'error', '-i', SRC, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  const enc = spawn(ffmpeg, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', '24', '-i', '-', '-an',
    '-vf', 'scale=1920:-2:flags=lanczos,unsharp=5:5:0.5:5:5:0.0,tpad=stop_mode=clone:stop_duration=0.83',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-g', '8', '-keyint_min', '8', '-sc_threshold', '0', '-movflags', '+faststart', OUT],
    { stdio: ['pipe', 'ignore', 'inherit'] });
  let pending = Buffer.alloc(0), n = 0;
  for await (const chunk of dec.stdout) {
    pending = Buffer.concat([pending, chunk]);
    while (pending.length >= FB) {
      const fr = Buffer.from(pending.subarray(0, FB)); pending = pending.subarray(FB);
      repair(fr, 0);
      if (!enc.stdin.write(fr)) await new Promise(r => enc.stdin.once('drain', r));
      n++;
    }
  }
  enc.stdin.end(); await new Promise(r => enc.on('close', r));
  console.log(`${n} frames → ${OUT}`);
}
