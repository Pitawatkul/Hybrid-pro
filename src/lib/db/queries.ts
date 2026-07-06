import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Phase } from "@/lib/db/types";
import type { GeneratePlanInput, WeekSummary } from "@/lib/planning/types";
import type { GeneratePlanOutput } from "@/lib/planning/types";

type Client = SupabaseClient<Database>;

export function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function fetchWeekSummary(
  supabase: Client,
  userId: string,
  weekStartDate: string
): Promise<WeekSummary | null> {
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndDate = weekEnd.toISOString().slice(0, 10);

  const { data: plan } = await supabase
    .from("weekly_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
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

  if (!plan && (!loggedSessions || loggedSessions.length === 0)) return null;

  return {
    weekStartDate,
    plannedSessions: plannedSessions ?? [],
    loggedSessions: loggedSessions ?? [],
  };
}

export async function fetchPlanningContext(
  supabase: Client,
  userId: string,
  weekStartDate: string
): Promise<Omit<GeneratePlanInput, "weekNumberInPhase"> | { error: string }> {
  const { data: macrocycle } = await supabase
    .from("macrocycles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (!macrocycle) {
    return { error: "Set up a goal before generating a weekly plan." };
  }

  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("macrocycle_id", macrocycle.id)
    .order("sequence_order");

  const weekEndDate = (() => {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  // Overlap check, not "weekStartDate falls within the phase" — a phase can start
  // mid-week (e.g. the first phase starts "today" rather than on a Monday), in
  // which case the week's Monday would otherwise incorrectly fall outside it.
  const currentPhase = (phases ?? []).find(
    (p: Phase) => p.start_date <= weekEndDate && p.end_date >= weekStartDate
  );

  if (!currentPhase) {
    return { error: "This week falls outside your goal's timeline." };
  }

  const lastWeekStart = new Date(weekStartDate);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeek = await fetchWeekSummary(supabase, userId, lastWeekStart.toISOString().slice(0, 10));

  const { data: activeInjuries } = await supabase
    .from("injuries")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  const { data: exerciseCatalog } = await supabase.from("exercises").select("*");

  return {
    weekStartDate,
    macrocycle,
    currentPhase,
    lastWeek,
    activeInjuries: activeInjuries ?? [],
    exerciseCatalog: exerciseCatalog ?? [],
  };
}

export function weekNumberInPhase(phase: Phase, weekStartDate: string): number {
  const phaseStart = new Date(phase.start_date).getTime();
  const week = new Date(weekStartDate).getTime();
  return Math.floor((week - phaseStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export async function persistGeneratedPlan(
  supabase: Client,
  userId: string,
  weekStartDate: string,
  macrocycleId: string,
  phaseId: string,
  output: GeneratePlanOutput,
  source: "auto" | "manual_regenerate"
): Promise<{ error: string } | { planId: string }> {
  await supabase
    .from("weekly_plans")
    .update({ status: "superseded" })
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .eq("status", "active");

  const { data: plan, error: planError } = await supabase
    .from("weekly_plans")
    .insert({
      user_id: userId,
      macrocycle_id: macrocycleId,
      phase_id: phaseId,
      week_start_date: weekStartDate,
      generation_source: source,
      generation_rationale: output.rationale,
      status: "active",
    })
    .select("id")
    .single();

  if (planError || !plan) {
    return { error: "Could not save the generated plan." };
  }

  const rows = output.plannedSessions.map((session) => ({
    ...session,
    weekly_plan_id: plan.id,
    user_id: userId,
  }));

  const { error: sessionsError } = await supabase.from("planned_sessions").insert(rows);

  if (sessionsError) {
    return { error: "Plan saved, but sessions could not be created." };
  }

  return { planId: plan.id as string };
}
