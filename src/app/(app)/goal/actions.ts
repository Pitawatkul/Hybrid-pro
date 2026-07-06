"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import type { PhaseType } from "@/lib/db/types";

export type CreateGoalState = { error?: string } | undefined;

const PHASE_SPLIT: { phase_type: PhaseType; fraction: number; intensity_bias: "low" | "moderate" | "high" }[] = [
  { phase_type: "base", fraction: 0.4, intensity_bias: "low" },
  { phase_type: "build", fraction: 0.3, intensity_bias: "moderate" },
  { phase_type: "peak", fraction: 0.2, intensity_bias: "high" },
  { phase_type: "taper", fraction: 0.1, intensity_bias: "low" },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function createGoal(_state: CreateGoalState, formData: FormData): Promise<CreateGoalState> {
  const { userId } = await verifySession();

  const goalType = formData.get("goal_type");
  const goalDescription = formData.get("goal_description");
  const startDate = formData.get("start_date");
  const targetDate = formData.get("target_date");
  const startingWeeklyMileageKm = Number(formData.get("starting_weekly_mileage_km") || 0);
  const squat = Number(formData.get("squat_kg") || 0);
  const bench = Number(formData.get("bench_kg") || 0);
  const deadlift = Number(formData.get("deadlift_kg") || 0);

  if (typeof goalType !== "string" || !goalType) {
    return { error: "Select a goal type." };
  }
  if (typeof goalDescription !== "string" || !goalDescription) {
    return { error: "Describe your goal." };
  }
  if (typeof startDate !== "string" || !startDate) {
    return { error: "Enter a start date." };
  }
  if (typeof targetDate !== "string" || !targetDate) {
    return { error: "Enter a target date." };
  }

  const start = new Date(startDate);
  const target = new Date(targetDate);
  const totalDays = Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) {
    return { error: "Target date must be after the start date." };
  }

  const supabase = await createClient();

  await supabase
    .from("macrocycles")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  const { data: macrocycle, error: macrocycleError } = await supabase
    .from("macrocycles")
    .insert({
      user_id: userId,
      goal_type: goalType,
      goal_description: goalDescription,
      start_date: startDate,
      target_date: targetDate,
      starting_weekly_mileage_km: startingWeeklyMileageKm,
      starting_lift_maxes: { squat, bench, deadlift },
      is_active: true,
    })
    .select("id")
    .single();

  if (macrocycleError || !macrocycle) {
    return { error: "Could not save this goal. Try again." };
  }

  let cursor = start;
  const phaseRows = PHASE_SPLIT.map((phase, index) => {
    const isLast = index === PHASE_SPLIT.length - 1;
    const phaseDays = Math.round(totalDays * phase.fraction);
    const phaseStart = cursor;
    const phaseEnd = isLast ? target : addDays(cursor, phaseDays);
    cursor = phaseEnd;

    return {
      macrocycle_id: macrocycle.id,
      phase_type: phase.phase_type,
      sequence_order: index + 1,
      start_date: toISODate(phaseStart),
      end_date: toISODate(phaseEnd),
      intensity_bias: phase.intensity_bias,
    };
  });

  const { error: phasesError } = await supabase.from("phases").insert(phaseRows);

  if (phasesError) {
    return { error: "Goal saved, but phases could not be created. Try regenerating from the Goal page." };
  }

  redirect("/goal");
}
