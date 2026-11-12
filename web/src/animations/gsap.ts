"use client";

/**
 * GSAP setup: register plugins once, on the client only.
 * Import { gsap, ScrollTrigger } from here, never from "gsap" directly,
 * so registration is guaranteed before any ScrollTrigger is created.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: "none" });
  // Mobile URL-bar show/hide fires resize; don't refresh pins for it.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };
