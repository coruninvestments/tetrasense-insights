/**
 * Signal Card — budtender-friendly personal summary card
 * combining fingerprint, profile, terpene, and confidence data.
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import { computeSignalFingerprint } from "./signalFingerprint";
import { computeConnoisseurProfile } from "./connoisseurProfile";
import { computeTerpenePreferences } from "./terpenePreferences";

/* ── Types ───────────────────────────────────────────────────────── */

export interface SignalCardMatch {
  label: string;
  matchScore: number;
}

export interface SignalCardData {
  unlocked: boolean;
  stage: "locked" | "preview" | "full";
  profileName: string;
  clarityScore: number;
  confidenceLabel: string;
  signalStrengthLabel: string;
  bestDoseRange: string;
  preferredMethod?: string;
  topTerpenes: Array<{ name: string; score: number }>;
  watchouts: string[];
  topMatches: SignalCardMatch[];
  sessionsLogged: number;
}

/* ── Match archetypes ────────────────────────────────────────────── */

interface MatchArchetype {
  label: string;
  score: (ctx: MatchContext) => number;
}

interface MatchContext {
  topTerpenes: string[];
  effectIdentity: string;
  bestDose: string;
  preferredMethod?: string;
  riskSignals: string[];
  topIntent: string;
  eveningRate: number;
  positiveRate: number;
}

const MATCH_ARCHETYPES: MatchArchetype[] = [
  {
    label: "Citrus Daytime",
    score: (c) => {
      let s = 0;
      if (c.topTerpenes.includes("Limonene")) s += 35;
      if (c.topTerpenes.includes("Pinene")) s += 15;
      if (c.effectIdentity.toLowerCase().includes("focus")) s += 20;
      if (c.eveningRate < 0.4) s += 15;
      if (c.positiveRate >= 0.5) s += 15;
      return Math.min(s, 95);
    },
  },
  {
    label: "Balanced Hybrid",
    score: (c) => {
      let s = 30; // baseline
      if (c.effectIdentity.toLowerCase().includes("balanced") || c.effectIdentity.toLowerCase().includes("explorer")) s += 25;
      if (c.bestDose.toLowerCase().includes("moderate") || c.bestDose.toLowerCase().includes("medium")) s += 15;
      if (c.topTerpenes.length >= 2) s += 15;
      if (c.positiveRate >= 0.5) s += 10;
      return Math.min(s, 95);
    },
  },
  {
    label: "Calm Evening",
    score: (c) => {
      let s = 0;
      if (c.topTerpenes.includes("Myrcene") || c.topTerpenes.includes("Linalool")) s += 30;
      if (c.eveningRate >= 0.4) s += 25;
      if (c.effectIdentity.toLowerCase().includes("relax") || c.effectIdentity.toLowerCase().includes("evening")) s += 20;
      if (c.topIntent === "relaxation" || c.topIntent === "sleep") s += 15;
      if (c.positiveRate >= 0.5) s += 10;
      return Math.min(s, 95);
    },
  },
  {
    label: "Precision Microdose",
    score: (c) => {
      let s = 0;
      if (c.bestDose.toLowerCase().includes("low")) s += 35;
      if (c.effectIdentity.toLowerCase().includes("micro")) s += 25;
      if (c.positiveRate >= 0.6) s += 20;
      if (c.bestDose.match(/\d+.*mg/) && parseFloat(c.bestDose) <= 5) s += 15;
      return Math.min(s, 95);
    },
  },
  {
    label: "Flavor Forward Focus",
    score: (c) => {
      let s = 0;
      if (c.topTerpenes.includes("Terpinolene") || c.topTerpenes.includes("Ocimene")) s += 25;
      if (c.topTerpenes.length >= 3) s += 20;
      if (c.effectIdentity.toLowerCase().includes("flavor") || c.effectIdentity.toLowerCase().includes("creative")) s += 20;
      if (c.positiveRate >= 0.5) s += 15;
      if (c.eveningRate < 0.5) s += 10;
      return Math.min(s, 95);
    },
  },
  {
    label: "Comfort & Relief",
    score: (c) => {
      let s = 0;
      if (c.topIntent === "pain_relief") s += 35;
      if (c.topTerpenes.includes("Caryophyllene") || c.topTerpenes.includes("Humulene")) s += 25;
      if (c.effectIdentity.toLowerCase().includes("comfort") || c.effectIdentity.toLowerCase().includes("pain")) s += 20;
      if (c.positiveRate >= 0.5) s += 15;
      return Math.min(s, 95);
    },
  },
  {
    label: "Social Uplift",
    score: (c) => {
      let s = 0;
      if (c.topIntent === "social" || c.topIntent === "recreation") s += 30;
      if (c.effectIdentity.toLowerCase().includes("social")) s += 25;
      if (c.topTerpenes.includes("Limonene") || c.topTerpenes.includes("Terpinolene")) s += 20;
      if (c.positiveRate >= 0.5) s += 15;
      return Math.min(s, 95);
    },
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */

function getTopIntent(sessions: SessionLog[]): string {
  const counts: Record<string, number> = {};
  for (const s of sessions) counts[s.intent] = (counts[s.intent] || 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "recreation";
}

function getEveningRate(sessions: SessionLog[]): number {
  if (sessions.length === 0) return 0;
  const evening = sessions.filter((s) => s.time_of_day === "evening" || s.time_of_day === "night");
  return evening.length / sessions.length;
}

function getPositiveRate(sessions: SessionLog[]): number {
  if (sessions.length === 0) return 0;
  return sessions.filter((s) => s.outcome === "positive").length / sessions.length;
}

/* ── Main export ─────────────────────────────────────────────────── */

const PREVIEW_THRESHOLD = 5;
const FULL_THRESHOLD = 10;

export function computeSignalCard(sessions: SessionLog[]): SignalCardData {
  const n = sessions.length;

  if (n < PREVIEW_THRESHOLD) {
    return {
      unlocked: false,
      stage: "locked",
      profileName: "Signal Card Forming",
      clarityScore: 0,
      confidenceLabel: "Low",
      signalStrengthLabel: "Early Signal",
      bestDoseRange: "Gathering data",
      topTerpenes: [],
      watchouts: [],
      topMatches: [],
      sessionsLogged: n,
    };
  }

  const stage = n >= FULL_THRESHOLD ? "full" : "preview";
  const fingerprint = computeSignalFingerprint(sessions);
  const profile = computeConnoisseurProfile(sessions);
  const terpenes = computeTerpenePreferences(sessions);

  // Build watchouts from fingerprint risks + terpene warnings
  const watchouts: string[] = [...fingerprint.riskSignals];
  for (const w of terpenes.warnings) {
    if (!watchouts.includes(w.description)) {
      watchouts.push(w.description);
    }
  }

  // Build match context
  const topTerpeneNames = fingerprint.topTerpenes.map((t) => t.name);
  const matchCtx: MatchContext = {
    topTerpenes: topTerpeneNames,
    effectIdentity: fingerprint.effectIdentity,
    bestDose: fingerprint.bestDoseRange,
    preferredMethod: fingerprint.preferredMethod,
    riskSignals: fingerprint.riskSignals,
    topIntent: getTopIntent(sessions),
    eveningRate: getEveningRate(sessions),
    positiveRate: getPositiveRate(sessions),
  };

  // Score all match archetypes and pick top 3
  const scoredMatches = MATCH_ARCHETYPES.map((m) => ({
    label: m.label,
    matchScore: m.score(matchCtx),
  }))
    .filter((m) => m.matchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return {
    unlocked: true,
    stage,
    profileName: profile.profileName,
    clarityScore: fingerprint.clarityScore,
    confidenceLabel: fingerprint.confidenceLevel,
    signalStrengthLabel: fingerprint.signalStrengthLevel,
    bestDoseRange: fingerprint.bestDoseRange,
    preferredMethod: fingerprint.preferredMethod,
    topTerpenes: fingerprint.topTerpenes,
    watchouts: stage === "full" ? watchouts.slice(0, 3) : watchouts.slice(0, 1),
    topMatches: scoredMatches,
    sessionsLogged: n,
  };
}
