/**
 * Framer Motion (package "motion") presets shared by UI components.
 * GSAP owns scroll-scrubbed scenes; Motion owns UI entrances. They never
 * animate the same element.
 *
 * One curve for everything: weighted, decelerating into place
 * (landing-page-design skill, B7). No browser default easings.
 */
import type { Transition, Variants } from "motion/react";

export const baseEase: [number, number, number, number] = [0.22, 1, 0.36, 1];
/** kept for older imports */
export const easeOutExpo = baseEase;

export const spring: Transition = { type: "spring", stiffness: 110, damping: 20 };

/**
 * "The city reveals its information" WHILE it is being built: seconds after the
 * hero film starts playing. Header, rail and copy read these, so the whole
 * entrance is one choreography over the film instead of a pop at the end.
 * Map markers are tied to the finished city, so they wait for the film to end.
 */
export const revealTimeline = {
  scrim: 0.3,
  kicker: 1.1,
  title: 1.3,
  body: 1.9,
  ctas: 2.3,
  header: 2.7,
  rail: 3.1,
  hotspots: 0.2, // after the film ends
} as const;

/** Line mask reveal: the text rises from behind an invisible edge. */
export const lineRise: Variants = {
  hidden: { y: "105%" },
  shown: (delay: number = 0) => ({ y: "0%", transition: { duration: 1.1, ease: baseEase, delay } }),
};

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, ease: baseEase, delay } }),
};

export const revealGroup: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

export const revealFade: Variants = {
  hidden: { opacity: 0 },
  shown: (delay: number = 0) => ({ opacity: 1, transition: { duration: 1.2, ease: baseEase, delay } }),
};
