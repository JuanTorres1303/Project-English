"use client";

import { useEffect, useState } from "react";

/** Preloads + decodes images; returns the fraction ready (0..1). Errors count as done. */
export function useImagePreload(srcs: string[]) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    let alive = true;
    srcs.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      const finish = () => alive && setDone((d) => d + 1);
      img.decode().then(finish, finish);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcs.join("|")]);

  return srcs.length ? Math.min(1, done / srcs.length) : 1;
}
