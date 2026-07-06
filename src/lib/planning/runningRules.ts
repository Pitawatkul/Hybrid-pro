import type { RunType } from "@/lib/db/types";
import type { GeneratePlanInput, NewPlannedSession } from "./types";

const DEFAULT_PACE_SEC_PER_KM = 360; // 6:00/km fallback when we have no logged pace to go on
const MAX_WEEKLY_INCREASE = 0.1; // classic "10% rule" — hard cap
const CUTBACK_EVERY_N_WEEKS = 4;

type RunDistribution = { run_type: RunType; fraction: number; dayOffset: number; label: string };

const DISTRIBUTION_BY_PHASE: Record<string, RunDistribution[]> = {
  base: [
    { run_type: "easy", fraction: 0.25, dayOffset: 1, label: "Easy Run" },
    { run_type: "easy", fraction: 0.25, dayOffset: 3, label: "Easy Run" },
    { run_type: "long", fraction: 0.5, dayOffset: 6, label: "Long Run" },
  ],
  build: [
    { run_type: "easy", fraction: 0.2, dayOffset: 1, label: "Easy Run" },
    { run_type: "tempo", fraction: 0.25, dayOffset: 2, label: "Tempo Run" },
    { run_type: "interval", fraction: 0.2, dayOffset: 4, label: "Interval Run" },
    { run_type: "long", fraction: 0.35, dayOffset: 6, label: "Long Run" },
  ],
  peak: [
    { run_type: "easy", fraction: 0.15, dayOffset: 1, label: "Easy Run" },
    { run_type: "tempo", fraction: 0.25, dayOffset: 2, label: "Race-Pace Tempo" },
    { run_type: "interval", fraction: 0.25, dayOffset: 4, label: "Interval Run" },
    { run_type: "long", fraction: 0.35, dayOffset: 6, label: "Long Run" },
  ],
  taper: [
    { run_type: "easy", fraction: 0.35, dayOffset: 1, label: "Easy Run" },
    { run_type: "tempo", fraction: 0.25, dayOffset: 3, label: "Race-Pace Tempo" },
    { run_type: "long", fraction: 0.4, dayOffset: 6, label: "Long Run" },
  ],
  recovery: [
    { run_type: "recovery", fraction: 0.5, dayOffset: 1, label: "Recovery Run" },
    { run_type: "recovery", fraction: 0.5, dayOffset: 4, label: "Recovery Run" },
  ],
};

function sessionDateFor(weekStartDate: string, dayOffset: number): string {
  const d = new Date(weekStartDate);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

function sumRunDistance(sessions: { session_type: string; planned_distance_km?: number | null; actual_distance_km?: number | null }[], key: "planned_distance_km" | "actual_distance_km"): number {
  return sessions
    .filter((s) => s.session_type === "run")
    .reduce((sum, s) => sum + (Number((s as Record<string, unknown>)[key]) || 0), 0);
}

function averageRunRpe(loggedSessions: { session_type: string; actual_rpe: number | null }[]): number | null {
  const rpes = loggedSessions
    .filter((s) => s.session_type === "run" && s.actual_rpe != null)
    .map((s) => s.actual_rpe as number);
  if (rpes.length === 0) return null;
  return rpes.reduce((a, b) => a + b, 0) / rpes.length;
}

function inferPaceSecPerKm(loggedSessions: { session_type: string; actual_pace_sec_per_km: number | null }[]): number {
  const paces = loggedSessions
    .filter((s) => s.session_type === "run" && s.actual_pace_sec_per_km != null)
    .map((s) => s.actual_pace_sec_per_km as number);
  if (paces.length === 0) return DEFAULT_PACE_SEC_PER_KM;
  return Math.round(paces.reduce((a, b) => a + b, 0) / paces.length);
}

export function planRunningWeek(input: GeneratePlanInput, rationale: string[]): NewPlannedSession[] {
  const { weekStartDate, currentPhase, macrocycle, weekNumberInPhase, lastWeek } = input;

  const distribution = DISTRIBUTION_BY_PHASE[currentPhase.phase_type] ?? DISTRIBUTION_BY_PHASE.base;
  const isCutbackWeek = weekNumberInPhase % CUTBACK_EVERY_N_WEEKS === 0;
  const paceSecPerKm = lastWeek ? inferPaceSecPerKm(lastWeek.loggedSessions) : DEFAULT_PACE_SEC_PER_KM;

  let weeklyVolumeKm: number;

  if (currentPhase.phase_type === "taper") {
    const start = new Date(currentPhase.start_date).getTime();
    const end = new Date(currentPhase.end_date).getTime();
    const today = new Date(weekStartDate).getTime();
    const progress = end > start ? Math.min(1, Math.max(0, (today - start) / (end - start))) : 0;
    const peakVolume = currentPhase.target_weekly_mileage_km ?? macrocycle.starting_weekly_mileage_km * 1.5;
    weeklyVolumeKm = peakVolume * (1 - 0.6 * progress);
    rationale.push(`Taper phase — volume reduced on a fixed schedule (not performance-driven), ~${Math.round(weeklyVolumeKm)}km this week.`);
  } else if (!lastWeek) {
    weeklyVolumeKm = macrocycle.starting_weekly_mileage_km;
    rationale.push(`Week 1 — starting from your reported baseline of ${weeklyVolumeKm}km/week.`);
  } else {
    const plannedKm = sumRunDistance(lastWeek.plannedSessions, "planned_distance_km");
    const completedKm = sumRunDistance(lastWeek.loggedSessions, "actual_distance_km");
    const compliance = plannedKm > 0 ? completedKm / plannedKm : 1;
    const avgRpe = averageRunRpe(lastWeek.loggedSessions);
    const baseline = plannedKm > 0 ? plannedKm : completedKm || macrocycle.starting_weekly_mileage_km;

    if (compliance >= 0.9 && (avgRpe == null || avgRpe <= 7)) {
      weeklyVolumeKm = baseline * (1 + MAX_WEEKLY_INCREASE);
      rationale.push(`Running volume +10% — last week's runs were completed (${Math.round(compliance * 100)}%) at a manageable effort.`);
    } else if (compliance >= 0.7) {
      weeklyVolumeKm = baseline;
      rationale.push(`Running volume held flat — last week's compliance was ${Math.round(compliance * 100)}%.`);
    } else {
      weeklyVolumeKm = baseline * 0.875;
      rationale.push(`Running volume -12.5% — low compliance last week (${Math.round(compliance * 100)}%), backing off.`);
    }
  }

  if (isCutbackWeek && currentPhase.phase_type !== "taper") {
    weeklyVolumeKm *= 0.775;
    rationale.push(`Cutback week (week ${weekNumberInPhase} of this phase) — volume reduced ~22.5% regardless of compliance.`);
  }

  if (currentPhase.target_weekly_mileage_km && weeklyVolumeKm > currentPhase.target_weekly_mileage_km) {
    weeklyVolumeKm = currentPhase.target_weekly_mileage_km;
  }

  return distribution.map((d, index) => {
    const distanceKm = Math.round(weeklyVolumeKm * d.fraction * 10) / 10;
    const durationMin = Math.round(((distanceKm * paceSecPerKm) / 60) * 10) / 10;

    return {
      session_date: sessionDateFor(weekStartDate, d.dayOffset),
      session_type: "run",
      day_label: d.label,
      sequence_in_day: index + 1,
      planned_distance_km: distanceKm,
      planned_duration_min: durationMin,
      planned_pace_sec_per_km: paceSecPerKm,
      run_type: d.run_type,
      planned_exercises: null,
      is_injury_modified: false,
      modification_note: null,
      status: "planned",
    };
  });
}
