import type { Injury, Macrocycle, Phase, PlannedSession } from "@/lib/db/types";
import type { WeekSummary } from "./types";
import { formatLabel } from "@/lib/constants/injuries";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describeSession(planned: PlannedSession | undefined, actual: WeekSummary["loggedSessions"][number] | undefined): string {
  const dayName = DAY_NAMES[new Date((planned?.session_date ?? actual?.session_date)!).getUTCDay()];

  if (planned?.session_type === "run" || actual?.session_type === "run") {
    const plannedDesc = planned ? `planned ${planned.planned_distance_km}km` : "unplanned";
    const actualDesc = actual?.actual_distance_km != null ? `completed ${actual.actual_distance_km}km` : "not completed";
    return `- ${dayName}: ${planned?.day_label ?? "Run"} — ${plannedDesc}, ${actualDesc}`;
  }

  const exerciseCount = actual?.logged_exercises?.length ?? planned?.planned_exercises?.length ?? 0;
  const status = actual ? "completed" : "not completed";
  return `- ${dayName}: ${planned?.day_label ?? "Lift session"} (${exerciseCount} exercises) — ${status}`;
}

export function formatSummaryForClaude(params: {
  weekStartDate: string;
  weekSummary: WeekSummary;
  activeInjuries: Injury[];
  currentPhase: Phase | null;
  macrocycle: Macrocycle | null;
}): string {
  const { weekStartDate, weekSummary, activeInjuries, currentPhase, macrocycle } = params;
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const lines: string[] = [];
  lines.push(`Last week (${weekStartDate} – ${weekEnd.toISOString().slice(0, 10)}):`);

  const bySessionDate = new Map<string, PlannedSession>();
  for (const p of weekSummary.plannedSessions) bySessionDate.set(`${p.session_date}-${p.sequence_in_day}`, p);

  if (weekSummary.plannedSessions.length === 0 && weekSummary.loggedSessions.length === 0) {
    lines.push("- No sessions planned or logged.");
  } else {
    for (const planned of weekSummary.plannedSessions) {
      const actual = weekSummary.loggedSessions.find((l) => l.planned_session_id === planned.id);
      lines.push(describeSession(planned, actual));
    }
    for (const actual of weekSummary.loggedSessions.filter((l) => !l.planned_session_id)) {
      lines.push(describeSession(undefined, actual));
    }
  }

  lines.push("");
  lines.push(
    activeInjuries.length > 0
      ? `Active injuries: ${activeInjuries
          .map((i) => `${formatLabel(i.body_part)} (${i.severity}${i.affects_running ? ", affects running" : ""}${i.affected_movement_patterns.length ? `, affects ${i.affected_movement_patterns.join("/")}` : ""})`)
          .join("; ")}`
      : "Active injuries: none"
  );

  if (macrocycle && currentPhase) {
    lines.push(
      `Current phase: ${formatLabel(currentPhase.phase_type)} (target: ${macrocycle.goal_description}, ${macrocycle.target_date})`
    );
  }

  return lines.join("\n");
}
