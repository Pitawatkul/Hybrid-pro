import type { Exercise, IntensityBias, PlannedExercise } from "@/lib/db/types";
import type { GeneratePlanInput, NewPlannedSession, WeekSummary } from "./types";

const CUTBACK_EVERY_N_WEEKS = 4;
const DEFAULT_MAX_KG = 40;

const REP_RANGES: Record<IntensityBias, { reps: number; sets: number }> = {
  low: { reps: 10, sets: 3 }, // base
  moderate: { reps: 6, sets: 4 }, // build
  high: { reps: 3, sets: 5 }, // peak / taper
};

type MainLiftKey = "squat" | "bench" | "deadlift";

const MAIN_LIFT_EXERCISE_NAME: Record<MainLiftKey, string> = {
  squat: "Back Squat",
  bench: "Bench Press",
  deadlift: "Conventional Deadlift",
};

const PROGRESSION_PCT: Record<MainLiftKey, number> = {
  squat: 0.05,
  deadlift: 0.05,
  bench: 0.025,
};

const DAY_A_ACCESSORIES = ["Overhead Press", "Plank"];
const DAY_B_ACCESSORIES = ["Barbell Row", "Farmers Carry"];

function findExercise(catalog: Exercise[], name: string): Exercise | undefined {
  return catalog.find((e) => e.name === name);
}

function findLastWeekSetsFor(lastWeek: WeekSummary | null, exerciseId: string) {
  if (!lastWeek) return [];
  return lastWeek.loggedSessions
    .filter((s) => s.session_type === "lift" && s.logged_exercises)
    .flatMap((s) => s.logged_exercises ?? [])
    .filter((ex) => ex.exercise_id === exerciseId)
    .flatMap((ex) => ex.sets);
}

function findLastWeekTargetWeight(lastWeek: WeekSummary | null, exerciseId: string): number | null {
  if (!lastWeek) return null;
  for (const session of lastWeek.plannedSessions) {
    if (session.session_type !== "lift" || !session.planned_exercises) continue;
    const match = session.planned_exercises.find((ex) => ex.exercise_id === exerciseId);
    if (match?.target_weight_kg != null) return match.target_weight_kg;
  }
  return null;
}

function nextTargetWeight(
  liftKey: MainLiftKey,
  exercise: Exercise,
  input: GeneratePlanInput,
  rationale: string[]
): number {
  const { lastWeek, macrocycle } = input;
  const startingMax = macrocycle.starting_lift_maxes[liftKey] ?? DEFAULT_MAX_KG;
  const lastTarget = findLastWeekTargetWeight(lastWeek, exercise.id);

  if (lastTarget == null) {
    const baseline = Math.round(startingMax * 0.75);
    rationale.push(`${exercise.name}: starting at ${baseline}kg (75% of your estimated max) — no prior week to progress from.`);
    return baseline;
  }

  const sets = findLastWeekSetsFor(lastWeek, exercise.id);
  const targetReps = REP_RANGES[input.currentPhase.intensity_bias].reps;

  if (sets.length === 0) {
    rationale.push(`${exercise.name}: held at ${lastTarget}kg — not logged last week.`);
    return lastTarget;
  }

  const missedFraction = sets.filter((s) => s.reps < targetReps).length / sets.length;
  const rpes = sets.filter((s) => s.rpe != null).map((s) => s.rpe as number);
  const avgRpe = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;

  if (missedFraction === 0 && (avgRpe == null || avgRpe <= 8)) {
    const next = Math.round(lastTarget * (1 + PROGRESSION_PCT[liftKey]) * 2) / 2;
    rationale.push(`${exercise.name}: +${PROGRESSION_PCT[liftKey] * 100}% to ${next}kg — all sets hit at ${lastTarget}kg.`);
    return next;
  }
  if (missedFraction === 0) {
    rationale.push(`${exercise.name}: held at ${lastTarget}kg — reps hit but effort was high (avg RPE ${avgRpe?.toFixed(1)}).`);
    return lastTarget;
  }
  if (missedFraction < 0.2) {
    rationale.push(`${exercise.name}: held at ${lastTarget}kg — a few reps missed last week.`);
    return lastTarget;
  }
  const reduced = Math.round(lastTarget * 0.925 * 2) / 2;
  rationale.push(`${exercise.name}: -7.5% to ${reduced}kg — reps missed on ${Math.round(missedFraction * 100)}% of sets.`);
  return reduced;
}

function buildDayExercises(
  liftKeys: MainLiftKey[],
  accessoryNames: string[],
  catalog: Exercise[],
  input: GeneratePlanInput,
  rationale: string[],
  setsOverride?: number
): PlannedExercise[] {
  const { reps, sets } = REP_RANGES[input.currentPhase.intensity_bias];
  const effectiveSets = setsOverride ?? sets;
  const exercises: PlannedExercise[] = [];

  for (const liftKey of liftKeys) {
    const exercise = findExercise(catalog, MAIN_LIFT_EXERCISE_NAME[liftKey]);
    if (!exercise) continue;
    exercises.push({
      exercise_id: exercise.id,
      sets: effectiveSets,
      reps,
      target_weight_kg: nextTargetWeight(liftKey, exercise, input, rationale),
      rpe_target: 8,
    });
  }

  for (const name of accessoryNames) {
    const exercise = findExercise(catalog, name);
    if (!exercise) continue;
    exercises.push({
      exercise_id: exercise.id,
      sets: Math.max(2, effectiveSets - 1),
      reps: reps + 2,
      target_weight_kg: null,
      rpe_target: 7,
    });
  }

  return exercises;
}

function sessionDateFor(weekStartDate: string, dayOffset: number): string {
  const d = new Date(weekStartDate);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

export function planLiftingWeek(input: GeneratePlanInput, rationale: string[]): NewPlannedSession[] {
  const { weekStartDate, exerciseCatalog, weekNumberInPhase } = input;
  const isDeloadWeek = weekNumberInPhase % CUTBACK_EVERY_N_WEEKS === 0;
  const setsOverride = isDeloadWeek ? Math.max(2, Math.round(REP_RANGES[input.currentPhase.intensity_bias].sets * 0.55)) : undefined;

  if (isDeloadWeek) {
    rationale.push(`Deload week — lifting volume (sets) reduced ~45%.`);
  }

  const dayA = buildDayExercises(["squat", "bench"], DAY_A_ACCESSORIES, exerciseCatalog, input, rationale, setsOverride);
  const dayB = buildDayExercises(["deadlift"], DAY_B_ACCESSORIES, exerciseCatalog, input, rationale, setsOverride);

  const sessions: NewPlannedSession[] = [];

  if (dayA.length > 0) {
    sessions.push({
      session_date: sessionDateFor(weekStartDate, 1),
      session_type: "lift",
      day_label: "Lower + Push",
      sequence_in_day: 1,
      planned_distance_km: null,
      planned_duration_min: null,
      planned_pace_sec_per_km: null,
      run_type: null,
      planned_exercises: dayA,
      is_injury_modified: false,
      modification_note: null,
      status: "planned",
    });
  }

  if (dayB.length > 0) {
    sessions.push({
      session_date: sessionDateFor(weekStartDate, 4),
      session_type: "lift",
      day_label: "Hinge + Pull",
      sequence_in_day: 1,
      planned_distance_km: null,
      planned_duration_min: null,
      planned_pace_sec_per_km: null,
      run_type: null,
      planned_exercises: dayB,
      is_injury_modified: false,
      modification_note: null,
      status: "planned",
    });
  }

  return sessions;
}
