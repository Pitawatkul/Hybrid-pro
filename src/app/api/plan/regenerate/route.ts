import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import { fetchPlanningContext, mondayOf, persistGeneratedPlan, weekNumberInPhase } from "@/lib/db/queries";
import { generateWeeklyPlan } from "@/lib/planning/generateWeeklyPlan";

export async function POST(request: NextRequest) {
  const { userId } = await verifySession();
  const supabase = await createClient();

  const weekStartDate = mondayOf(new Date());
  const context = await fetchPlanningContext(supabase, userId, weekStartDate);

  if ("error" in context) {
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(context.error)}`, request.url));
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
    "manual_regenerate"
  );

  if ("error" in result) {
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(result.error)}`, request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
