// Snap arbitrary Tailwind font sizes to the nearest scale step BELOW
// (landing-page-design skill, B1): text-[13px] -> text-xs, text-[15px] -> text-sm, ...
// Usage: node tools/snap-type.mjs web/src
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const steps = [
  [12, "text-xs"], [14, "text-sm"], [16, "text-base"], [18, "text-lg"], [20, "text-xl"],
  [24, "text-2xl"], [30, "text-3xl"], [36, "text-4xl"], [48, "text-5xl"], [60, "text-6xl"],
  [72, "text-7xl"], [96, "text-8xl"], [128, "text-9xl"],
];
const snap = (px) => {
  let pick = steps[0][1];
  for (const [size, cls] of steps) if (size <= px) pick = cls;
  return pick;
};

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : /\.(tsx|ts)$/.test(n) ? [p] : [];
});

let total = 0;
for (const file of walk(process.argv[2])) {
  const src = readFileSync(file, "utf8");
  const out = src.replace(/\btext-\[(\d+(?:\.\d+)?)px\]/g, (_, px) => { total++; return snap(Number(px)); });
  if (out !== src) { writeFileSync(file, out); console.log("snapped", file); }
}
console.log("replacements:", total);
