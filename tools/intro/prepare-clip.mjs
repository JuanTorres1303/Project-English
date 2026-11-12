// Prepare a generated clip for the scroll-driven site.
//   node prepare-clip.mjs <in.mp4> <out.mp4> [--reverse] [--wm x,y,w,h]
// - optional watermark removal (dewatermark-clip.mjs, box in SOURCE pixels)
// - optional reverse (for the "build the city backwards" intro trick)
// - 1920x1080 lanczos, no audio, H.264 crf 20, GOP 6 (smooth scrubbing), faststart
// - writes <out>-first.webp and <out>-last.webp to check the seams against the keyframes
import ffmpeg from "ffmpeg-static";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const [inp, out] = args;
if (!inp || !out) throw new Error("usage: prepare-clip.mjs in.mp4 out.mp4 [--reverse] [--wm x,y,w,h]");
const reverse = args.includes("--reverse");
const wm = args.includes("--wm") ? args[args.indexOf("--wm") + 1].split(",") : null;
const here = dirname(fileURLToPath(import.meta.url));
const run = (bin, a) => {
  const r = spawnSync(bin, a, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

let src = resolve(inp);
if (wm) {
  const clean = join(tmpdir(), `clean-${Date.now()}.mp4`);
  run(process.execPath, [join(here, "dewatermark-clip.mjs"), src, clean, ...wm]);
  src = clean;
}
const vf = [reverse ? "reverse" : null, "scale=1920:1080:flags=lanczos:force_original_aspect_ratio=increase", "crop=1920:1080", "unsharp=5:5:0.4:5:5:0.0"]
  .filter(Boolean)
  .join(",");
run(ffmpeg, ["-v", "error", "-y", "-i", src, "-an", "-vf", vf, "-r", "24", "-c:v", "libx264", "-preset", "slow", "-crf", "20",
  "-g", "6", "-keyint_min", "6", "-sc_threshold", "0", "-pix_fmt", "yuv420p", "-movflags", "+faststart", resolve(out)]);
const base = resolve(out).replace(/\.mp4$/i, "");
run(ffmpeg, ["-v", "error", "-y", "-i", resolve(out), "-frames:v", "1", "-c:v", "libwebp", "-quality", "90", `${base}-first.webp`]);
run(ffmpeg, ["-v", "error", "-y", "-sseof", "-0.05", "-i", resolve(out), "-frames:v", "1", "-c:v", "libwebp", "-quality", "90", `${base}-last.webp`]);
console.log("ready:", resolve(out));
