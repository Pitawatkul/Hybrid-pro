import type { Exercise, Injury, InjurySeverity } from "@/lib/db/types";
import type { NewPlannedSession } from "./types";

const SEVERITY_RANK: Record<InjurySeverity, number> = { mild: 1, moderate: 2, severe: 3 };

function matchingInjuries(exercise: Exercise, injuries: Injury[]): Injury[] {
  return injuries.filter(
    (injury) =>
      exercise.affected_by_body_parts.includes(injury.body_part) ||
      injury.affected_movement_patterns.includes(exercise.movement_pattern)
  );
}

function strictestSeverity(injuries: Injury[]): InjurySeverity {
  return injuries.reduce<InjurySeverity>(
    (worst, injury) => (SEVERITY_RANK[injury.severity] > SEVERITY_RANK[worst] ? injury.severity : worst),
    "mild"
  );
}

export function applyInjuryModifications(
  sessions: NewPlannedSession[],
  activeInjuries: Injury[],
  exerciseCatalog: Exercise[]
): { sessions: NewPlannedSession[]; rationale: string[] } {
  const rationale: string[] = [];

  if (activeInjuries.length === 0) {
    return { sessions, rationale };
  }

  const runningInjuries = activeInjuries.filter((i) => i.affects_running);
  const maxRunReduction = runningInjuries.reduce(
    (max, i) => Math.max(max, i.running_volume_reduction_pct),
    0
  );

  const modified = sessions.map((session): NewPlannedSession => {
    if (session.session_type === "run") {
      if (maxRunReduction === 0) return session;

      const factor = 1 - maxRunReduction / 100;
      rationale.push(
        `${session.day_label ?? "Run"}: reduced ${maxRunReduction}% due to active injury (${runningInjuries
          .map((i) => i.body_part)
          .join(", ")}).`
      );

      return {
        ...session,
        planned_distance_km: session.planned_distance_km != null ? Math.round(session.planned_distance_km * factor * 10) / 10 : null,
        planned_duration_min: session.planned_duration_min != null ? Math.round(session.planned_duration_min * factor * 10) / 10 : null,
        is_injury_modified: true,
        modification_note: `Reduced ${maxRunReduction}% — active injury: ${runningInjuries.map((i) => i.body_part).join(", ")}.`,
      };
    }

    if (session.session_type === "lift" && session.planned_exercises) {
      let sessionModified = false;
      const notes: string[] = [];

      const nextExercises = session.planned_exercises.flatMap((planned) => {
        const exercise = exerciseCatalog.find((e) => e.id === planned.exercise_id);
        if (!exercise) return [planned];

        const matches = matchingInjuries(exercise, activeInjuries);
        if (matches.length === 0) return [planned];

        const severity = strictestSeverity(matches);
        sessionModified = true;

        if (severity === "mild") {
          const reducedWeight = planned.target_weight_kg != null ? Math.round(planned.target_weight_kg * 0.75 * 2) / 2 : null;
          notes.push(`${exercise.name}: load reduced 25% — active mild injury.`);
          rationale.push(`${exercise.name}: load reduced 25% — active mild injury (${matches.map((i) => i.body_part).join(", ")}).`);
          return [{ ...planned, target_weight_kg: reducedWeight }];
        }

        if (severity === "moderate") {
          if (exercise.substitute_exercise_id) {
            const substitute = exerciseCatalog.find((e) => e.id === exercise.substitute_exercise_id);
            notes.push(`${exercise.name} → ${substitute?.name ?? "substitute"} — active moderate injury.`);
            rationale.push(`Substituted ${exercise.name} → ${substitute?.name ?? "substitute"} — active moderate injury (${matches.map((i) => i.body_part).join(", ")}).`);
            return [{ ...planned, exercise_id: exercise.substitute_exercise_id }];
          }
          notes.push(`${exercise.name}: removed — no safe substitute found, review manually.`);
          rationale.push(`Removed ${exercise.name} — moderate injury with no safe substitute, review manually.`);
          return [];
        }

        // severe
        notes.push(`${exercise.name}: removed — active severe injury, review manually.`);
        rationale.push(`Removed ${exercise.name} — active severe injury (${matches.map((i) => i.body_part).join(", ")}), review manually.`);
        return [];
      });

      if (!sessionModified) return session;

      return {
        ...session,
        planned_exercises: nextExercises,
        is_injury_modified: true,
        modification_note: notes.join(" "),
      };
    }

    return session;
  });

  return { sessions: modified, rationale };
}
