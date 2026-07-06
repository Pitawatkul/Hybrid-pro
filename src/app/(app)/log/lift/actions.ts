"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/db/dal";
import { createClient } from "@/lib/supabase/server";
import type { LoggedExercise } from "@/lib/db/types";

export type LogLiftState = { error?: string } | undefined;

export async function logLift(_state: LogLiftState, formData: FormData): Promise<LogLiftState> {
  const { userId } = await verifySession();

  const sessionDate = formData.get("session_date");
  const exercisesRaw = formData.get("logged_exercises");
  const notes = formData.get("notes");

  if (typeof sessionDate !== "string" || !sessionDate) {
    return { error: "Enter a date." };
  }

  let loggedExercises: LoggedExercise[];
  try {
    loggedExercises = JSON.parse(typeof exercisesRaw === "string" ? exercisesRaw : "[]");
  } catch {
    return { error: "Something went wrong reading your exercises. Try again." };
  }

  const validExercises = loggedExercises.filter(
    (ex) => ex.exercise_id && ex.sets.some((s) => s.reps > 0 && s.weight_kg >= 0)
  );

  if (validExercises.length === 0) {
    return { error: "Add at least one exercise with reps and weight." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("logged_sessions").insert({
    user_id: userId,
    session_date: sessionDate,
    session_type: "lift",
    logged_exercises: validExercises,
    notes: typeof notes === "string" && notes ? notes : null,
  });

  if (error) {
    return { error: "Could not save this session. Try again." };
  }

  redirect("/log?logged=lift");
}
