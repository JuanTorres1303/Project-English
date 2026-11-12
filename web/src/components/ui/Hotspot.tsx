"use client";

import { motion } from "motion/react";
import type { Point } from "@/assets/media";
import { Icon, type IconName } from "./Icon";

type Props = { label: string; detail: string; at: Point; icon: IconName; delay?: number };

/** A map marker pinned to a point of the photo: ring + glass label. */
export function Hotspot({ label, detail, at, icon, delay = 0 }: Props) {
  return (
    <motion.div
      className="absolute hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 md:flex"
      style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%` }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="relative grid size-10 place-items-center rounded-full bg-ink-950/70 text-leaf-300 ring-1 ring-leaf-400/60 backdrop-blur-md">
        <span className="absolute inset-0 rounded-full ring-1 ring-leaf-400/50 motion-safe:animate-[ping_3s_ease-out_infinite]" />
        <Icon name={icon} size={16} />
      </span>
      <span className="glass-strong rounded-xl px-3 py-1.5 text-left leading-tight">
        <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-fog-50">{label}</span>
        <span className="block text-xs text-fog-400">{detail}</span>
      </span>
    </motion.div>
  );
}
