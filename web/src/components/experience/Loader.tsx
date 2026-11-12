"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useExperience } from "./ExperienceProvider";
import { useImagePreload } from "@/hooks/useImagePreload";
import { stills } from "@/assets/media";
import { easeOutExpo } from "@/animations/motion";

const MIN_LOADER_MS = 1400; // never flash the loader
const HOLD_AFTER_LOAD_MS = 1000; // "after 1 second" the film starts

/**
 * Boot screen: wordmark, status line and a hairline progress bar.
 * Progress = real readiness of the two key images + the intro film buffer.
 */
export function Loader() {
  const { phase, setPhase, filmProgress, reduceMotion } = useExperience();
  const images = useImagePreload([stills.welcome.src, stills.station.src]);
  // Reduced motion skips the film, so only the images gate the loader.
  const progress = reduceMotion ? images : images * 0.4 + filmProgress * 0.6;

  const target = useMotionValue(0);
  const scaleX = useSpring(target, { stiffness: 60, damping: 18 });
  const started = useRef(performance.now());

  useEffect(() => {
    target.set(progress);
    if (phase !== "loading" || progress < 0.999) return;
    const wait = Math.max(0, MIN_LOADER_MS - (performance.now() - started.current)) + HOLD_AFTER_LOAD_MS;
    const t = window.setTimeout(() => setPhase(reduceMotion ? "ready" : "intro"), wait);
    return () => window.clearTimeout(t);
  }, [progress, phase, setPhase, target, reduceMotion]);

  return (
    <AnimatePresence>
      {phase === "loading" && (
        <motion.div
          key="loader"
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[var(--z-loader)] grid place-items-center bg-ink-950"
          exit={{ opacity: 0, transition: { duration: 0.8, ease: easeOutExpo } }}
        >
          <div className="flex w-[min(78vw,340px)] flex-col items-center">
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.32em" }}
              transition={{ duration: 1.6, ease: easeOutExpo }}
              className="pl-[0.32em] text-2xl font-semibold text-fog-50 md:text-3xl"
            >
              BOGOTÁ
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="mt-5 text-xs text-fog-400"
            >
              Loading Smart City Systems...
            </motion.p>
            <div className="mt-6 h-px w-full overflow-hidden bg-white/10">
              <motion.div style={{ scaleX }} className="h-full origin-left bg-leaf-500" />
            </div>
            <span className="sr-only">{Math.round(progress * 100)}% loaded</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
