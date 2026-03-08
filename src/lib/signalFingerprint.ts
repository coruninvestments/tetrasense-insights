/**
 * Signal Fingerprint — combines all Signal Leaf engines into one
 * unified personal cannabis identity artifact.
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import { computeConnoisseurProfile } from "./connoisseurProfile";
import { computeTerpenePreferences } from "./terpenePreferences";
import { computeCannabisGenome } from "./cannabisGenome";
import { computeConfidence } from "./confidenceEngine";
import { computeSignalStrength } from "./signalStrength";
import { computeTolerance } from "./toleranceEngine";

/* ── Types ───────────────────────────────────────────────────────── */

export interface FingerprintTerpene {
  name: string;
  score: number;
}

export interface FingerprintGenomeDim {
  label: string;
  value: number;
}

export interface SignalFingerprint {
  unlocked: boolean;
  stage: "locked" | "preview" | "full";
  effectIdentity: string;
  effectSubtitle: string;
  topTerpenes: FingerprintTerpene[];
  bestDoseRange: string;
  preferredMethod?: string;
  riskSignals: string[];
  genomeSummary: FingerprintGenomeDim[];
  clarityScore: number;
  confidenceLevel: string;
  signalStrengthLevel: string;
  sessionCount: number;
}

/* ── Method labels ───────────────────────────────────────────────── */

const METHOD_LABELS: Record<string, string> = {
  smoke: "Flower",
  vape: "Vape",
  edible: "Edible",
  tincture: "Tincture",
  topical: "Topical",
  other: "Other",
};

/* ── Clarity score (inline, matches ClarityScoreCard logic) ──────── */

function computeClarityScore(sessions: SessionLog[]): number {
  const n = sessions.length;
  if (n === 0) return 0;

  const positiveRate = sessions.filter((s) => s.outcome === "positive").length / n;
  const positiveScore = positiveRate * 35;

  // Dose consistency
  const doseLevels = sessions.map((s) => s.dose_level).filter(Boolean);
  const doseMode = doseLevels.length > 0
    ? doseLevels.sort((a, b) =>
        doseLevels.filter((v) => v === b).length - doseLevels.filter((v) => v === a).length
      )[0]
    : null;
  const doseConsistency = doseMode
    ? doseLevels.filter((d) => d === doseMode).length / doseLevels.length
    : 0;
  const doseScore = doseConsistency * 20;

  // Effect stability
  const effectKeys = ["effect_relaxation", "effect_focus", "effect_euphoria", "effect_sleepiness", "effect_pain_relief"] as const;
  let stabilitySum = 0;
  let stabilityCount = 0;
  for (const key of effectKeys) {
    const vals = sessions.map((s) => (s as any)[key] as number | null).filter((v): v is number => v != null);
    if (vals.length >= 2) {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
      stabilitySum += Math.max(0, 1 - cv);
      stabilityCount++;
    }
  }
  const stabilityScore = stabilityCount > 0 ? (stabilitySum / stabilityCount) * 25 : 0;

  const volumeScore = Math.min(n / 10, 1) * 20;

  return Math.round(positiveScore + doseScore + stabilityScore + volumeScore);
}

/* ── Best dose range ─────────────────────────────────────────────── */

function computeBestDose(sessions: SessionLog[]): string {
  const positive = sessions.filter((s) => s.outcome === "positive");
  if (positive.length < 2) return "Gathering data";

  const doseLevels = positive.map((s) => s.dose_level).filter(Boolean);
  if (doseLevels.length === 0) return "Varies";

  const counts: Record<string, number> = {};
  for (const d of doseLevels) counts[d!] = (counts[d!] || 0) + 1;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  const labelMap: Record<string, string> = {
    low: "Low dose",
    medium: "Moderate dose",
    high: "Higher dose",
  };

  // Check for mg data
  const mgValues = positive
    .filter((s) => s.dose_amount_mg != null && s.dose_amount_mg > 0)
    .map((s) => s.dose_amount_mg!);

  if (mgValues.length >= 3) {
    const sorted = [...mgValues].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.25)];
    const high = sorted[Math.floor(sorted.length * 0.75)];
    return `${low}–${high} mg`;
  }

  return labelMap[best[0]] || "Moderate dose";
}

/* ── Risk signals ────────────────────────────────────────────────── */

function computeRiskSignals(sessions: SessionLog[]): string[] {
  const risks: string[] = [];
  const n = sessions.length;
  if (n < 3) return risks;

  // High anxiety sessions
  const highAnxiety = sessions.filter((s) => (s.effect_anxiety ?? 0) >= 6);
  if (highAnxiety.length >= 2) {
    const pct = Math.round((highAnxiety.length / n) * 100);
    risks.push(`Elevated anxiety in ${pct}% of sessions`);
  }

  // Negative outcomes at high dose
  const highDoseNeg = sessions.filter(
    (s) => s.dose_level === "high" && s.outcome !== "positive"
  );
  if (highDoseNeg.length >= 2) {
    risks.push("Higher doses correlate with mixed outcomes");
  }

  // Physical discomfort
  const dryMouth = sessions.filter((s) => (s.effect_dry_mouth ?? 0) >= 5);
  if (dryMouth.length / n >= 0.4) {
    risks.push("Frequent dry mouth reported");
  }

  return risks.slice(0, 3);
}

/* ── Preferred method ────────────────────────────────────────────── */

function computePreferredMethod(sessions: SessionLog[]): string | undefined {
  if (sessions.length < 3) return undefined;
  const counts: Record<string, number> = {};
  for (const s of sessions) counts[s.method] = (counts[s.method] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return undefined;
  // Only return if dominant (>40%)
  if (sorted[0][1] / sessions.length >= 0.4) {
    return METHOD_LABELS[sorted[0][0]] || sorted[0][0];
  }
  return "Mixed";
}

/* ── Effect identity mapping ─────────────────────────────────────── */

function computeEffectIdentity(
  sessions: SessionLog[],
  profileName: string,
  topTerpenes: FingerprintTerpene[],
  bestDose: string,
): { name: string; subtitle: string } {
  // Map connoisseur profile archetypes to fingerprint identities
  const identityMap: Record<string, { name: string; subtitle: string }> = {
    "Focus Seeker": { name: "Focus Explorer", subtitle: "Clarity-first, precision-driven" },
    "Evening Relaxer": { name: "Evening Relaxer", subtitle: "Calm curator, wind-down specialist" },
    "Microdose Optimizer": { name: "Precision Microdoser", subtitle: "Less is more, dialed in" },
    "Flavor Hunter": { name: "Flavor-Driven Explorer", subtitle: "Variety-forward, sensory-led" },
    "Pain Manager": { name: "Comfort Seeker", subtitle: "Relief-oriented, intentional" },
    "Social Enhancer": { name: "Social Signal", subtitle: "Connection-driven, vibe-first" },
    "Creative Catalyst": { name: "Creative Balancer", subtitle: "Flow state architect" },
    "Balanced Explorer": { name: "Calm Signal", subtitle: "Versatile and data-curious" },
  };

  const mapped = identityMap[profileName];
  if (mapped) return mapped;

  // Fallback
  return { name: "Signal Explorer", subtitle: "Building your unique pattern" };
}

/* ── Main export ─────────────────────────────────────────────────── */

const PREVIEW_THRESHOLD = 5;
const FULL_THRESHOLD = 10;

export function computeSignalFingerprint(sessions: SessionLog[]): SignalFingerprint {
  const n = sessions.length;

  if (n < PREVIEW_THRESHOLD) {
    return {
      unlocked: false,
      stage: "locked",
      effectIdentity: "Fingerprint Forming",
      effectSubtitle: `${n}/${PREVIEW_THRESHOLD} sessions — keep logging`,
      topTerpenes: [],
      bestDoseRange: "Gathering data",
      riskSignals: [],
      genomeSummary: [],
      clarityScore: 0,
      confidenceLevel: "Low",
      signalStrengthLevel: "Early Signal",
      sessionCount: n,
    };
  }

  const stage = n >= FULL_THRESHOLD ? "full" : "preview";

  // Aggregate from existing engines
  const connoisseur = computeConnoisseurProfile(sessions);
  const terpenes = computeTerpenePreferences(sessions);
  const genome = computeCannabisGenome(sessions);
  const confidence = computeConfidence(sessions);
  const signal = computeSignalStrength(sessions);
  const clarity = computeClarityScore(sessions);
  const bestDose = computeBestDose(sessions);
  const method = computePreferredMethod(sessions);
  const risks = computeRiskSignals(sessions);

  const topTerpenes: FingerprintTerpene[] = terpenes.preferred
    .slice(0, stage === "full" ? 4 : 2)
    .map((t) => ({ name: t.name, score: t.score }));

  const genomeSummary: FingerprintGenomeDim[] = genome
    ? genome.dimensions
        .filter((d) => d.sampleSize > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, stage === "full" ? 6 : 3)
        .map((d) => ({ label: d.label, value: d.score }))
    : [];

  const { name: effectIdentity, subtitle: effectSubtitle } = computeEffectIdentity(
    sessions,
    connoisseur.profileName,
    topTerpenes,
    bestDose,
  );

  return {
    unlocked: true,
    stage,
    effectIdentity,
    effectSubtitle,
    topTerpenes,
    bestDoseRange: bestDose,
    preferredMethod: method,
    riskSignals: stage === "full" ? risks : risks.slice(0, 1),
    genomeSummary,
    clarityScore: clarity,
    confidenceLevel: confidence.level,
    signalStrengthLevel: signal.level,
    sessionCount: n,
  };
}
