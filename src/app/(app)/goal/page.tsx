import Link from "next/link";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import { formatLabel } from "@/lib/constants/injuries";
import type { Phase } from "@/lib/db/types";

export default async function GoalPage() {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const { data: macrocycle } = await supabase
    .from("macrocycles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!macrocycle) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Goal</h1>
        <p className="text-sm text-zinc-500">
          No active goal yet. Set one up to start generating weekly plans around it.
        </p>
        <Link
          href="/goal/setup"
          className="h-11 flex items-center justify-center rounded-lg bg-foreground text-background font-medium"
        >
          Set up goal
        </Link>
      </div>
    );
  }

  const { data: phasesData } = await supabase
    .from("phases")
    .select("*")
    .eq("macrocycle_id", macrocycle.id)
    .order("sequence_order");

  const phases = (phasesData ?? []) as Phase[];
  const today = new Date();
  const timelineStart = new Date(macrocycle.start_date).getTime();
  const timelineEnd = new Date(macrocycle.target_date).getTime();
  const totalMs = Math.max(1, timelineEnd - timelineStart);

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Goal</h1>
        <Link href="/goal/setup" className="text-sm font-medium">
          Edit
        </Link>
      </div>

      <div>
        <p className="font-medium">{macrocycle.goal_description}</p>
        <p className="text-sm text-zinc-500 mt-0.5">
          {formatLabel(macrocycle.goal_type)} · Target {macrocycle.target_date}
        </p>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
        {phases.map((phase) => {
          const start = new Date(phase.start_date).getTime();
          const end = new Date(phase.end_date).getTime();
          const widthPct = ((end - start) / totalMs) * 100;
          const isCurrent = today.getTime() >= start && today.getTime() <= end;

          return (
            <div
              key={phase.id}
              style={{ width: `${widthPct}%` }}
              className={isCurrent ? "bg-foreground" : "bg-zinc-300"}
              title={`${formatLabel(phase.phase_type)}: ${phase.start_date} – ${phase.end_date}`}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {phases.map((phase) => {
          const start = new Date(phase.start_date).getTime();
          const end = new Date(phase.end_date).getTime();
          const isCurrent = today.getTime() >= start && today.getTime() <= end;

          return (
            <div
              key={phase.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                isCurrent ? "bg-zinc-100 font-medium" : ""
              }`}
            >
              <span>{formatLabel(phase.phase_type)}</span>
              <span className="text-sm text-zinc-500">
                {phase.start_date} – {phase.end_date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
