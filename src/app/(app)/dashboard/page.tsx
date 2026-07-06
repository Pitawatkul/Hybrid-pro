import Link from "next/link";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import { mondayOf } from "@/lib/db/queries";
import { formatSummaryForClaude } from "@/lib/planning/formatSummaryForClaude";
import { WeekView } from "@/components/plan/WeekView";
import { PlanDiffBanner } from "@/components/plan/PlanDiffBanner";
import { RegenerateButton } from "@/components/plan/RegenerateButton";
import { CopySummaryButton } from "@/components/plan/CopySummaryButton";
import type { Phase } from "@/lib/db/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { userId } = await verifySession();
  const supabase = await createClient();
  const weekStartDate = mondayOf(new Date());
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndDate = weekEnd.toISOString().slice(0, 10);

  const { data: macrocycle } = await supabase
    .from("macrocycles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  const { data: plan } = await supabase
    .from("weekly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .eq("status", "active")
    .maybeSingle();

  const { data: plannedSessions } = plan
    ? await supabase.from("planned_sessions").select("*").eq("weekly_plan_id", plan.id)
    : { data: [] };

  const { data: loggedSessions } = await supabase
    .from("logged_sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("session_date", weekStartDate)
    .lte("session_date", weekEndDate);

  const { data: activeInjuries } = await supabase
    .from("injuries")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  let currentPhase: Phase | null = null;
  if (macrocycle) {
    const { data: phases } = await supabase
      .from("phases")
      .select("*")
      .eq("macrocycle_id", macrocycle.id)
      .order("sequence_order");
    currentPhase =
      (phases ?? []).find((p) => p.start_date <= weekEndDate && p.end_date >= weekStartDate) ?? null;
  }

  const summary = formatSummaryForClaude({
    weekStartDate,
    weekSummary: { weekStartDate, plannedSessions: plannedSessions ?? [], loggedSessions: loggedSessions ?? [] },
    activeInjuries: activeInjuries ?? [],
    currentPhase,
    macrocycle: macrocycle ?? null,
  });

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">This Week</h1>

      {error && <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>}

      {!macrocycle ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">
            Set up a goal first — weekly plans are generated around your timeline.
          </p>
          <Link
            href="/goal/setup"
            className="h-11 flex items-center justify-center rounded-lg bg-foreground text-background font-medium"
          >
            Set up goal
          </Link>
        </div>
      ) : (
        <>
          {plan && <PlanDiffBanner rationale={plan.generation_rationale} />}

          {plannedSessions && plannedSessions.length > 0 ? (
            <WeekView sessions={plannedSessions} loggedSessions={loggedSessions ?? []} />
          ) : (
            <p className="text-sm text-zinc-500">No plan generated for this week yet.</p>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <RegenerateButton hasExistingPlan={!!plan} />
            {plan && (
              <Link
                href="/dashboard/edit"
                className="h-11 flex items-center justify-center rounded-lg border border-black/10 text-sm font-medium"
              >
                Edit this week&apos;s plan
              </Link>
            )}
            <CopySummaryButton summary={summary} />
          </div>
        </>
      )}
    </div>
  );
}
