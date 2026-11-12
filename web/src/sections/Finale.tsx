"use client";

import { motion } from "motion/react";
import { ArrowUp } from "@phosphor-icons/react";
import { brand, finale } from "@/assets/content";
import { useExperience } from "@/components/experience/ExperienceProvider";
import { revealGroup, revealUp } from "@/animations/motion";

/** Closing statement. Message-led, so a centred manifesto layout is intentional here. */
export default function Finale() {
  const { scrollToId } = useExperience();
  return (
    <section aria-label="Conclusion" className="relative z-10 grid min-h-[100dvh] place-items-center bg-ink-950 px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgb(16_185_129/0.10),transparent_70%)]" />
      <motion.div
        variants={revealGroup}
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.4 }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <motion.h2 variants={revealUp} className="text-4xl font-semibold leading-[1.05] tracking-tight text-fog-50 md:text-6xl">
          {finale.title}
        </motion.h2>
        <motion.p variants={revealUp} className="mx-auto mt-6 max-w-[48ch] text-base leading-relaxed text-fog-200 md:text-lg">
          {finale.body}
        </motion.p>
        <motion.div variants={revealUp} className="mt-10 flex justify-center">
          <button
            onClick={() => scrollToId("anchor-identity", { duration: 3.2 })}
            className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-fog-50 transition hover:bg-white/10 active:scale-[0.98]"
          >
            <ArrowUp size={16} /> {finale.cta}
          </button>
        </motion.div>
      </motion.div>
      <footer className="absolute inset-x-0 bottom-6 text-center text-xs text-fog-400">
        {brand.name}, {brand.tag}
      </footer>
    </section>
  );
}
