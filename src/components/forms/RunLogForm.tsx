"use client";

import { useActionState, useState } from "react";
import { logRun, type LogRunState } from "@/app/(app)/log/run/actions";

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RunLogForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState<LogRunState, FormData>(logRun, undefined);
  const [rpe, setRpe] = useState<number | null>(null);

  return (
    <form action={formAction} className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="session_date" className="text-sm font-medium">
          Date
        </label>
        <input
          id="session_date"
          name="session_date"
          type="date"
          defaultValue={today}
          required
          className="h-11 rounded-lg border border-black/10 px-4 text-base"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="distance_km" className="text-sm font-medium">
          Distance (km)
        </label>
        <input
          id="distance_km"
          name="distance_km"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          className="h-11 rounded-lg border border-black/10 px-4 text-base"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="duration_min" className="text-sm font-medium">
          Duration (minutes)
        </label>
        <input
          id="duration_min"
          name="duration_min"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          required
          className="h-11 rounded-lg border border-black/10 px-4 text-base"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Effort (RPE)</span>
        <input type="hidden" name="rpe" value={rpe ?? ""} />
        <div className="grid grid-cols-5 gap-2">
          {RPE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRpe(value)}
              className={`h-11 rounded-lg border text-base font-medium ${
                rpe === value
                  ? "bg-foreground text-background border-foreground"
                  : "border-black/10"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="rounded-lg border border-black/10 px-4 py-2 text-base"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-foreground text-background font-medium disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save run"}
      </button>
    </form>
  );
}
