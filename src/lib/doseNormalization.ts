import type { DoseLevel } from "@/hooks/useSessionLogs";

interface DoseInput {
  dose_level: DoseLevel;
  dose_unit?: string | null;
  dose_count?: number | null;
  dose_amount_mg?: number | null;
}

const LEVEL_BASELINE: Record<DoseLevel, number> = {
  low: 3,
  medium: 6,
  high: 8,
};

export function computeDoseNormalizedScore(input: DoseInput): number {
  let score = LEVEL_BASELINE[input.dose_level] ?? 6;

  if (input.dose_unit && input.dose_count != null && input.dose_count > 0) {
    const count = input.dose_count;

    switch (input.dose_unit) {
      case "hit":
      case "puff":
        score += Math.min(count * 0.8, 3);
        break;
      case "bowl":
        score += Math.min(count * 1.5, 4);
        break;
      case "dab":
        score += Math.min(count * 2.0, 5);
        break;
      case "mg":
        score += Math.min((input.dose_amount_mg ?? count) / 10, 5);
        break;
      case "g":
        score += Math.min(count * 3.0, 5);
        break;
      default:
        score += Math.min(count * 1.0, 3);
        break;
    }
  }

  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}
