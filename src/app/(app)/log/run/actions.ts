"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";

export type LogRunState = { error?: string } | undefined;

export async function logRun(_state: LogRunState, formData: FormData): Promise<LogRunState> {
  const { userId } = await verifySession();

  const sessionDate = formData.get("session_date");
  const distanceKm = Number(formData.get("distance_km"));
  const durationMin = Number(formData.get("duration_min"));
  const rpeRaw = formData.get("rpe");
  const notes = formData.get("notes");

  if (typeof sessionDate !== "string" || !sessionDate) {
    return { error: "Enter a date." };
  }
  if (!distanceKm || distanceKm <= 0) {
    return { error: "Enter a distance greater than 0." };
  }
  if (!durationMin || durationMin <= 0) {
    return { error: "Enter a duration greater than 0." };
  }

  const actualPaceSecPerKm = Math.round((durationMin * 60) / distanceKm);
  const rpe = rpeRaw ? Number(rpeRaw) : null;

  const supabase = await createClient();
  const { error } = await supabase.from("logged_sessions").insert({
    user_id: userId,
    session_date: sessionDate,
    session_type: "run",
    actual_distance_km: distanceKm,
    actual_duration_min: durationMin,
    actual_pace_sec_per_km: actualPaceSecPerKm,
    actual_rpe: rpe,
    notes: typeof notes === "string" && notes ? notes : null,
  });

  if (error) {
    return { error: "Could not save this run. Try again." };
  }

  redirect("/log?logged=run");
}
