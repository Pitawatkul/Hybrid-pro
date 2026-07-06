import Link from "next/link";

export default function LogIndexPage() {
  return (
    <div className="p-4 flex flex-col gap-3">
      <h1 className="text-xl font-semibold mb-1">Log a workout</h1>

      <Link
        href="/log/run"
        className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-4 min-h-11"
      >
        <span className="font-medium">Run</span>
        <span className="text-zinc-400">›</span>
      </Link>

      <Link
        href="/log/lift"
        className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-4 min-h-11"
      >
        <span className="font-medium">Lift</span>
        <span className="text-zinc-400">›</span>
      </Link>
    </div>
  );
}
