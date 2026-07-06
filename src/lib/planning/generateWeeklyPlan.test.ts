import { describe, expect, it } from "vitest";
import { generateWeeklyPlan } from "./generateWeeklyPlan";
import type { Exercise, Injury, Macrocycle, Phase } from "@/lib/db/types";
import type { GeneratePlanInput, WeekSummary } from "./types";

const EXERCISES: Exercise[] = [
  { id: "squat", name: "Back Squat", primary_muscle_group: "quads", movement_pattern: "squat", affected_by_body_parts: ["knee", "lower_back"], is_substitutable: true, substitute_exercise_id: "goblet" },
  { id: "goblet", name: "Goblet Squat", primary_muscle_group: "quads", movement_pattern: "squat", affected_by_body_parts: ["knee"], is_substitutable: true, substitute_exercise_id: null },
  { id: "bench", name: "Bench Press", primary_muscle_group: "chest", movement_pattern: "push", affected_by_body_parts: ["shoulder"], is_substitutable: true, substitute_exercise_id: null },
  { id: "deadlift", name: "Conventional Deadlift", primary_muscle_group: "hamstrings", movement_pattern: "hinge", affected_by_body_parts: ["lower_back"], is_substitutable: true, substitute_exercise_id: null },
  { id: "ohp", name: "Overhead Press", primary_muscle_group: "shoulders", movement_pattern: "push", affected_by_body_parts: ["shoulder"], is_substitutable: true, substitute_exercise_id: null },
  { id: "plank", name: "Plank", primary_muscle_group: "core", movement_pattern: "core", affected_by_body_parts: ["lower_back"], is_substitutable: true, substitute_exercise_id: null },
  { id: "row", name: "Barbell Row", primary_muscle_group: "back", movement_pattern: "pull", affected_by_body_parts: ["lower_back"], is_substitutable: true, substitute_exercise_id: null },
  { id: "carry", name: "Farmers Carry", primary_muscle_group: "full_body", movement_pattern: "carry", affected_by_body_parts: ["grip"], is_substitutable: true, substitute_exercise_id: null },
];

const MACROCYCLE: Macrocycle = {
  id: "mc1",
  user_id: "u1",
  goal_type: "marathon",
  goal_description: "Sub-4 marathon",
  target_date: "2026-10-12",
  start_date: "2026-01-01",
  starting_weekly_mileage_km: 30,
  starting_lift_maxes: { squat: 100, bench: 70, deadlift: 130 },
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
};

const BASE_PHASE: Phase = {
  id: "phase1",
  macrocycle_id: "mc1",
  phase_type: "base",
  sequence_order: 1,
  start_date: "2026-01-01",
  end_date: "2026-04-01",
  target_weekly_mileage_km: 60,
  intensity_bias: "low",
  notes: null,
};

const TAPER_PHASE: Phase = { ...BASE_PHASE, phase_type: "taper", intensity_bias: "high" };

function baseInput(overrides: Partial<GeneratePlanInput> = {}): GeneratePlanInput {
  return {
    weekStartDate: "2026-02-02",
    currentPhase: BASE_PHASE,
    macrocycle: MACROCYCLE,
    weekNumberInPhase: 1,
    lastWeek: null,
    activeInjuries: [],
    exerciseCatalog: EXERCISES,
    ...overrides,
  };
}

function lastWeekWithCompliance(plannedKm: number, completedKm: number, rpe: number): WeekSummary {
  return {
    weekStartDate: "2026-01-26",
    plannedSessions: [
      {
        id: "p1",
        weekly_plan_id: "wp1",
        user_id: "u1",
        session_date: "2026-01-27",
        session_type: "run",
        day_label: "Long Run",
        sequence_in_day: 1,
        planned_distance_km: plannedKm,
        planned_duration_min: plannedKm * 6,
        planned_pace_sec_per_km: 360,
        run_type: "long",
        planned_exercises: null,
        is_injury_modified: false,
        modification_note: null,
        status: "completed",
      },
    ],
    loggedSessions: [
      {
        id: "l1",
        user_id: "u1",
        planned_session_id: "p1",
        logged_at: "2026-01-27T10:00:00Z",
        session_date: "2026-01-27",
        session_type: "run",
        actual_distance_km: completedKm,
        actual_duration_min: completedKm * 6,
        actual_pace_sec_per_km: 360,
        actual_rpe: rpe,
        logged_exercises: null,
        notes: null,
      },
    ],
  };
}

describe("generateWeeklyPlan — running progression", () => {
  it("week 1 uses the macrocycle's starting weekly mileage", () => {
    const result = generateWeeklyPlan(baseInput());
    const totalKm = result.plannedSessions
      .filter((s) => s.session_type === "run")
      .reduce((sum, s) => sum + (s.planned_distance_km ?? 0), 0);

    expect(totalKm).toBeCloseTo(30, 0);
    expect(result.rationale.some((r) => r.includes("Week 1"))).toBe(true);
  });

  it("increases volume ~10% on high compliance and low RPE", () => {
    const result = generateWeeklyPlan(
      baseInput({ lastWeek: lastWeekWithCompliance(20, 19, 6), weekNumberInPhase: 2 })
    );
    const totalKm = result.plannedSessions
      .filter((s) => s.session_type === "run")
      .reduce((sum, s) => sum + (s.planned_distance_km ?? 0), 0);

    expect(totalKm).toBeCloseTo(22, 0);
    expect(result.rationale.some((r) => r.includes("+10%"))).toBe(true);
  });

  it("holds volume flat on medium compliance (70-89%)", () => {
    const result = generateWeeklyPlan(
      baseInput({ lastWeek: lastWeekWithCompliance(20, 15, 7), weekNumberInPhase: 2 })
    );
    const totalKm = result.plannedSessions
      .filter((s) => s.session_type === "run")
      .reduce((sum, s) => sum + (s.planned_distance_km ?? 0), 0);

    expect(totalKm).toBeCloseTo(20, 0);
    expect(result.rationale.some((r) => r.includes("held flat"))).toBe(true);
  });

  it("reduces volume on low compliance (<70%)", () => {
    const result = generateWeeklyPlan(
      baseInput({ lastWeek: lastWeekWithCompliance(20, 10, 8), weekNumberInPhase: 2 })
    );
    const totalKm = result.plannedSessions
      .filter((s) => s.session_type === "run")
      .reduce((sum, s) => sum + (s.planned_distance_km ?? 0), 0);

    expect(totalKm).toBeCloseTo(17.5, 0);
    expect(result.rationale.some((r) => r.includes("-12.5%"))).toBe(true);
  });

  it("applies a cutback week every 4th week regardless of compliance", () => {
    const result = generateWeeklyPlan(
      baseInput({ lastWeek: lastWeekWithCompliance(20, 19, 6), weekNumberInPhase: 4 })
    );
    expect(result.rationale.some((r) => r.includes("Cutback week"))).toBe(true);
  });

  it("uses a fixed decreasing schedule during taper, ignoring compliance", () => {
    const result = generateWeeklyPlan(
      baseInput({
        currentPhase: TAPER_PHASE,
        lastWeek: lastWeekWithCompliance(20, 5, 9), // would normally trigger a big reduction
        weekNumberInPhase: 1,
      })
    );
    expect(result.rationale.some((r) => r.includes("Taper phase"))).toBe(true);
  });
});

describe("generateWeeklyPlan — lifting progression", () => {
  it("starts main lifts at 75% of estimated max in week 1", () => {
    const result = generateWeeklyPlan(baseInput());
    const liftSession = result.plannedSessions.find((s) => s.session_type === "lift");
    const squat = liftSession?.planned_exercises?.find((e) => e.exercise_id === "squat");
    expect(squat?.target_weight_kg).toBe(75);
  });
});

describe("generateWeeklyPlan — injury modifications", () => {
  it("mild injury reduces load by 25%", () => {
    const injury: Injury = {
      id: "i1",
      user_id: "u1",
      body_part: "knee",
      severity: "mild",
      status: "active",
      date_started: "2026-01-01",
      date_resolved: null,
      affected_movement_patterns: [],
      affects_running: false,
      running_volume_reduction_pct: 0,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    const result = generateWeeklyPlan(baseInput({ activeInjuries: [injury] }));
    const liftSession = result.plannedSessions.find((s) => s.session_type === "lift");
    const squat = liftSession?.planned_exercises?.find((e) => e.exercise_id === "squat");

    expect(squat?.target_weight_kg).toBe(56.5); // 75 * 0.75, rounded to nearest 0.5
    expect(liftSession?.is_injury_modified).toBe(true);
  });

  it("moderate injury substitutes the exercise", () => {
    const injury: Injury = {
      id: "i2",
      user_id: "u1",
      body_part: "lower_back",
      severity: "moderate",
      status: "active",
      date_started: "2026-01-01",
      date_resolved: null,
      affected_movement_patterns: [],
      affects_running: false,
      running_volume_reduction_pct: 0,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    const result = generateWeeklyPlan(baseInput({ activeInjuries: [injury] }));
    const liftSession = result.plannedSessions.find((s) => s.session_type === "lift");
    const squat = liftSession?.planned_exercises?.find((e) => e.exercise_id === "squat" || e.exercise_id === "goblet");

    expect(squat?.exercise_id).toBe("goblet");
  });

  it("severe injury removes the exercise entirely", () => {
    const injury: Injury = {
      id: "i3",
      user_id: "u1",
      body_part: "shoulder",
      severity: "severe",
      status: "active",
      date_started: "2026-01-01",
      date_resolved: null,
      affected_movement_patterns: [],
      affects_running: false,
      running_volume_reduction_pct: 0,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    const result = generateWeeklyPlan(baseInput({ activeInjuries: [injury] }));
    const liftSession = result.plannedSessions.find((s) => s.session_type === "lift" && s.day_label === "Lower + Push");
    const bench = liftSession?.planned_exercises?.find((e) => e.exercise_id === "bench");
    const ohp = liftSession?.planned_exercises?.find((e) => e.exercise_id === "ohp");

    expect(bench).toBeUndefined();
    expect(ohp).toBeUndefined();
  });

  it("running injury reduces distance by the configured percentage", () => {
    const injury: Injury = {
      id: "i4",
      user_id: "u1",
      body_part: "achilles",
      severity: "moderate",
      status: "active",
      date_started: "2026-01-01",
      date_resolved: null,
      affected_movement_patterns: [],
      affects_running: true,
      running_volume_reduction_pct: 40,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
    };
    const withoutInjury = generateWeeklyPlan(baseInput());
    const withInjury = generateWeeklyPlan(baseInput({ activeInjuries: [injury] }));

    const totalWithout = withoutInjury.plannedSessions
      .filter((s) => s.session_type === "run")
      .reduce((sum, s) => sum + (s.planned_distance_km ?? 0), 0);
    const totalWith = withInjury.plannedSessions
      .filter((s) => s.session_type === "run")
      .reduce((sum, s) => sum + (s.planned_distance_km ?? 0), 0);

    expect(totalWith).toBeCloseTo(totalWithout * 0.6, 0);
  });
});
