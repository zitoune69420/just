/**
 * Halos flous décoratifs (bleu foncé / violet) derrière tout le contenu.
 * `-z-10` les place entre le fond du body et le contenu.
 */
export function BackgroundGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-32 -left-24 size-[480px] rounded-full bg-indigo-500/10 blur-[140px] dark:bg-indigo-600/25" />
      <div className="absolute top-1/4 -right-32 size-[520px] rounded-full bg-violet-500/10 blur-[150px] dark:bg-violet-700/25" />
      <div className="absolute -bottom-48 left-1/4 size-[560px] rounded-full bg-purple-500/8 blur-[160px] dark:bg-purple-800/20" />
    </div>
  );
}
