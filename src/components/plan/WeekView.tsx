import type { LoggedSession, PlannedSession } from "@/lib/db/types";
import { SessionCard } from "./SessionCard";

export function WeekView({
  sessions,
  loggedSessions,
}: {
  sessions: PlannedSession[];
  loggedSessions: LoggedSession[];
}) {
  const sorted = [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date));

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((session) => {
        const completed = loggedSessions.some(
          (l) => l.planned_session_id === session.id || (l.session_date === session.session_date && l.session_type === session.session_type)
        );
        return <SessionCard key={session.id} session={session} completed={completed} />;
      })}
    </div>
  );
}
