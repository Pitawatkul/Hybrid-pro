"use client";

import { useActionState } from "react";
import { createInjury, type CreateInjuryState } from "@/app/(app)/injuries/actions";
import { BODY_PARTS, MOVEMENT_PATTERNS, formatLabel } from "@/lib/constants/injuries";

const SEVERITIES = ["mild", "moderate", "severe"] as const;

export function InjuryForm({ today }: { today: string }) {
  const [state, formAction, pending] = useActionState<CreateInjuryState, FormData>(
    createInjury,
    undefined
  );

  return (
    <form action={formAction} className="p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="body_part" className="text-sm font-medium">
          Body part
        </label>
        <select
          id="body_part"
          name="body_part"
          required
          defaultValue=""
          className="h-11 rounded-lg border border-black/10 px-3 text-base"
        >
          <option value="" disabled>
            Select…
          </option>
          {BODY_PARTS.map((part) => (
            <option key={part} value={part}>
              {formatLabel(part)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Severity</span>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITIES.map((sev) => (
            <label
              key={sev}
              className="flex items-center justify-center h-11 rounded-lg border border-black/10 text-sm font-medium has-[:checked]:bg-foreground has-[:checked]:text-background has-[:checked]:border-foreground"
            >
              <input type="radio" name="severity" value={sev} required className="sr-only" />
              {formatLabel(sev)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="date_started" className="text-sm font-medium">
          Started on
        </label>
        <input
          id="date_started"
          name="date_started"
          type="date"
          defaultValue={today}
          required
          className="h-11 rounded-lg border border-black/10 px-4 text-base"
        />
      </div>

      <label className="flex items-center gap-2 h-11">
        <input type="checkbox" name="affects_running" className="h-5 w-5" />
        <span className="text-sm font-medium">Affects running</span>
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Affected movement patterns (lifting)</span>
        <div className="grid grid-cols-2 gap-2">
          {MOVEMENT_PATTERNS.map((pattern) => (
            <label
              key={pattern}
              className="flex items-center gap-2 h-11 rounded-lg border border-black/10 px-3"
            >
              <input
                type="checkbox"
                name="affected_movement_patterns"
                value={pattern}
                className="h-5 w-5"
              />
              <span className="text-sm">{formatLabel(pattern)}</span>
            </label>
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
        {pending ? "Saving…" : "Save injury"}
      </button>
    </form>
  );
}
