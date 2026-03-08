/**
 * Find Your Signal — Calibration Challenge Engine
 *
 * Guides new users through their first 10 sessions with
 * progressive milestone unlocks and adaptive insights.
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import { computeConfidence } from "./confidenceEngine";
import { computeTerpenePreferences, type TerpeneSignal } from "./terpenePreferences";
import { computeGenome, type GenomeDimension } from "./cannabisGenome";
import { normalizeOutcome } from "./sessionOutcome";

/* ── Types ───────────────────────────────────────────────────────── */

export interface Milestone {
  sessionTarget: number;
  key: "signal_started" | "early_signal" | "pattern_snapshot" | "profile_awakening" | "signal_established";
  label: string;
  reached: boolean;
}

export interface PatternSnapshotData {
  bestSession: { strain: string; outcome: string } | null;
  emergingTerpene: string | null;
}

export interface SignalReportCard {
  clarityScore: number;
  topTerpene: string | null;
  bestDoseWindow: string | null;
  emergingRiskTrigger: string | null;
  genomeDimensions: GenomeDimension[];
  confidenceLevel: string;
}

export type AdaptiveFocus = "single_product" | "multi_product";

export interface AdaptiveInsight {
  focus: AdaptiveFocus;
  tips: string[];
}

export interface ChallengeState {
  sessionsLogged: number;
  currentMilestone: Milestone | null;
  nextMilestone: Milestone | null;
  progressPercent: number;
  rewardUnlocked: Milestone | null;
  milestones: Milestone[];
  isActive: boolean;
  isComplete: boolean;
  /** Available at 5+ sessions */
  patternSnapshot: PatternSnapshotData | null;
  /** Available at 10 sessions */
  signalReport: SignalReportCard | null;
  adaptive: AdaptiveInsight;
}

/* ── Constants ───────────────────────────────────────────────────── */

const MILESTONE_DEFS: Omit<Milestone, "reached">[] = [
  { sessionTarget: 1,  key: "signal_started",      label: "Signal Started" },
  { sessionTarget: 3,  key: "early_signal",         label: "Early Signal" },
  { sessionTarget: 5,  key: "pattern_snapshot",     label: "Pattern Snapshot" },
  { sessionTarget: 7,  key: "profile_awakening",    label: "Profile Awakening" },
  { sessionTarget: 10, key: "signal_established",   label: "Signal Established" },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

function detectAdaptiveFocus(sessions: SessionLog[]): AdaptiveInsight {
  const strains = new Set(sessions.map(s => s.strain_name_text.toLowerCase()));

  if (strains.size <= 1) {
    return {
      focus: "single_product",
      tips: [
        "We're tracking your dose patterns over time.",
        "Time-of-day trends are forming from your sessions.",
        "Context signals like setting and mood are being analyzed.",
      ],
    };
  }

  return {
    focus: "multi_product",
    tips: [
      "Terpene differences between your products are emerging.",
      "Product comparisons will sharpen after a few more logs.",
      "Flavor and aroma correlations are being mapped.",
    ],
  };
}

function buildPatternSnapshot(sessions: SessionLog[]): PatternSnapshotData | null {
  if (sessions.length < 5) return null;

  // Best session = most positive outcome
  const positive = sessions.filter(s => normalizeOutcome(s.outcome) === "positive");
  const bestSession = positive.length > 0
    ? { strain: positive[0].strain_name_text, outcome: "positive" as const }
    : null;

  // Emerging terpene from preferences
  const prefs = computeTerpenePreferences(sessions);
  const emergingTerpene = prefs.preferred.length > 0 ? prefs.preferred[0].name : null;

  return { bestSession, emergingTerpene };
}

function buildSignalReport(sessions: SessionLog[]): SignalReportCard | null {
  if (sessions.length < 10) return null;

  const confidence = computeConfidence(sessions);
  const genome = computeGenome(sessions);
  const prefs = computeTerpenePreferences(sessions);

  // Clarity score (reuse confidence score 0-100)
  const clarityScore = confidence.confidenceScore;

  // Top terpene
  const topTerpene = prefs.preferred.length > 0 ? prefs.preferred[0].name : null;

  // Best dose window
  const doseCounts: Record<string, number> = {};
  const positiveDoses: Record<string, number> = {};
  for (const s of sessions) {
    const dose = s.dose_level || s.dose || "medium";
    doseCounts[dose] = (doseCounts[dose] || 0) + 1;
    if (normalizeOutcome(s.outcome) === "positive") {
      positiveDoses[dose] = (positiveDoses[dose] || 0) + 1;
    }
  }
  let bestDoseWindow: string | null = null;
  let bestRate = 0;
  for (const [dose, count] of Object.entries(doseCounts)) {
    const rate = (positiveDoses[dose] || 0) / count;
    if (rate > bestRate) {
      bestRate = rate;
      bestDoseWindow = dose;
    }
  }

  // Risk trigger — look for anxiety correlation
  const highAnxietySessions = sessions.filter(s => (s.effect_anxiety ?? 0) >= 7);
  let emergingRiskTrigger: string | null = null;
  if (highAnxietySessions.length >= 2) {
    const highDoseAnxiety = highAnxietySessions.filter(s => s.dose_level === "high");
    if (highDoseAnxiety.length > highAnxietySessions.length / 2) {
      emergingRiskTrigger = "High doses correlate with elevated anxiety";
    } else {
      emergingRiskTrigger = "Anxiety spikes detected in some sessions";
    }
  }

  return {
    clarityScore,
    topTerpene,
    bestDoseWindow,
    emergingRiskTrigger,
    genomeDimensions: genome?.dimensions ?? [],
    confidenceLevel: confidence.level,
  };
}

/* ── Main ────────────────────────────────────────────────────────── */

export function computeChallengeState(sessions: SessionLog[]): ChallengeState {
  const count = sessions.length;
  const progressPercent = Math.min(Math.round((count / 10) * 100), 100);
  const isComplete = count >= 10;

  const milestones: Milestone[] = MILESTONE_DEFS.map(m => ({
    ...m,
    reached: count >= m.sessionTarget,
  }));

  // Current = highest reached
  const reached = milestones.filter(m => m.reached);
  const currentMilestone = reached.length > 0 ? reached[reached.length - 1] : null;

  // Next = first not reached
  const nextMilestone = milestones.find(m => !m.reached) ?? null;

  // Reward = most recently unlocked (the current one if just crossed)
  const rewardUnlocked = currentMilestone;

  const adaptive = detectAdaptiveFocus(sessions);
  const patternSnapshot = buildPatternSnapshot(sessions);
  const signalReport = isComplete ? buildSignalReport(sessions) : null;

  return {
    sessionsLogged: count,
    currentMilestone,
    nextMilestone,
    progressPercent,
    rewardUnlocked,
    milestones,
    isActive: count >= 1 && !isComplete,
    isComplete,
    patternSnapshot,
    signalReport,
    adaptive,
  };
}
