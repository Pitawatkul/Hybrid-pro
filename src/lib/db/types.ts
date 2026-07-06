// Hand-authored to match supabase/migrations/*.sql. Once a real Supabase
// project exists, regenerate with:
//   supabase gen types typescript --project-id <ref> > src/lib/db/types.ts
//
// NOTE: these must be `type` aliases, not `interface`s — interfaces don't get
// TypeScript's implicit index-signature inference, so they fail the
// `Record<string, unknown>` structural checks Supabase's generic client relies on.

export type PhaseType = "base" | "build" | "peak" | "taper" | "recovery";
export type IntensityBias = "low" | "moderate" | "high";
export type GenerationSource = "auto" | "manual_regenerate" | "manual_edit";
export type WeeklyPlanStatus = "active" | "completed" | "superseded";
export type MovementPattern = "squat" | "hinge" | "push" | "pull" | "carry" | "core";
export type SessionType = "run" | "lift";
export type RunType = "easy" | "tempo" | "interval" | "long" | "recovery" | "race";
export type PlannedSessionStatus = "planned" | "completed" | "skipped" | "partial";
export type InjurySeverity = "mild" | "moderate" | "severe";
export type InjuryStatus = "active" | "recovering" | "resolved";

export type PlannedExercise = {
  exercise_id: string;
  sets: number;
  reps: number;
  target_weight_kg: number | null;
  rpe_target: number | null;
};

export type LoggedSet = {
  reps: number;
  weight_kg: number;
  rpe: number | null;
};

export type LoggedExercise = {
  exercise_id: string;
  sets: LoggedSet[];
};

export type Macrocycle = {
  id: string;
  user_id: string;
  goal_type: string;
  goal_description: string;
  target_date: string;
  start_date: string;
  starting_weekly_mileage_km: number;
  starting_lift_maxes: Record<string, number>;
  is_active: boolean;
  created_at: string;
};

export type Phase = {
  id: string;
  macrocycle_id: string;
  phase_type: PhaseType;
  sequence_order: number;
  start_date: string;
  end_date: string;
  target_weekly_mileage_km: number | null;
  intensity_bias: IntensityBias;
  notes: string | null;
};

export type WeeklyPlan = {
  id: string;
  user_id: string;
  macrocycle_id: string | null;
  phase_id: string | null;
  week_start_date: string;
  generated_at: string;
  generation_source: GenerationSource;
  generation_rationale: string[];
  status: WeeklyPlanStatus;
};

export type Exercise = {
  id: string;
  name: string;
  primary_muscle_group: string;
  movement_pattern: MovementPattern;
  affected_by_body_parts: string[];
  is_substitutable: boolean;
  substitute_exercise_id: string | null;
};

export type PlannedSession = {
  id: string;
  weekly_plan_id: string;
  user_id: string;
  session_date: string;
  session_type: SessionType;
  day_label: string | null;
  sequence_in_day: number;
  planned_distance_km: number | null;
  planned_duration_min: number | null;
  planned_pace_sec_per_km: number | null;
  run_type: RunType | null;
  planned_exercises: PlannedExercise[] | null;
  is_injury_modified: boolean;
  modification_note: string | null;
  status: PlannedSessionStatus;
};

export type LoggedSession = {
  id: string;
  user_id: string;
  planned_session_id: string | null;
  logged_at: string;
  session_date: string;
  session_type: SessionType;
  actual_distance_km: number | null;
  actual_duration_min: number | null;
  actual_pace_sec_per_km: number | null;
  actual_rpe: number | null;
  logged_exercises: LoggedExercise[] | null;
  notes: string | null;
};

export type Injury = {
  id: string;
  user_id: string;
  body_part: string;
  severity: InjurySeverity;
  status: InjuryStatus;
  date_started: string;
  date_resolved: string | null;
  affected_movement_patterns: MovementPattern[];
  affects_running: boolean;
  running_volume_reduction_pct: number;
  notes: string | null;
  created_at: string;
};

type TableShape<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      macrocycles: TableShape<Macrocycle>;
      phases: TableShape<Phase>;
      weekly_plans: TableShape<WeeklyPlan>;
      exercises: TableShape<Exercise>;
      planned_sessions: TableShape<PlannedSession>;
      logged_sessions: TableShape<LoggedSession>;
      injuries: TableShape<Injury>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
