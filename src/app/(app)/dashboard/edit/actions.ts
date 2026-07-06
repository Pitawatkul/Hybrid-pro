"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import type { PlannedExercise, PlannedSessionStatus } from "@/lib/db/types";

export type SaveEditedPlanState = { error?: string } | undefined;

type EditedSession = {
  id: string;
  day_label: string | null;
  status: PlannedSessionStatus;
  planned_distance_km: number | null;
  planned_duration_min: number | null;
  planned_exercises: PlannedExercise[] | null;
};

export async function saveEditedPlan(
  _state: SaveEditedPlanState,
  formData: FormData
): Promise<SaveEditedPlanState> {
  const { userId } = await verifySession();

  const weeklyPlanId = formData.get("weekly_plan_id");
  const sessionsRaw = formData.get("sessions");

  if (typeof weeklyPlanId !== "string" || !weeklyPlanId) {
    return { error: "Missing plan reference." };
  }

  let sessions: EditedSession[];
  try {
    sessions = JSON.parse(typeof sessionsRaw === "string" ? sessionsRaw : "[]");
  } catch {
    return { error: "Something went wrong reading your edits. Try again." };
  }

  const supabase = await createClient();

  for (const session of sessions) {
    const { error } = await supabase
      .from("planned_sessions")
      .update({
        day_label: session.day_label,
        status: session.status,
        planned_distance_km: session.planned_distance_km,
        planned_duration_min: session.planned_duration_min,
        planned_exercises: session.planned_exercises,
      })
      .eq("id", session.id)
      .eq("user_id", userId);

    if (error) {
      return { error: "Could not save your edits. Try again." };
    }
  }

  await supabase
    .from("weekly_plans")
    .update({ generation_source: "manual_edit" })
    .eq("id", weeklyPlanId)
    .eq("user_id", userId);

  redirect("/dashboard");
}
