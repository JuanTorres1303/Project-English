import type { FeatureCard as Card } from "@/assets/content";
import { Icon } from "./Icon";

/** Floating info card used in the transport scene (animated by the scene's GSAP timeline). */
export function FeatureCard({ card, compact = false }: { card: Card; compact?: boolean }) {
  return (
    <div className={`glass-strong rounded-2xl ${compact ? "w-56 shrink-0 snap-start p-4" : "w-60 p-4"}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-leaf-500/15 text-leaf-300">
          <Icon name={card.icon} size={18} />
        </span>
        <h3 className="text-base font-semibold text-fog-50">{card.title}</h3>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-fog-200">
        {card.points.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <span aria-hidden className="mt-[7px] h-px w-3 shrink-0 bg-leaf-400" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
