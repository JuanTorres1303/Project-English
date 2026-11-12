/** Small label that tells the audience which B1 structure the text practises. */
export function GrammarChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-leaf-500/30 bg-leaf-500/10 px-3 py-1 font-mono text-xs text-leaf-300">
      <span className="text-fog-400">B1</span>
      {children}
    </span>
  );
}
