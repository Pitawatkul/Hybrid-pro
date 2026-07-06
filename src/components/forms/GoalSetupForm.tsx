"use client";

import { useActionState } from "react";
import { createGoal, type CreateGoalState } from "@/app/(app)/goal/actions";

const GOAL_TYPES = [
  { value: "marathon", label: "Marathon" },
  { value: "half_marathon", label: "Half Marathon" },
  { value: "strength_total", label: "Strength Total (Squat/Bench/Deadlift)" },
  { value: "custom", label: "Custom" },
] as const;

export function GoalSetupForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState<CreateGoalState, FormData>(
    createGoal,
    undefined
  );

  return (
    <form action={formAction} className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="goal_type" className="text-sm font-medium">
          Goal type
        </label>
        <select
          id="goal_type"
          name="goal_type"
          required
          defaultValue=""
          className="h-11 rounded-lg border border-black/10 px-3 text-base"
        >
          <option value="" disabled>
            Select…
          </option>
          {GOAL_TYPES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="goal_description" className="text-sm font-medium">
          Describe your goal
        </label>
        <input
          id="goal_description"
          name="goal_description"
          type="text"
          placeholder="e.g. Sub-4:00 marathon + 315kg SBD total"
          required
          className="h-11 rounded-lg border border-black/10 px-4 text-base"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="start_date" className="text-sm font-medium">
            Start date
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={today}
            required
            className="h-11 rounded-lg border border-black/10 px-3 text-base"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="target_date" className="text-sm font-medium">
            Target date
          </label>
          <input
            id="target_date"
            name="target_date"
            type="date"
            required
            className="h-11 rounded-lg border border-black/10 px-3 text-base"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="starting_weekly_mileage_km" className="text-sm font-medium">
          Current weekly mileage (km)
        </label>
        <input
          id="starting_weekly_mileage_km"
          name="starting_weekly_mileage_km"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          className="h-11 rounded-lg border border-black/10 px-4 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Current estimated maxes (kg, optional)</span>
        <div className="grid grid-cols-3 gap-2">
          <input
            name="squat_kg"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder="Squat"
            className="h-11 rounded-lg border border-black/10 px-3 text-base"
          />
          <input
            name="bench_kg"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder="Bench"
            className="h-11 rounded-lg border border-black/10 px-3 text-base"
          />
          <input
            name="deadlift_kg"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder="Deadlift"
            className="h-11 rounded-lg border border-black/10 px-3 text-base"
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Your timeline will be split into Base (40%) → Build (30%) → Peak (20%) → Taper (10%) phases
        automatically based on the dates above.
      </p>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-foreground text-background font-medium disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save goal"}
      </button>
    </form>
  );
}
