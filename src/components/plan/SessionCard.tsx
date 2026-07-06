import Link from "next/link";
import type { PlannedSession } from "@/lib/db/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SessionCard({ session, completed }: { session: PlannedSession; completed: boolean }) {
  const dayName = DAY_NAMES[new Date(session.session_date).getUTCDay()];
  const href = session.session_type === "run" ? "/log/run" : "/log/lift";

  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        completed ? "border-black/5 bg-zinc-50" : "border-black/10"
      }`}
    >
      <div>
        <p className="text-xs text-zinc-500">{dayName}</p>
        <p className="font-medium">{session.day_label ?? (session.session_type === "run" ? "Run" : "Lift")}</p>
        {session.session_type === "run" ? (
          <p className="text-sm text-zinc-500">
            {session.planned_distance_km}km · {session.planned_duration_min}min
          </p>
        ) : (
          <p className="text-sm text-zinc-500">{session.planned_exercises?.length ?? 0} exercises</p>
        )}
        {session.is_injury_modified && (
          <p className="text-xs text-amber-600 mt-1">Modified — {session.modification_note}</p>
        )}
      </div>
      {completed && <span className="text-xs font-medium text-emerald-600">Done</span>}
    </Link>
  );
}
