"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store for "which scene is on screen".
 * Written by ScrollTriggers (outside React), read by the nav + progress rail.
 * useSyncExternalStore re-renders only subscribers, never the scroll scenes.
 */
let current = "identity";
const listeners = new Set<() => void>();

export function setActiveScene(id: string) {
  if (id === current) return;
  current = id;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useActiveScene() {
  return useSyncExternalStore(subscribe, () => current, () => "identity");
}
