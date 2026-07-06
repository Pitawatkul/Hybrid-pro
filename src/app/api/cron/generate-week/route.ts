import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPlanningContext, mondayOf, persistGeneratedPlan, weekNumberInPhase } from "@/lib/db/queries";
import { generateWeeklyPlan } from "@/lib/planning/generateWeeklyPlan";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const weekStartDate = mondayOf(new Date());

  const { data: activeMacrocycles } = await supabase
    .from("macrocycles")
    .select("user_id")
    .eq("is_active", true);

  const results: { userId: string; ok: boolean; detail: string }[] = [];

  for (const { user_id: userId } of activeMacrocycles ?? []) {
    const context = await fetchPlanningContext(supabase, userId, weekStartDate);

    if ("error" in context) {
      results.push({ userId, ok: false, detail: context.error });
      continue;
    }

    const output = generateWeeklyPlan({
      ...context,
      weekNumberInPhase: weekNumberInPhase(context.currentPhase, weekStartDate),
    });

    const result = await persistGeneratedPlan(
      supabase,
      userId,
      weekStartDate,
      context.macrocycle.id,
      context.currentPhase.id,
      output,
      "auto"
    );

    results.push(
      "error" in result
        ? { userId, ok: false, detail: result.error }
        : { userId, ok: true, detail: `plan ${result.planId}` }
    );
  }

  return NextResponse.json({ weekStartDate, results });
}
