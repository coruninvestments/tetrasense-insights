/**
 * Signal Leaf Personal Signal Match Engine (V1)
 *
 * Scores how well a product's verified batch chemistry aligns
 * with a user's historical preferences and outcomes.
 *
 * Score components:
 *   Terpene match       0–40
 *   Cannabinoid match   0–20
 *   Intensity alignment 0–20
 *   Outcome reinforcement 0–10
 *   Risk penalty        -10
 *   ─────────────────────────
 *   Total               0–100
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import type { BatchTerpene, BatchCannabinoid, ProductBatch } from "@/hooks/useProductChemistry";
import { computeTerpenePreferences, type TerpeneSignal } from "@/lib/terpenePreferences";

/* ── Types ───────────────────────────────────────────────────── */

export type MatchConfidence = "low" | "medium" | "high";

export interface MatchBreakdown {
  terpeneScore: number;       // 0–40
  cannabinoidScore: number;   // 0–20
  intensityScore: number;     // 0–20
  outcomeScore: number;       // 0–10
  riskPenalty: number;        // 0 to -10
}

export interface SignalMatchResult {
  score: number;              // 0–100
  confidence: MatchConfidence;
  breakdown: MatchBreakdown;
  reasons: string[];
  ready: boolean;             // false if < 5 sessions
}

const MIN_SESSIONS = 5;

/* ── Helpers ─────────────────────────────────────────────────── */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getConfidence(n: number): MatchConfidence {
  if (n < 8) return "low";
  if (n < 15) return "medium";
  return "high";
}

/* ── 1. Terpene match (0–40) ─────────────────────────────────── */

function scoreTerpeneMatch(
  preferredTerpenes: TerpeneSignal[],
  batchTerpenes: BatchTerpene[]
): { score: number; reasons: string[] } {
  if (preferredTerpenes.length === 0 || batchTerpenes.length === 0) {
    return { score: 0, reasons: [] };
  }

  const batchTerpNameSet = new Set(
    batchTerpenes.map(bt => (bt.terpene_name ?? "").toLowerCase())
  );

  let totalWeight = 0;
  let matchWeight = 0;
  const matchedNames: string[] = [];

  for (let i = 0; i < preferredTerpenes.length; i++) {
    const pref = preferredTerpenes[i];
    const weight = pref.score / 100; // 0-1
    totalWeight += weight;
    if (batchTerpNameSet.has(pref.name.toLowerCase())) {
      matchWeight += weight;
      matchedNames.push(pref.name);
    }
  }

  const ratio = totalWeight > 0 ? matchWeight / totalWeight : 0;
  const score = Math.round(ratio * 40);
  const reasons: string[] = [];
  if (matchedNames.length > 0) {
    reasons.push(`Terpene match: ${matchedNames.slice(0, 3).join(", ")}`);
  }

  return { score, reasons };
}

/* ── 2. Cannabinoid match (0–20) ─────────────────────────────── */

function scoreCannabinoidMatch(
  sessions: SessionLog[],
  batch: ProductBatch,
  batchCannabinoids: BatchCannabinoid[]
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const batchThc = batch.total_thc_percent;
  const batchCbd = batch.total_cbd_percent;

  if (batchThc == null && batchCbd == null) return { score: 0, reasons: [] };

  // Compute user's average positive-outcome THC from dose_amount_mg
  const positiveSessions = sessions.filter(s => s.outcome === "positive");
  if (positiveSessions.length < 3) return { score: 10, reasons: ["Limited cannabinoid data"] };

  // Check if user tends to do well with high/low THC
  const avgIntensity = positiveSessions.reduce(
    (sum, s) => sum + (s.intensity_score ?? 50), 0
  ) / positiveSessions.length;

  let score = 10; // base

  if (batchThc != null) {
    // High THC product + user prefers high intensity → bonus
    if (batchThc >= 25 && avgIntensity >= 60) {
      score += 5;
      reasons.push("THC level aligns with your intensity preference");
    } else if (batchThc < 18 && avgIntensity < 40) {
      score += 5;
      reasons.push("Moderate THC matches your sensitivity profile");
    } else if (Math.abs((batchThc / 30 * 100) - avgIntensity) < 25) {
      score += 3;
    }
  }

  if (batchCbd != null && batchCbd >= 2) {
    // Check if user's anxiety scores are typically high → CBD helpful
    const avgAnxiety = sessions.reduce(
      (sum, s) => sum + (s.effect_anxiety ?? 0), 0
    ) / sessions.length;
    if (avgAnxiety >= 4) {
      score += 5;
      reasons.push("CBD content may help with anxiety patterns");
    } else {
      score += 2;
    }
  }

  return { score: clamp(score, 0, 20), reasons };
}

/* ── 3. Intensity alignment (0–20) ───────────────────────────── */

function scoreIntensityMatch(
  sessions: SessionLog[],
  batch: ProductBatch
): { score: number; reasons: string[] } {
  const batchIntensity = batch.intensity_hint_score;
  if (batchIntensity == null) return { score: 10, reasons: [] };

  const intensities = sessions
    .map(s => s.intensity_score)
    .filter((v): v is number => v != null && v > 0);

  if (intensities.length < 3) return { score: 10, reasons: ["Limited intensity data"] };

  // User's preferred intensity range
  const sorted = [...intensities].sort((a, b) => a - b);
  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const p75 = sorted[Math.floor(sorted.length * 0.75)];
  const median = sorted[Math.floor(sorted.length * 0.5)];

  const reasons: string[] = [];
  let score = 0;

  if (batchIntensity >= p25 && batchIntensity <= p75) {
    score = 20;
    reasons.push("Intensity is in your preferred range");
  } else {
    const distance = Math.min(
      Math.abs(batchIntensity - p25),
      Math.abs(batchIntensity - p75)
    );
    score = Math.round(20 * Math.max(0, 1 - distance / 50));
    if (batchIntensity > p75) {
      reasons.push("Intensity may be higher than your usual preference");
    } else {
      reasons.push("Intensity is milder than your usual preference");
    }
  }

  return { score: clamp(score, 0, 20), reasons };
}

/* ── 4. Outcome reinforcement (0–10) ─────────────────────────── */

function scoreOutcomeReinforcement(
  sessions: SessionLog[],
  batchTerpenes: BatchTerpene[]
): { score: number; reasons: string[] } {
  if (batchTerpenes.length === 0) return { score: 0, reasons: [] };

  const batchTerpNames = new Set(
    batchTerpenes.map(bt => (bt.terpene_name ?? "").toLowerCase())
  );

  // Find sessions that share terpene-associated aromas/flavors
  // and check their outcome rate
  const positiveSessions = sessions.filter(s => s.outcome === "positive");
  const totalSessions = sessions.length;
  const positiveRate = totalSessions > 0 ? positiveSessions.length / totalSessions : 0.5;

  // Simple: if user has high positive rate overall, score higher
  const score = Math.round(positiveRate * 10);
  const reasons: string[] = [];
  if (positiveRate >= 0.7) {
    reasons.push("Strong positive outcome history");
  }

  return { score: clamp(score, 0, 10), reasons };
}

/* ── 5. Risk penalty (0 to -10) ──────────────────────────────── */

function scoreRiskPenalty(
  sessions: SessionLog[],
  batchTerpenes: BatchTerpene[],
  batch: ProductBatch
): { penalty: number; reasons: string[] } {
  const reasons: string[] = [];
  let penalty = 0;

  // Check anxiety trigger pattern
  const highAnxietySessions = sessions.filter(s => (s.effect_anxiety ?? 0) >= 7);
  const anxietyRate = sessions.length > 0 ? highAnxietySessions.length / sessions.length : 0;

  if (anxietyRate >= 0.3 && (batch.total_thc_percent ?? 0) >= 25) {
    penalty -= 7;
    reasons.push("High THC may trigger anxiety based on your patterns");
  }

  // Check for negative outcome pattern with high intensity
  const negativeSessions = sessions.filter(s => s.outcome === "negative");
  const negativeRate = sessions.length > 0 ? negativeSessions.length / sessions.length : 0;

  if (negativeRate >= 0.4 && (batch.intensity_hint_score ?? 0) >= 70) {
    penalty -= 5;
    reasons.push("High-intensity products have mixed results for you");
  }

  return { penalty: clamp(penalty, -10, 0), reasons };
}

/* ── Main export ─────────────────────────────────────────────── */

export function computeSignalMatch(
  sessions: SessionLog[],
  batch: ProductBatch,
  batchTerpenes: BatchTerpene[],
  batchCannabinoids: BatchCannabinoid[]
): SignalMatchResult {
  const n = sessions.length;

  if (n < MIN_SESSIONS) {
    return {
      score: 0,
      confidence: "low",
      breakdown: { terpeneScore: 0, cannabinoidScore: 0, intensityScore: 0, outcomeScore: 0, riskPenalty: 0 },
      reasons: [`Need at least ${MIN_SESSIONS} sessions to generate a match score`],
      ready: false,
    };
  }

  // Get terpene preferences
  const terpPrefs = computeTerpenePreferences(sessions);
  const preferredTerpenes = terpPrefs.preferred;

  // Score each component
  const terpene = scoreTerpeneMatch(preferredTerpenes, batchTerpenes);
  const cannabinoid = scoreCannabinoidMatch(sessions, batch, batchCannabinoids);
  const intensity = scoreIntensityMatch(sessions, batch);
  const outcome = scoreOutcomeReinforcement(sessions, batchTerpenes);
  const risk = scoreRiskPenalty(sessions, batchTerpenes, batch);

  const rawScore =
    terpene.score +
    cannabinoid.score +
    intensity.score +
    outcome.score +
    risk.penalty;

  const finalScore = clamp(Math.round(rawScore), 0, 100);
  const confidence = getConfidence(n);

  const reasons = [
    ...terpene.reasons,
    ...cannabinoid.reasons,
    ...intensity.reasons,
    ...outcome.reasons,
    ...risk.reasons,
  ];

  return {
    score: finalScore,
    confidence,
    breakdown: {
      terpeneScore: terpene.score,
      cannabinoidScore: cannabinoid.score,
      intensityScore: intensity.score,
      outcomeScore: outcome.score,
      riskPenalty: risk.penalty,
    },
    reasons,
    ready: true,
  };
}

/* ── Score label helper ──────────────────────────────────────── */

export function getMatchLabel(score: number): string {
  if (score >= 80) return "Excellent match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Fair match";
  if (score >= 20) return "Weak match";
  return "Low match";
}

export function getMatchColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-warning";
  return "text-muted-foreground";
}

export function getMatchBgColor(score: number): string {
  if (score >= 80) return "bg-success/15";
  if (score >= 60) return "bg-primary/15";
  if (score >= 40) return "bg-warning/15";
  return "bg-muted";
}
