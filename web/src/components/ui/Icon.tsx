"use client";

import { Bicycle, Bus, ChargingStation, Factory, FirstAidKit, ShieldCheck, Train } from "@phosphor-icons/react";

/** One icon family (Phosphor), one stroke weight across the site. */
const map = {
  train: Train,
  bus: Bus,
  bicycle: Bicycle,
  charging: ChargingStation,
  factory: Factory,
  hospital: FirstAidKit,
  shield: ShieldCheck,
} as const;

export type IconName = keyof typeof map;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  const C = map[name];
  return <C size={size} weight="regular" className={className} aria-hidden />;
}
