"use client";

import { useActionState, useState } from "react";
import { logLift, type LogLiftState } from "@/app/(app)/log/lift/actions";

type SetRow = { reps: string; weight_kg: string; rpe: string };
type ExerciseBlock = { exerciseId: string; sets: SetRow[] };

const EMPTY_SET: SetRow = { reps: "", weight_kg: "", rpe: "" };

function newBlock(defaultExerciseId: string): ExerciseBlock {
  return { exerciseId: defaultExerciseId, sets: [{ ...EMPTY_SET }] };
}

export function LiftLogForm({
  today,
  exercises,
}: {
  today: string;
  exercises: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<LogLiftState, FormData>(logLift, undefined);
  const defaultExerciseId = exercises[0]?.id ?? "";
  const [blocks, setBlocks] = useState<ExerciseBlock[]>([newBlock(defaultExerciseId)]);

  function updateBlock(index: number, patch: Partial<ExerciseBlock>) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function updateSet(blockIndex: number, setIndex: number, patch: Partial<SetRow>) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === blockIndex
          ? { ...b, sets: b.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)) }
          : b
      )
    );
  }

  function addSet(blockIndex: number) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === blockIndex ? { ...b, sets: [...b.sets, { ...EMPTY_SET }] } : b))
    );
  }

  function removeSet(blockIndex: number, setIndex: number) {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === blockIndex ? { ...b, sets: b.sets.filter((_, j) => j !== setIndex) } : b
      )
    );
  }

  function addBlock() {
    setBlocks((prev) => [...prev, newBlock(defaultExerciseId)]);
  }

  function removeBlock(blockIndex: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== blockIndex));
  }

  const loggedExercisesJson = JSON.stringify(
    blocks.map((b) => ({
      exercise_id: b.exerciseId,
      sets: b.sets
        .filter((s) => s.reps !== "" && s.weight_kg !== "")
        .map((s) => ({
          reps: Number(s.reps),
          weight_kg: Number(s.weight_kg),
          rpe: s.rpe === "" ? null : Number(s.rpe),
        })),
    }))
  );

  return (
    <form action={formAction} className="p-4 flex flex-col gap-4">
      <input type="hidden" name="logged_exercises" value={loggedExercisesJson} />

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

      {blocks.map((block, blockIndex) => (
        <div key={blockIndex} className="rounded-xl border border-black/10 p-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <select
              value={block.exerciseId}
              onChange={(e) => updateBlock(blockIndex, { exerciseId: e.target.value })}
              className="h-11 flex-1 rounded-lg border border-black/10 px-3 text-base"
            >
              {exercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
            {blocks.length > 1 && (
              <button
                type="button"
                onClick={() => removeBlock(blockIndex)}
                className="h-11 w-11 shrink-0 rounded-lg border border-black/10 text-zinc-500"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-zinc-500 px-1">
              <span>Reps</span>
              <span>Weight (kg)</span>
              <span>RPE</span>
              <span />
            </div>
            {block.sets.map((set, setIndex) => (
              <div key={setIndex} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={set.reps}
                  onChange={(e) => updateSet(blockIndex, setIndex, { reps: e.target.value })}
                  className="h-11 rounded-lg border border-black/10 px-3 text-base"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={set.weight_kg}
                  onChange={(e) => updateSet(blockIndex, setIndex, { weight_kg: e.target.value })}
                  className="h-11 rounded-lg border border-black/10 px-3 text-base"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="10"
                  value={set.rpe}
                  onChange={(e) => updateSet(blockIndex, setIndex, { rpe: e.target.value })}
                  className="h-11 rounded-lg border border-black/10 px-3 text-base"
                />
                {block.sets.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSet(blockIndex, setIndex)}
                    className="h-11 w-11 shrink-0 rounded-lg border border-black/10 text-zinc-500"
                  >
                    ✕
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addSet(blockIndex)}
            className="h-11 rounded-lg border border-black/10 text-sm font-medium"
          >
            + Add set
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addBlock}
        className="h-11 rounded-lg border border-black/10 text-sm font-medium"
      >
        + Add exercise
      </button>

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
        {pending ? "Saving…" : "Save session"}
      </button>
    </form>
  );
}
