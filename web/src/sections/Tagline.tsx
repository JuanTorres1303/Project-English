"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/animations/gsap";
import { tagline } from "@/assets/content";
import { useExperience } from "@/components/experience/ExperienceProvider";
import { GrammarChip } from "@/components/ui/GrammarChip";

/**
 * Large statement (landing-page-design B11). Words start muted and light up one
 * at a time, in reading order, as they cross the reading line. Scrubbed by
 * ScrollTrigger, so scrolling back dims them again. Reduced motion: full colour.
 */
export default function Tagline() {
  const { reduceMotion } = useExperience();
  const root = useRef<HTMLElement>(null);
  const words = tagline.text.split(" ");

  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.fromTo(
        ".js-word",
        { opacity: 0.28 },
        {
          opacity: 1,
          ease: "power2.out",
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 55%", scrub: 0.6 },
        },
      );
    },
    { scope: root, dependencies: [reduceMotion] },
  );

  return (
    <section ref={root} aria-label="Our promise" className="relative z-10 bg-ink-950 px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <p className="max-w-[880px] text-4xl font-semibold leading-tight text-fog-50 [text-wrap:balance] md:text-6xl md:leading-none">
          {words.map((w, i) => (
            <span key={i} className="js-word">
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </p>
        <div className="mt-8">
          <GrammarChip>{tagline.grammar}</GrammarChip>
        </div>
      </div>
    </section>
  );
}
