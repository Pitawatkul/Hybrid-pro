"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import type { InjurySeverity, MovementPattern } from "@/lib/db/types";

export type CreateInjuryState = { error?: string } | undefined;

const SEVERITY_DEFAULT_RUNNING_REDUCTION: Record<InjurySeverity, number> = {
  mild: 15,
  moderate: 40,
  severe: 100,
};

export async function createInjury(
  _state: CreateInjuryState,
  formData: FormData
): Promise<CreateInjuryState> {
  const { userId } = await verifySession();

  const bodyPart = formData.get("body_part");
  const severity = formData.get("severity") as InjurySeverity | null;
  const dateStarted = formData.get("date_started");
  const affectsRunning = formData.get("affects_running") === "on";
  const affectedMovementPatterns = formData.getAll("affected_movement_patterns") as MovementPattern[];
  const notes = formData.get("notes");

  if (typeof bodyPart !== "string" || !bodyPart) {
    return { error: "Select a body part." };
  }
  if (!severity) {
    return { error: "Select a severity." };
  }
  if (typeof dateStarted !== "string" || !dateStarted) {
    return { error: "Enter when this started." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("injuries").insert({
    user_id: userId,
    body_part: bodyPart,
    severity,
    status: "active",
    date_started: dateStarted,
    affected_movement_patterns: affectedMovementPatterns,
    affects_running: affectsRunning,
    running_volume_reduction_pct: affectsRunning
      ? SEVERITY_DEFAULT_RUNNING_REDUCTION[severity]
      : 0,
    notes: typeof notes === "string" && notes ? notes : null,
  });

  if (error) {
    return { error: "Could not save this injury. Try again." };
  }

  redirect("/injuries");
}

export async function resolveInjury(injuryId: string) {
  const { userId } = await verifySession();
  const supabase = await createClient();

  await supabase
    .from("injuries")
    .update({ status: "resolved", date_resolved: new Date().toISOString().slice(0, 10) })
    .eq("id", injuryId)
    .eq("user_id", userId);

  revalidatePath("/injuries");
}
