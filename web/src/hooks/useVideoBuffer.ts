"use client";

import { useEffect, type RefObject } from "react";

/**
 * Reports how much of a video is buffered (0..1). Polls as well as listening,
 * because a cached file can fire its events before React attaches the listener.
 * A failsafe never lets a slow network trap the user on the loader.
 */
export function useVideoBuffer(ref: RefObject<HTMLVideoElement | null>, report: (p: number) => void, failsafeMs = 9000) {
  useEffect(() => {
    const v = ref.current;
    if (!v) {
      report(1);
      return;
    }
    let done = false;
    const check = () => {
      if (done) return;
      const buffered = v.duration && v.buffered.length ? v.buffered.end(v.buffered.length - 1) / v.duration : 0;
      if (v.readyState >= 4 || buffered > 0.98) {
        done = true;
        report(1);
      } else report(Math.min(1, buffered));
    };
    const events = ["progress", "loadeddata", "canplay", "canplaythrough"] as const;
    events.forEach((e) => v.addEventListener(e, check));
    const poll = window.setInterval(check, 200);
    const failsafe = window.setTimeout(() => report(1), failsafeMs);
    check();
    return () => {
      events.forEach((e) => v.removeEventListener(e, check));
      window.clearInterval(poll);
      window.clearTimeout(failsafe);
    };
  }, [ref, report, failsafeMs]);
}
