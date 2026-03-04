import type { SessionLog } from "@/hooks/useSessionLogs";

/* ── Types ───────────────────────────────────────────────────────── */

export type ConfidenceLevel = "Low" | "Medium" | "High";

export interface ConfidenceUnlock {
  key: string;
  label: string;
  required: number;
  current: number;
}

export interface ConfidenceResult {
  confidenceScore: number;
  level: ConfidenceLevel;
  reasons: string[];
  nextSteps: string[];
  unlocks: ConfidenceUnlock[];
}

/* ── Scoring helpers ─────────────────────────────────────────────── */

function scoreVolume(n: number): number {
  if (n >= 20) return 45;
  if (n >= 10) return 40;
  if (n >= 5) return 30;
  if (n >= 3) return 20;
  if (n >= 1) return 10;
  return 0;
}

function scoreConsistency(sessions: SessionLog[]): number {
  if (sessions.length < 2) return 0;
  const intentCounts: Record<string, number> = {};
  for (const s of sessions) {
    intentCounts[s.intent] = (intentCounts[s.intent] || 0) + 1;
  }
  const sorted = Object.values(intentCounts).sort((a, b) => b - a);
  const top2 = (sorted[0] || 0) + (sorted[1] || 0);
  const ratio = top2 / sessions.length;
  // ratio 1.0 = 25pts, 0.5 = ~12, lower = less
  return Math.round(ratio * 25);
}

function scoreCoverage(sessions: SessionLog[]): number {
  const intents = new Set(sessions.map(s => s.intent));
  const methods = new Set(sessions.map(s => s.method));
  const intentPts = Math.min(intents.size, 5) * 2.5; // max 12.5
  const methodPts = Math.min(methods.size, 3) * 2.5;  // max 7.5
  return Math.round(intentPts + methodPts);
}

function scoreRecency(sessions: SessionLog[]): number {
  if (sessions.length === 0) return 0;
  const latest = new Date(sessions[0].created_at); // sessions are desc-sorted
  const daysSince = (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7) return 10;
  if (daysSince <= 14) return 6;
  if (daysSince <= 30) return 3;
  return 0;
}

function getLevel(score: number): ConfidenceLevel {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

/* ── Reasons & next-steps ────────────────────────────────────────── */

function buildReasons(n: number, consistency: number, coverage: number, recency: number): string[] {
  const reasons: string[] = [];
  if (n === 0) {
    reasons.push("No sessions logged yet.");
  } else {
    if (n < 5) reasons.push(`Based on ${n} session${n > 1 ? "s" : ""} — more data strengthens patterns.`);
    else if (n < 10) reasons.push(`${n} sessions provide a growing signal.`);
    else reasons.push(`${n} sessions give a strong data foundation.`);

    if (consistency >= 20) reasons.push("Your usage patterns are consistent.");
    else if (n >= 3) reasons.push("Your intents vary — more overlap helps identify patterns.");

    if (recency <= 3 && n > 0) reasons.push("No recent activity — patterns may be outdated.");
  }
  return reasons;
}

function buildNextSteps(n: number, level: ConfidenceLevel, recency: number): string[] {
  const steps: string[] = [];
  if (n === 0) {
    steps.push("Log your first session to begin building your profile.");
    return steps;
  }
  if (level !== "High") {
    steps.push("Log another session to strengthen your patterns.");
  }
  if (n < 5) {
    steps.push("Try logging with different intents to broaden coverage.");
  }
  if (recency <= 3) {
    steps.push("Log a recent session to keep your data current.");
  }
  if (level === "High") {
    steps.push("Explore your strongest patterns in Insights.");
  }
  return steps.slice(0, 2);
}

/* ── Milestones ──────────────────────────────────────────────────── */

const MILESTONES = [
  { key: "decision_insights", label: "Decision Insights unlock", required: 3 },
  { key: "dose_sweet_spot", label: "Dose Sweet Spot unlock", required: 5 },
  { key: "high_confidence", label: "High confidence patterns", required: 10 },
] as const;

function buildUnlocks(n: number): ConfidenceUnlock[] {
  return MILESTONES.map(m => ({
    key: m.key,
    label: m.label,
    required: m.required,
    current: Math.min(n, m.required),
  }));
}

/* ── Main export ─────────────────────────────────────────────────── */

export function computeConfidence(sessions: SessionLog[]): ConfidenceResult {
  const n = sessions.length;
  const vol = scoreVolume(n);
  const con = scoreConsistency(sessions);
  const cov = scoreCoverage(sessions);
  const rec = scoreRecency(sessions);
  const raw = Math.min(100, vol + con + cov + rec);
  const level = getLevel(raw);

  return {
    confidenceScore: raw,
    level,
    reasons: buildReasons(n, con, cov, rec),
    nextSteps: buildNextSteps(n, level, rec),
    unlocks: buildUnlocks(n),
  };
}
