import type { EffectSliders } from "@/hooks/useSessionLogs";

/**
 * Centralized session outcome type - used across the entire app
 */
export type SessionOutcome = "positive" | "neutral" | "negative";

/**
 * Valid outcome values for validation
 */
export const VALID_OUTCOMES: readonly SessionOutcome[] = ["positive", "neutral", "negative"] as const;

/**
 * Type guard to check if a value is a valid SessionOutcome
 */
export function isValidOutcome(value: unknown): value is SessionOutcome {
  return typeof value === "string" && VALID_OUTCOMES.includes(value as SessionOutcome);
}

/**
 * Safely normalize an outcome value, falling back to "neutral" if invalid/missing
 */
export function normalizeOutcome(value: unknown): SessionOutcome {
  if (isValidOutcome(value)) {
    return value;
  }
  return "neutral";
}

/**
 * Compute session outcome based on effect slider values
 * 
 * Logic:
 * - High anxiety (≥7) → negative
 * - Positive effects (relaxation/sleepiness/focus/pain_relief ≥6) with low anxiety (≤5) → positive
 * - Otherwise → neutral
 */
export function computeSessionOutcome(effects: EffectSliders): SessionOutcome {
  const { sleepiness, relaxation, focus, pain_relief, anxiety } = effects;
  
  const hasHighAnxiety = anxiety >= 7;
  const hasPositiveEffect = relaxation >= 6 || sleepiness >= 6 || focus >= 6 || pain_relief >= 6;
  const hasLowAnxiety = anxiety <= 5;

  if (hasHighAnxiety) {
    return "negative";
  }
  
  if (hasPositiveEffect && hasLowAnxiety) {
    return "positive";
  }
  
  return "neutral";
}

/**
 * Alternative outcome computation for UI preview (slightly different weighting)
 * Uses a scoring approach that considers euphoria and weights anxiety more heavily
 */
export function computeSessionOutcomeForPreview(effects: EffectSliders): SessionOutcome {
  const positiveScore = effects.relaxation + effects.focus + effects.euphoria + effects.pain_relief;
  const negativeScore = effects.anxiety * 2; // Weight anxiety more heavily
  const neutralScore = effects.sleepiness;

  if (positiveScore > negativeScore + neutralScore) {
    return "positive";
  }
  
  if (negativeScore > positiveScore) {
    return "negative";
  }
  
  return "neutral";
}
