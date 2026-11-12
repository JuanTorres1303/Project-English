"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useLenis } from "@/hooks/useLenis";
import { ScrollTrigger } from "@/animations/gsap";

/**
 * Experience phases:
 *   loading -> intro (film) -> ready (city online, scroll unlocked)
 * "Watch Presentation" sends the user back to `intro`.
 */
export type Phase = "loading" | "intro" | "ready";

type Ctx = {
  phase: Phase;
  setPhase: (p: Phase) => void;
  filmProgress: number;
  setFilmProgress: (p: number) => void;
  reduceMotion: boolean;
  scrollToId: (id: string, opts?: { duration?: number }) => void;
};

const ExperienceContext = createContext<Ctx | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = !!useReducedMotion();
  const [phase, setPhase] = useState<Phase>("loading");
  const [filmProgress, setFilmProgress] = useState(0);
  const lenis = useLenis(!reduceMotion);

  // Lock scroll until the city is "online".
  useEffect(() => {
    const locked = phase !== "ready";
    document.documentElement.dataset.locked = String(locked);
    if (locked) {
      lenis.current?.stop();
      window.scrollTo(0, 0);
    } else {
      lenis.current?.start();
      // Re-measure triggers once the entrance choreography has finished, never during it:
      // a refresh forces layout and would drop frames in the middle of the reveal.
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 2600);
      return () => window.clearTimeout(t);
    }
  }, [phase, lenis]);

  const scrollToId = useCallback(
    (id: string, opts?: { duration?: number }) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenis.current) {
        lenis.current.scrollTo(el, { duration: opts?.duration ?? 2.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
      } else {
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }
    },
    [lenis, reduceMotion],
  );

  const value = useMemo(
    () => ({ phase, setPhase, filmProgress, setFilmProgress, reduceMotion, scrollToId }),
    [phase, filmProgress, reduceMotion, scrollToId],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside <ExperienceProvider>");
  return ctx;
}
