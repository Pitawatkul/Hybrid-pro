// Fixed picklists — kept as literal lists (not free text) so injury -> exercise
// matching in the plan generation engine stays deterministic.

export const BODY_PARTS = [
  "knee",
  "ankle",
  "achilles",
  "calf",
  "shin",
  "hip",
  "hamstring",
  "groin",
  "lower_back",
  "shoulder",
  "elbow",
  "wrist",
  "foot",
  "hip_flexor",
  "neck",
  "other",
] as const;

export type BodyPart = (typeof BODY_PARTS)[number];

export const MOVEMENT_PATTERNS = ["squat", "hinge", "push", "pull", "carry", "core"] as const;

export function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
