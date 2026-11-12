"use client";

import { motion } from "motion/react";
import { Leaf } from "@phosphor-icons/react";
import { brand, navItems } from "@/assets/content";
import { useExperience } from "@/components/experience/ExperienceProvider";
import { useActiveScene } from "@/hooks/useActiveScene";
import { baseEase, revealTimeline } from "@/animations/motion";

export function Header() {
  const { phase, scrollToId } = useExperience();
  const active = useActiveScene();
  const shown = phase !== "loading"; // arrives over the hero film
  const ready = phase === "ready"; // navigation only works once scroll is unlocked

  return (
    <motion.header
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
      transition={{ duration: 1, ease: baseEase, delay: shown ? revealTimeline.header : 0 }}
      className="fixed inset-x-0 top-0 z-[var(--z-header)] px-4 pt-4 md:px-8 md:pt-5"
      style={{ pointerEvents: ready ? "auto" : "none" }}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-6">
        <button onClick={() => scrollToId("anchor-identity")} className="flex items-center gap-3" aria-label="Bogotá, back to the start">
          <span className="grid size-9 place-items-center rounded-xl bg-leaf-500 text-ink-950">
            <Leaf size={18} weight="fill" />
          </span>
          <span className="text-base font-semibold tracking-[0.18em] text-fog-50">{brand.name}</span>
          <span className="hidden rounded-md border border-white/15 px-2 py-0.5 text-xs font-medium text-fog-400 sm:inline">
            {brand.tag}
          </span>
        </button>

        <nav aria-label="City systems" className="glass hidden items-center gap-1 rounded-full p-1 lg:flex">
          {navItems.map((item) => {
            const on = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToId(`anchor-${item.id}`, { duration: 3 })}
                aria-current={on ? "true" : undefined}
                className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-300 ${on ? "text-ink-950" : "text-fog-200 hover:text-fog-50"}`}
              >
                {on && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-fog-50"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
