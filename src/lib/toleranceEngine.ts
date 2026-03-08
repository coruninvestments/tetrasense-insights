import type { SessionLog } from "@/hooks/useSessionLogs";

export type ToleranceLevel = "Very Sensitive" | "Moderate" | "Established" | "High" | "Very High";
export type ToleranceTrend = "rising" | "stable" | "falling";

export interface ToleranceResult {
  toleranceScore: number;
  level: ToleranceLevel;
  trend: ToleranceTrend;
  trendDelta: number;
  recoveryEstimate?: string;
  reasons: string[];
  suggestions: string[];
  weeklySnapshots: { week: string; score: number }[];
  ready: boolean;
}

const LEVEL_RANGES: { max: number; label: ToleranceLevel }[] = [
  { max: 20, label: "Very Sensitive" },
  { max: 40, label: "Moderate" },
  { max: 60, label: "Established" },
  { max: 80, label: "High" },
  { max: 100, label: "Very High" },
];

function getLevel(score: number): ToleranceLevel {
  for (const r of LEVEL_RANGES) {
    if (score <= r.max) return r.label;
  }
  return "Very High";
}

/** Estimate standardized THC exposure for one session */
function estimateExposure(session: SessionLog): number {
  // If dose_normalized_score exists, use it as primary signal (0-10 scale)
  if (session.dose_normalized_score != null && session.dose_normalized_score > 0) {
    return session.dose_normalized_score;
  }

  // Fallback: use dose_amount_mg if available (edible direct mg)
  if (session.dose_amount_mg != null && session.dose_amount_mg > 0) {
    return Math.min(session.dose_amount_mg / 10, 10);
  }

  // Fallback: use dose_level
  const levelMap: Record<string, number> = { low: 3, medium: 6, high: 8 };
  return levelMap[session.dose_level ?? ""] ?? 5;
}

/** Average positive effect magnitude for a session */
function avgPositiveEffects(s: SessionLog): number {
  const vals = [
    s.effect_relaxation,
    s.effect_focus,
    s.effect_euphoria,
    s.effect_pain_relief,
    s.effect_sleepiness,
  ].filter((v): v is number => v != null && v > 0);
  if (vals.length === 0) return 5;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function weekKey(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  return start.toISOString().slice(0, 10);
}

export function computeTolerance(sessions: SessionLog[]): ToleranceResult {
  const MIN_SESSIONS = 3;

  if (!sessions || sessions.length < MIN_SESSIONS) {
    return {
      toleranceScore: 0,
      level: "Very Sensitive",
      trend: "stable",
      trendDelta: 0,
      reasons: [],
      suggestions: [],
      weeklySnapshots: [],
      ready: false,
    };
  }

  // Sort oldest first
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const now = new Date();

  // ── 1. Weekly exposure score (0-35 pts) ──
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentSessions = sorted.filter(s => new Date(s.created_at) >= fourWeeksAgo);
  const totalExposure = recentSessions.reduce((sum, s) => sum + estimateExposure(s), 0);
  // Normalize: ~40 total exposure in 4 weeks = moderate baseline
  const exposureScore = Math.min(35, (totalExposure / 50) * 35);

  // ── 2. Session frequency factor (0-25 pts) ──
  const weeksActive = Math.max(1, daysBetween(new Date(sorted[0].created_at), now) / 7);
  const sessionsPerWeek = sessions.length / weeksActive;
  // 7+ sessions/week = max
  const frequencyScore = Math.min(25, (sessionsPerWeek / 7) * 25);

  // ── 3. Effect attenuation factor (0-25 pts) ──
  // Compare effect strength at similar doses between older and newer halves
  const midIdx = Math.floor(sorted.length / 2);
  const olderHalf = sorted.slice(0, midIdx);
  const newerHalf = sorted.slice(midIdx);

  const avgOlderEffects = olderHalf.reduce((s, sess) => s + avgPositiveEffects(sess), 0) / olderHalf.length;
  const avgNewerEffects = newerHalf.reduce((s, sess) => s + avgPositiveEffects(sess), 0) / newerHalf.length;
  const avgOlderDose = olderHalf.reduce((s, sess) => s + estimateExposure(sess), 0) / olderHalf.length;
  const avgNewerDose = newerHalf.reduce((s, sess) => s + estimateExposure(sess), 0) / newerHalf.length;

  // If dose went up but effects stayed same or dropped → attenuation
  let attenuationScore = 0;
  if (avgNewerDose >= avgOlderDose && avgNewerEffects <= avgOlderEffects) {
    const doseDelta = avgNewerDose - avgOlderDose;
    const effectDelta = avgOlderEffects - avgNewerEffects;
    attenuationScore = Math.min(25, (doseDelta + effectDelta) * 4);
  } else if (avgNewerDose > avgOlderDose * 1.2) {
    // Dose increased significantly regardless
    attenuationScore = Math.min(15, ((avgNewerDose / avgOlderDose) - 1) * 20);
  }

  // ── 4. Recovery factor (0 to -15 pts) ──
  const lastSession = new Date(sorted[sorted.length - 1].created_at);
  const daysSinceLast = daysBetween(lastSession, now);
  let recoveryReduction = 0;
  if (daysSinceLast >= 2) {
    recoveryReduction = Math.min(15, daysSinceLast * 1.5);
  }

  // ── Combine ──
  const rawScore = exposureScore + frequencyScore + attenuationScore - recoveryReduction;
  const toleranceScore = Math.round(Math.max(0, Math.min(100, rawScore)));
  const level = getLevel(toleranceScore);

  // ── Trend (compare last 2 weeks vs 2 weeks before) ──
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentTwo = sorted.filter(s => new Date(s.created_at) >= twoWeeksAgo);
  const priorTwo = sorted.filter(s => {
    const d = new Date(s.created_at);
    return d >= fourWeeksAgo && d < twoWeeksAgo;
  });

  let trend: ToleranceTrend = "stable";
  let trendDelta = 0;

  if (recentTwo.length > 0 && priorTwo.length > 0) {
    const recentAvgExposure = recentTwo.reduce((s, sess) => s + estimateExposure(sess), 0) / recentTwo.length;
    const priorAvgExposure = priorTwo.reduce((s, sess) => s + estimateExposure(sess), 0) / priorTwo.length;
    const recentFreq = recentTwo.length / 2;
    const priorFreq = priorTwo.length / 2;

    const recentSignal = recentAvgExposure * recentFreq;
    const priorSignal = priorAvgExposure * priorFreq;

    if (priorSignal > 0) {
      trendDelta = Math.round(((recentSignal - priorSignal) / priorSignal) * 100);
      if (trendDelta > 10) trend = "rising";
      else if (trendDelta < -10) trend = "falling";
    }
  }

  // ── Recovery estimate ──
  let recoveryEstimate: string | undefined;
  if (toleranceScore >= 40 && sessions.length >= 5) {
    if (toleranceScore >= 70) {
      recoveryEstimate = "A 7-day break may significantly reduce tolerance";
    } else if (toleranceScore >= 50) {
      recoveryEstimate = "3–5 days of rest may improve sensitivity";
    } else {
      recoveryEstimate = "2–4 days may improve sensitivity";
    }
  }

  // ── Reasons ──
  const reasons: string[] = [];
  if (sessionsPerWeek >= 5) reasons.push("High session frequency in recent weeks");
  else if (sessionsPerWeek >= 3) reasons.push("Moderate session frequency");
  else reasons.push("Lower session frequency supports sensitivity");

  if (attenuationScore > 10) reasons.push("Effect response appears to be decreasing at similar doses");
  if (totalExposure > 30) reasons.push("Cumulative exposure is elevated over the past 4 weeks");
  if (daysSinceLast >= 3) reasons.push(`${Math.round(daysSinceLast)}-day gap since last session supports recovery`);

  // ── Suggestions ──
  const suggestions: string[] = [];
  if (toleranceScore >= 60) {
    suggestions.push("Consider spacing sessions further apart to maintain sensitivity");
  }
  if (toleranceScore >= 40 && toleranceScore < 60) {
    suggestions.push("Logging dose details helps track how tolerance shifts over time");
  }
  if (toleranceScore < 40) {
    suggestions.push("Your current pattern supports maintaining sensitivity");
  }
  if (trend === "rising") {
    suggestions.push("Your tolerance trend is rising — a short break may help");
  }

  // ── Weekly snapshots for trend chart ──
  const weeklyMap = new Map<string, { totalExposure: number; count: number }>();
  for (const s of sorted) {
    const wk = weekKey(new Date(s.created_at));
    const entry = weeklyMap.get(wk) ?? { totalExposure: 0, count: 0 };
    entry.totalExposure += estimateExposure(s);
    entry.count += 1;
    weeklyMap.set(wk, entry);
  }

  const weeklySnapshots = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, data]) => ({
      week,
      score: Math.round(Math.min(100, (data.totalExposure / 10) * 15 + (data.count / 3) * 20)),
    }));

  return {
    toleranceScore,
    level,
    trend,
    trendDelta,
    recoveryEstimate,
    reasons,
    suggestions,
    weeklySnapshots,
    ready: true,
  };
}
