import { planRunningWeek } from "./runningRules";
import { planLiftingWeek } from "./liftingRules";
import { applyInjuryModifications } from "./injuryRules";
import type { GeneratePlanInput, GeneratePlanOutput } from "./types";

export function generateWeeklyPlan(input: GeneratePlanInput): GeneratePlanOutput {
  const rationale: string[] = [];

  const runSessions = planRunningWeek(input, rationale);
  const liftSessions = planLiftingWeek(input, rationale);

  const { sessions, rationale: injuryRationale } = applyInjuryModifications(
    [...runSessions, ...liftSessions],
    input.activeInjuries,
    input.exerciseCatalog
  );

  return {
    plannedSessions: sessions,
    rationale: [...rationale, ...injuryRationale],
  };
}
