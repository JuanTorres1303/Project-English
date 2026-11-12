"use client";

import { motion } from "motion/react";
import { navItems } from "@/assets/content";
import { useExperience } from "@/components/experience/ExperienceProvider";
import { useActiveScene } from "@/hooks/useActiveScene";
import { baseEase, easeOutExpo, revealTimeline } from "@/animations/motion";

/** Vertical journey indicator (right edge), mirrors the nav; doubles as quick navigation. */
export function ProgressRail() {
  const { phase, scrollToId } = useExperience();
  const active = useActiveScene();
  const index = Math.max(0, navItems.findIndex((n) => n.id === active));
  const shown = phase !== "loading";
  const ready = phase === "ready";

  return (
    <motion.aside
      aria-label="Journey progress"
      initial={false}
      animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
      transition={{ duration: 1, ease: baseEase, delay: shown ? revealTimeline.rail : 0 }}
      className="fixed right-4 top-1/2 z-[var(--z-ui)] hidden -translate-y-1/2 md:block xl:right-8"
      style={{ pointerEvents: ready ? "auto" : "none" }}
    >
      <div className="glass relative flex flex-col gap-5 rounded-full px-2.5 py-5">
        <span aria-hidden className="absolute bottom-7 left-1/2 top-7 w-px -translate-x-1/2 bg-white/10" />
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-7 w-px -translate-x-1/2 origin-top bg-leaf-400"
          style={{ height: "calc(100% - 3.5rem)" }}
          animate={{ scaleY: index / (navItems.length - 1) }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
        />
        {navItems.map((item, i) => {
          const on = i === index;
          return (
            <button
              key={item.id}
              onClick={() => scrollToId(`anchor-${item.id}`, { duration: 3 })}
              aria-label={item.label}
              aria-current={on ? "step" : undefined}
              className="group relative grid size-7 place-items-center"
            >
              <span
                className={`grid size-7 place-items-center rounded-full font-mono text-xs transition-all duration-500 ${
                  on ? "bg-leaf-500 text-ink-950" : i < index ? "bg-ink-850 text-leaf-300" : "bg-ink-850 text-fog-400"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="glass pointer-events-none absolute right-10 whitespace-nowrap rounded-full px-3 py-1 text-xs text-fog-50 opacity-0 transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.aside>
  );
}
