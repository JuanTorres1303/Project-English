"use client";

import dynamic from "next/dynamic";
import { ExperienceProvider } from "./ExperienceProvider";
import { Loader } from "./Loader";
import { Header } from "@/components/layout/Header";
import { ProgressRail } from "@/components/layout/ProgressRail";
import { ScrollWorld } from "@/sections/ScrollWorld";

// Below-the-fold sections ship in their own chunks; they load while the hero film plays.
const Tagline = dynamic(() => import("@/sections/Tagline"));
const Finale = dynamic(() => import("@/sections/Finale"));

export function Experience() {
  return (
    <ExperienceProvider>
      <a
        href="#journey"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-fog-50 px-4 py-2 text-sm font-semibold text-ink-950 transition duration-300 focus:translate-y-0"
      >
        Skip to content
      </a>
      <Loader />
      <Header />
      <ProgressRail />
      <main className="grain">
        <ScrollWorld />
        <Tagline />
        <Finale />
      </main>
    </ExperienceProvider>
  );
}
