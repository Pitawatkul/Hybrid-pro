"use client";

import { useActionState, useState } from "react";
import { saveEditedPlan, type SaveEditedPlanState } from "@/app/(app)/dashboard/edit/actions";
import type { PlannedExercise, PlannedSession, PlannedSessionStatus } from "@/lib/db/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type EditableSession = {
  id: string;
  session_date: string;
  session_type: "run" | "lift";
  day_label: string | null;
  status: PlannedSessionStatus;
  planned_distance_km: number | null;
  planned_duration_min: number | null;
  planned_exercises: PlannedExercise[] | null;
};

function toEditable(sessions: PlannedSession[]): EditableSession[] {
  return sessions
    .slice()
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .map((s) => ({
      id: s.id,
      session_date: s.session_date,
      session_type: s.session_type,
      day_label: s.day_label,
      status: s.status,
      planned_distance_km: s.planned_distance_km,
      planned_duration_min: s.planned_duration_min,
      planned_exercises: s.planned_exercises,
    }));
}

export function EditPlanForm({
  weeklyPlanId,
  initialSessions,
  exerciseNamesById,
}: {
  weeklyPlanId: string;
  initialSessions: PlannedSession[];
  exerciseNamesById: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState<SaveEditedPlanState, FormData>(
    saveEditedPlan,
    undefined
  );
  const [sessions, setSessions] = useState<EditableSession[]>(() => toEditable(initialSessions));

  function updateSession(index: number, patch: Partial<EditableSession>) {
    setSessions((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function updateExercise(sessionIndex: number, exerciseIndex: number, patch: Partial<PlannedExercise>) {
    setSessions((prev) =>
      prev.map((s, i) =>
        i === sessionIndex
          ? {
              ...s,
              planned_exercises:
                s.planned_exercises?.map((ex, j) => (j === exerciseIndex ? { ...ex, ...patch } : ex)) ?? null,
            }
          : s
      )
    );
  }

  return (
    <form action={formAction} className="p-4 flex flex-col gap-4">
      <input type="hidden" name="weekly_plan_id" value={weeklyPlanId} />
      <input type="hidden" name="sessions" value={JSON.stringify(sessions)} />

      {sessions.map((session, sessionIndex) => (
        <div key={session.id} className="rounded-xl border border-black/10 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{DAY_NAMES[new Date(session.session_date).getUTCDay()]}</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={session.status === "skipped"}
                onChange={(e) => updateSession(sessionIndex, { status: e.target.checked ? "skipped" : "planned" })}
                className="h-5 w-5"
              />
              Skip this session
            </label>
          </div>

          <input
            type="text"
            value={session.day_label ?? ""}
            onChange={(e) => updateSession(sessionIndex, { day_label: e.target.value })}
            className="h-11 rounded-lg border border-black/10 px-3 text-base font-medium"
          />

          {session.session_type === "run" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Distance (km)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={session.planned_distance_km ?? ""}
                  onChange={(e) => updateSession(sessionIndex, { planned_distance_km: Number(e.target.value) })}
                  className="h-11 rounded-lg border border-black/10 px-3 text-base"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Duration (min)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  value={session.planned_duration_min ?? ""}
                  onChange={(e) => updateSession(sessionIndex, { planned_duration_min: Number(e.target.value) })}
                  className="h-11 rounded-lg border border-black/10 px-3 text-base"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {session.planned_exercises?.map((ex, exIndex) => (
                <div key={ex.exercise_id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <span className="text-sm">{exerciseNamesById[ex.exercise_id] ?? ex.exercise_id}</span>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExercise(sessionIndex, exIndex, { sets: Number(e.target.value) })}
                    className="h-9 w-14 rounded-lg border border-black/10 px-2 text-sm"
                    aria-label="Sets"
                  />
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) => updateExercise(sessionIndex, exIndex, { reps: Number(e.target.value) })}
                    className="h-9 w-14 rounded-lg border border-black/10 px-2 text-sm"
                    aria-label="Reps"
                  />
                  <input
                    type="number"
                    step="0.5"
                    value={ex.target_weight_kg ?? ""}
                    onChange={(e) =>
                      updateExercise(sessionIndex, exIndex, { target_weight_kg: Number(e.target.value) })
                    }
                    className="h-9 w-16 rounded-lg border border-black/10 px-2 text-sm"
                    aria-label="Weight (kg)"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-foreground text-background font-medium disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
