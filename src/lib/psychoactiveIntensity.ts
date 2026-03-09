/**
 * Signal Leaf Psychoactive Intensity Index (PII)
 *
 * A standardized 0–100 score estimating psychoactive impact of a cannabis session.
 * NOT medical precision — a pattern-based heuristic for consistent cross-method comparison.
 */

import type { DoseLevel } from "@/hooks/useSessionLogs";

// ── Label tiers ──────────────────────────────────────────────
export type IntensityLabel =
  | "Very Light"
  | "Light"
  | "Moderate"
  | "Strong"
  | "Very Strong"
  | "Extreme";

export type IntensityConfidence = "low" | "medium" | "high";

export interface IntensityResult {
  intensityScore: number; // 0-100
  intensityLabel: IntensityLabel;
  confidence: IntensityConfidence;
  reasoning: string[];
}

// ── Public label helper ─────────────────────────────────────
export function getIntensityLabel(score: number): IntensityLabel {
  if (score <= 10) return "Very Light";
  if (score <= 25) return "Light";
  if (score <= 45) return "Moderate";
  if (score <= 65) return "Strong";
  if (score <= 85) return "Very Strong";
  return "Extreme";
}

// ── Inputs ──────────────────────────────────────────────────
export interface IntensityInput {
  /** Consumption method — mapped from SessionMethod / QuickMethod */
  method: string;
  /** Already-computed 0-10 dose normalized score (from doseNormalization.ts) */
  doseNormalizedScore?: number | null;
  /** Raw dose level fallback */
  doseLevel?: DoseLevel | null;
  /** mg THC if available (strongest signal for edibles/drinks) */
  thcMg?: number | null;
  /** Dose unit (hit, puff, g, dab, mg, bowl, etc.) */
  doseUnit?: string | null;
  /** Dose count */
  doseCount?: number | null;
  /** Tolerance level 0-100 from tolerance engine (optional) */
  toleranceLevel?: number | null;
}

// ── Method bioavailability multipliers ──────────────────────
// Relative psychoactive efficiency vs. a reference oral dose.
const METHOD_MULTIPLIER: Record<string, number> = {
  smoke: 1.0,
  vape: 1.05,
  edible: 0.85, // slower onset but longer; weighted via THC mg path
  drink: 0.85,
  concentrate: 1.55,
  dab: 1.55,
  tincture: 0.75,
  topical: 0.15,
  other: 0.8,
};

// ── Dose level baselines (0-100 scale) ──────────────────────
const DOSE_LEVEL_BASE: Record<DoseLevel, number> = {
  low: 18,
  medium: 42,
  high: 68,
};

// ── Core computation ────────────────────────────────────────
export function computeIntensity(input: IntensityInput): IntensityResult {
  const reasoning: string[] = [];
  let confidence: IntensityConfidence = "low";
  let rawScore: number;

  const methodKey = normalizeMethod(input.method);
  const multiplier = METHOD_MULTIPLIER[methodKey] ?? 0.8;

  // ── Path 1: THC mg available (best for edibles/drinks/tinctures) ──
  if (input.thcMg != null && input.thcMg > 0) {
    rawScore = thcMgToIntensity(input.thcMg, methodKey);
    confidence = "high";
    reasoning.push(`${input.thcMg}mg THC via ${methodKey}`);
  }
  // ── Path 2: Dose normalized score available ──
  else if (input.doseNormalizedScore != null && input.doseNormalizedScore > 0) {
    // Map 0-10 normalized score to 0-100 intensity with method multiplier
    rawScore = (input.doseNormalizedScore / 10) * 72 * multiplier;
    confidence = "medium";
    reasoning.push(`Dose score ${input.doseNormalizedScore}/10, method: ${methodKey}`);

    // Boost confidence if we also have unit + count
    if (input.doseUnit && input.doseCount != null) {
      confidence = "high";
      reasoning.push(`${input.doseCount} ${input.doseUnit}(s)`);
    }
  }
  // ── Path 3: Dose level only (coarsest) ──
  else if (input.doseLevel) {
    rawScore = DOSE_LEVEL_BASE[input.doseLevel] * multiplier;
    reasoning.push(`${input.doseLevel} dose, method: ${methodKey}`);
  }
  // ── Path 4: Method only ──
  else {
    rawScore = 35 * multiplier; // assume medium-ish
    reasoning.push(`Method-only estimate: ${methodKey}`);
  }

  // ── Tolerance adjustment ──
  if (input.toleranceLevel != null && input.toleranceLevel > 0) {
    // Higher tolerance → lower perceived intensity
    // At tolerance 100, reduce perceived intensity by ~35%
    const toleranceDamping = 1 - (input.toleranceLevel / 100) * 0.35;
    rawScore *= toleranceDamping;
    reasoning.push(`Tolerance adjustment (level ${input.toleranceLevel})`);
  }

  // Clamp
  const intensityScore = Math.round(Math.min(100, Math.max(0, rawScore)));

  return {
    intensityScore,
    intensityLabel: getIntensityLabel(intensityScore),
    confidence,
    reasoning,
  };
}

// ── THC mg → intensity (method-aware) ───────────────────────
function thcMgToIntensity(mg: number, method: string): number {
  // Edible/drink: direct mg mapping with diminishing returns
  if (method === "edible" || method === "drink") {
    // 2.5mg → ~12, 5mg → ~22, 10mg → ~38, 20mg → ~58, 50mg → ~82, 100mg → ~95
    return Math.min(100, 8 + 28 * Math.log2(Math.max(1, mg / 2.5) + 1));
  }

  // Inhalation methods: THC mg is approximate, scale differently
  const mult = METHOD_MULTIPLIER[method] ?? 1.0;
  // Assume each mg inhaled ≈ higher efficiency
  return Math.min(100, 10 + 35 * Math.log2(Math.max(1, mg / 3) + 1) * mult);
}

// ── Method normalization ────────────────────────────────────
function normalizeMethod(method: string): string {
  const m = method.toLowerCase().trim();
  if (m === "flower") return "smoke";
  if (m === "dab") return "concentrate";
  return m;
}

// ── Convenience: compute from a session row shape ───────────
export function intensityFromSession(session: {
  method: string;
  dose_level?: string | null;
  dose_normalized_score?: number | null;
  dose_amount_mg?: number | null;
  dose_unit?: string | null;
  dose_count?: number | null;
}): IntensityResult {
  return computeIntensity({
    method: session.method,
    doseLevel: (session.dose_level as DoseLevel) ?? null,
    doseNormalizedScore: session.dose_normalized_score ?? null,
    thcMg: session.dose_amount_mg ?? null,
    doseUnit: session.dose_unit ?? null,
    doseCount: session.dose_count ?? null,
  });
}
