// Camera-move transition clips between two stills (no AI): a slow drone-like push into
// image A toward the place we travel to, then a soft motion-blurred hand-off into image B
// where the SAME object (or direction of travel) sits at the same screen position and size,
// then B settles onto its exact frame. First frame == A, last frame == B (seamless chaining).
//
// Usage: node make-clips.mjs [--only 1,2] [--preview DIR]
import { createCanvas, loadImage } from "@napi-rs/canvas";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const KF = (n) => resolve(ROOT, "videos", "fotogramas", n);
const OUT = (n) => resolve(ROOT, "videos", "clips", n);

const W = 1920, H = 1080, FPS = 24, DUR = 8, NF = FPS * DUR;

/**
 * pA: point of A we fly toward (fraction of A). pB: where that same thing is in B.
 * sA: zoom reached on A at the hand-off. sB0: zoom B starts from (eases to 1).
 * tCut: hand-off time (s). blur: defocus peak (px) at the cut.
 */
const CLIPS = [
  { id: 1, a: "1-bienvenidos-bogota.png", b: "2-estacion-banderas.png", out: "1-a-2.mp4",
    pA: { x: 0.355, y: 0.61 }, pB: { x: 0.366, y: 0.313 }, sA: 1.46, sB0: 1.12, tCut: 6.5, blur: 7 },
  { id: 2, a: "2-estacion-banderas.png", b: "3-fabrica.png", out: "2-a-3.mp4",
    pA: { x: 0.7, y: 0.52 }, pB: { x: 0.5, y: 0.42 }, sA: 1.6, sB0: 1.14, tCut: 6.4, blur: 9 },
  { id: 3, a: "3-fabrica.png", b: "4-hospital.png", out: "3-a-4.mp4",
    pA: { x: 0.82, y: 0.62 }, pB: { x: 0.42, y: 0.6 }, sA: 1.45, sB0: 1.14, tCut: 6.4, blur: 9 },
  { id: 4, a: "4-hospital.png", b: "5-vida-diaria.png", out: "4-a-5.mp4",
    pA: { x: 0.3, y: 0.78 }, pB: { x: 0.33, y: 0.7 }, sA: 1.5, sB0: 1.12, tCut: 6.4, blur: 8 },
];

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",").map(Number) : null;
const preview = args.includes("--preview") ? args[args.indexOf("--preview") + 1] : null;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutSine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeInQuad = (t) => clamp(t) ** 2;

/** camera window (fractions of the image) for zoom s with point p shown at screen position q */
function windowFor(s, p, q) {
  const w = 1 / s;
  return { l: clamp(p.x - q.x * w, 0, 1 - w), t: clamp(p.y - q.y * w, 0, 1 - w), w };
}
const screenPos = (win, p) => ({ x: (p.x - win.l) / win.w, y: (p.y - win.t) / win.w });

function cameraA(c, t) {
  // slow contemplative push for most of the shot, a gentle acceleration into the hand-off
  const slow = easeInOutSine(t / (c.tCut - 0.6)) * 0.82;
  const fast = easeInQuad((t - (c.tCut - 0.9)) / 0.9) * 0.18;
  const k = clamp(slow + (t > c.tCut - 0.9 ? fast : 0));
  const s = lerp(1, c.sA, k);
  const q = { x: lerp(c.pA.x, c.pB.x, k), y: lerp(c.pA.y, c.pB.y, k) };
  return windowFor(s, c.pA, q);
}
function cameraB(c, t, startScreen) {
  const k = easeOutCubic((t - c.tCut) / (DUR - c.tCut - 0.15));
  const s = lerp(c.sB0, 1, k);
  const q = { x: lerp(startScreen.x, c.pB.x, k), y: lerp(startScreen.y, c.pB.y, k) };
  return windowFor(s, c.pB, q);
}

async function renderClip(c) {
  const A = await loadImage(readFileSync(KF(c.a)));
  const B = await loadImage(readFileSync(KF(c.b)));
  const handoff = screenPos(cameraA(c, c.tCut), c.pA); // where A's target sits at the cut

  const canvas = createCanvas(W, H), ctx = canvas.getContext("2d");
  const acc = createCanvas(W, H), ax = acc.getContext("2d");
  ctx.imageSmoothingQuality = "high"; ax.imageSmoothingQuality = "high";

  const cam = (t) => (t < c.tCut ? { img: A, win: cameraA(c, t) } : { img: B, win: cameraB(c, t, handoff) });
  const draw = (g, img, win, blurPx) => {
    g.filter = blurPx > 0.3 ? `blur(${blurPx.toFixed(1)}px)` : "none";
    g.drawImage(img, win.l * img.width, win.t * img.height, win.w * img.width, win.w * img.height, 0, 0, W, H);
    g.filter = "none";
  };

  function frame(n) {
    const t = n / FPS;
    if (n === 0) { const v = cam(0); draw(ctx, v.img, v.win, 0); return canvas; }
    if (n === NF - 1) { draw(ctx, B, { l: 0, t: 0, w: 1 }, 0); return canvas; } // exact last frame
    const d = Math.abs(t - c.tCut);
    const blurPx = c.blur * Math.max(0, 1 - d / 0.45) ** 1.5;
    // motion blur: average sub-frames when the camera moves fast (near the hand-off)
    const sub = d < 0.5 ? 6 : 1;
    ax.globalAlpha = 1;
    for (let k = 0; k < sub; k++) {
      let ts = t + (k / sub - 0.5) / FPS;
      // never let a sub-frame cross the cut: that would blend A and B (double exposure)
      if (t < c.tCut) ts = Math.min(ts, c.tCut - 1e-3);
      else ts = Math.max(ts, c.tCut);
      const v = cam(ts);
      ax.globalAlpha = 1 / (k + 1);
      draw(ax, v.img, v.win, blurPx);
    }
    ax.globalAlpha = 1;
    ctx.drawImage(acc, 0, 0);
    return canvas;
  }

  if (preview) {
    mkdirSync(preview, { recursive: true });
    const picks = [0, 48, 96, 140, Math.round((c.tCut - 0.25) * FPS), Math.round(c.tCut * FPS), Math.round((c.tCut + 0.3) * FPS), NF - 1];
    const sheet = createCanvas(480 * 4, 270 * 2), sx = sheet.getContext("2d");
    picks.forEach((n, i) => sx.drawImage(frame(n), (i % 4) * 480, Math.floor(i / 4) * 270, 480, 270));
    writeFileSync(resolve(preview, `clip${c.id}.jpg`), sheet.toBuffer("image/jpeg", 85));
    return;
  }

  mkdirSync(dirname(OUT(c.out)), { recursive: true });
  const ff = spawn(ffmpeg, ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "-",
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT(c.out)],
    { stdio: ["pipe", "ignore", "inherit"] });
  for (let n = 0; n < NF; n++) {
    const buf = Buffer.from(frame(n).getContext("2d").getImageData(0, 0, W, H).data.buffer);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log("clip", c.id, "->", OUT(c.out));
}

for (const c of CLIPS) if (!only || only.includes(c.id)) await renderClip(c);
