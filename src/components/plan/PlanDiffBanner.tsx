export function PlanDiffBanner({ rationale }: { rationale: string[] }) {
  if (rationale.length === 0) return null;

  return (
    <div className="rounded-xl bg-zinc-50 border border-black/10 p-3">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
        Why this week changed
      </p>
      <ul className="flex flex-col gap-1">
        {rationale.map((line, i) => (
          <li key={i} className="text-sm text-zinc-700">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
