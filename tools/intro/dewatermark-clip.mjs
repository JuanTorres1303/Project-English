// Generic watermark remover for short AI clips with a STATIC logo over a MOVING scene.
// Mask: a logo pixel stays bright in every frame, the scene behind it does not, so
// temporal-minimum brightness minus its local background reveals the glyphs.
// Repair: each masked pixel is filled from its 4 nearest clean pixels (1/d^2),
// smoothed inside the mask, plus a little grain. Pixels outside the mask are untouched.
//
// Usage:
//   node dewatermark-clip.mjs <in.mp4> <out.mp4> <x> <y> <w> <h> [--preview dir]
//   (x y w h = a box around the logo, in source pixels)
import ffmpeg from "ffmpeg-static";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const [inp, out, ...rest] = process.argv.slice(2);
const [RX, RY, RW, RH] = rest.slice(0, 4).map(Number);
const preview = rest.includes("--preview") ? rest[rest.indexOf("--preview") + 1] : null;
if (!inp || !out || !RH) throw new Error("usage: dewatermark-clip.mjs in out x y w h [--preview dir]");

const probe = spawnSync(ffmpeg, ["-i", inp], { encoding: "utf8" }).stderr;
const [, W, H] = probe.match(/Video:.*?(\d{3,5})x(\d{3,5})/).map(Number);
const fps = Number((probe.match(/(\d+(?:\.\d+)?) fps/) || [0, 24])[1]);
const FB = W * H * 3, N = RW * RH;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

const all = spawnSync(ffmpeg, ["-v", "error", "-i", inp, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 2 ** 31 }).stdout;
const NF = Math.floor(all.length / FB);

// 1) temporal minimum luminance inside the box
const minL = new Float32Array(N).fill(255);
for (let f = 0; f < NF; f++) for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  const k = f * FB + ((RY + y) * W + RX + x) * 3;
  const l = (all[k] + all[k + 1] + all[k + 2]) / 3;
  const i = y * RW + x;
  if (l < minL[i]) minL[i] = l;
}
// local background of the min image = 25th percentile in a window
const bg = new Float32Array(N);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  const v = [];
  for (let dy = -8; dy <= 8; dy += 2) for (let dx = -8; dx <= 8; dx += 2) v.push(minL[clamp(y + dy, 0, RH - 1) * RW + clamp(x + dx, 0, RW - 1)]);
  v.sort((a, b) => a - b); bg[y * RW + x] = v[Math.floor(v.length * 0.25)];
}
const core = new Uint8Array(N);
for (let i = 0; i < N; i++) core[i] = minL[i] - bg[i] > 18 && minL[i] > 120 ? 1 : 0;
// grow by DIL px to cover anti-aliasing and codec halo
const DIL = 3, hole = new Uint8Array(N);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  if (!core[y * RW + x]) continue;
  for (let dy = -DIL; dy <= DIL; dy++) for (let dx = -DIL; dx <= DIL; dx++) {
    const xx = x + dx, yy = y + dy;
    if (xx >= 0 && yy >= 0 && xx < RW && yy < RH && dx * dx + dy * dy <= DIL * DIL) hole[yy * RW + xx] = 1;
  }
}
// nearest clean pixel in 4 directions
const nb = new Int32Array(N * 4).fill(-1), nd = new Float32Array(N * 4);
for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
  const i = y * RW + x; if (!hole[i]) continue;
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy], d) => {
    let xx = x, yy = y, s = 0;
    for (;;) { xx += dx; yy += dy; s++; if (xx < 0 || yy < 0 || xx >= RW || yy >= RH) return; if (!hole[yy * RW + xx]) { nb[i * 4 + d] = yy * RW + xx; nd[i * 4 + d] = s; return; } }
  });
}

function repair(buf, off) {
  const P = new Float32Array(N * 3);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = off + ((RY + y) * W + RX + x) * 3, i = (y * RW + x) * 3;
    P[i] = buf[k]; P[i + 1] = buf[k + 1]; P[i + 2] = buf[k + 2];
  }
  const src = P.slice();
  for (let i = 0; i < N; i++) {
    if (!hole[i]) continue;
    let a = 0, b = 0, c = 0, ws = 0;
    for (let d = 0; d < 4; d++) { const j = nb[i * 4 + d]; if (j < 0) continue; const w = 1 / nd[i * 4 + d] ** 2; a += src[j * 3] * w; b += src[j * 3 + 1] * w; c += src[j * 3 + 2] * w; ws += w; }
    if (ws) { P[i * 3] = a / ws; P[i * 3 + 1] = b / ws; P[i * 3 + 2] = c / ws; }
  }
  for (let pass = 0; pass < 3; pass++) {
    const Q = P.slice();
    for (let y = 1; y < RH - 1; y++) for (let x = 1; x < RW - 1; x++) {
      const i = y * RW + x; if (!hole[i]) continue;
      for (let ch = 0; ch < 3; ch++) {
        let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += Q[((y + dy) * RW + x + dx) * 3 + ch];
        P[i * 3 + ch] = s / 9;
      }
    }
  }
  for (let i = 0; i < N; i++) {
    if (!hole[i]) continue;
    const y = (i / RW) | 0, x = i - y * RW, k = off + ((RY + y) * W + RX + x) * 3, g = (Math.random() - 0.5) * 5;
    buf[k] = clamp(P[i * 3] + g, 0, 255); buf[k + 1] = clamp(P[i * 3 + 1] + g, 0, 255); buf[k + 2] = clamp(P[i * 3 + 2] + g, 0, 255);
  }
}

if (preview) {
  mkdirSync(preview, { recursive: true });
  const m = Buffer.alloc(N * 3); for (let i = 0; i < N; i++) m[i * 3] = m[i * 3 + 1] = m[i * 3 + 2] = hole[i] ? 255 : core[i] ? 128 : 0;
  spawnSync(ffmpeg, ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${RW}x${RH}`, "-i", "-", resolve(preview, "mask.png")], { input: m });
  for (const f of [3, Math.floor(NF / 2) - 2, Math.floor(NF / 2) + 4, NF - 2]) {
    const fr = Buffer.from(all.subarray(f * FB, (f + 1) * FB));
    const crop = (b) => { const o = Buffer.alloc(RW * RH * 3); for (let y = 0; y < RH; y++) b.copy(o, y * RW * 3, ((RY + y) * W + RX) * 3, ((RY + y) * W + RX + RW) * 3); return o; };
    const before = crop(fr); repair(fr, 0); const after = crop(fr);
    spawnSync(ffmpeg, ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${RW}x${RH * 2}`, "-i", "-", "-vf", "scale=iw*3:-1:flags=neighbor", resolve(preview, `f${f}.png`)], { input: Buffer.concat([before, after]) });
  }
  console.log("preview in", preview);
} else {
  const enc = spawn(ffmpeg, ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${W}x${H}`, "-r", String(fps), "-i", "-", "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", out], { stdio: ["pipe", "ignore", "inherit"] });
  for (let f = 0; f < NF; f++) {
    const fr = Buffer.from(all.subarray(f * FB, (f + 1) * FB));
    repair(fr, 0);
    if (!enc.stdin.write(fr)) await new Promise((r) => enc.stdin.once("drain", r));
  }
  enc.stdin.end(); await new Promise((r) => enc.on("close", r));
  console.log(`${NF} frames cleaned -> ${out}`);
}
