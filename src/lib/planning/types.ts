import type {
  Exercise,
  Injury,
  LoggedSession,
  Macrocycle,
  Phase,
  PlannedExercise,
  PlannedSession,
  RunType,
  SessionType,
} from "@/lib/db/types";

export type WeekSummary = {
  weekStartDate: string;
  plannedSessions: PlannedSession[];
  loggedSessions: LoggedSession[];
};

export type NewPlannedSession = {
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
  status: "planned";
};

export type GeneratePlanInput = {
  weekStartDate: string;
  currentPhase: Phase;
  macrocycle: Macrocycle;
  weekNumberInPhase: number;
  lastWeek: WeekSummary | null;
  activeInjuries: Injury[];
  exerciseCatalog: Exercise[];
};

export type GeneratePlanOutput = {
  plannedSessions: NewPlannedSession[];
  rationale: string[];
};
