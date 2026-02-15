import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { PatternInsight } from "./useInsights";

const MIN_SESSIONS = 5;

/**
 * Parse session hour from local_time or created_at
 */
function getSessionHour(s: SessionLog): number {
  if (s.local_time) {
    const match = s.local_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hour = parseInt(match[1]);
      const isPM = match[3].toUpperCase() === "PM";
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      return hour;
    }
  }
  return new Date(s.created_at).getHours();
}

function getTimeBucket(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function confidence(sampleSize: number): PatternInsight["confidence"] {
  if (sampleSize >= 15) return "high";
  if (sampleSize >= 8) return "medium";
  return "low";
}

function prefix(c: PatternInsight["confidence"]): string {
  if (c === "high") return "Your data strongly suggests";
  if (c === "medium") return "Your data suggests";
  return "Early signals suggest";
}

// ─── Pattern A: Side Effect Sensitivity ──────────────────────────────────────
function detectSideEffectSensitivity(sessions: SessionLog[]): PatternInsight[] {
  if (sessions.length < MIN_SESSIONS) return [];

  const effects: { key: string; label: string; getter: (s: SessionLog) => number | null }[] = [
    { key: "dry_mouth", label: "dry mouth", getter: (s) => s.effect_dry_mouth },
    { key: "dry_eyes", label: "dry / red eyes", getter: (s) => s.effect_dry_eyes },
    { key: "throat", label: "throat irritation", getter: (s) => s.effect_throat_irritation },
    { key: "anxiety", label: "anxiety", getter: (s) => s.effect_anxiety },
    { key: "body_heaviness", label: "body heaviness", getter: (s) => s.effect_body_heaviness },
  ];

  const patterns: PatternInsight[] = [];

  for (const effect of effects) {
    const relevant = sessions.filter((s) => {
      const v = effect.getter(s);
      return v !== null && v !== undefined;
    });
    if (relevant.length < MIN_SESSIONS) continue;

    const highCount = relevant.filter((s) => (effect.getter(s) ?? 0) >= 5).length;
    const rate = highCount / relevant.length;

    if (rate >= 0.6) {
      const c = confidence(relevant.length);
      const label = effect.label;
      patterns.push({
        id: `sensitivity-${effect.key}`,
        type: "side_effect",
        title: `${label.charAt(0).toUpperCase() + label.slice(1)} Sensitivity`,
        headline: `You frequently experience ${label}`,
        description: `${prefix(c)} you often report ${label} during sessions (${Math.round(rate * 100)}% of ${relevant.length} sessions).`,
        explanation: `${Math.round(rate * 100)}% of your ${relevant.length} logged sessions included notable ${label}. This pattern may be worth tracking over time.`,
        suggestion: `Consider noting what changes — like dose, method, or strain — when ${label} is less present.`,
        confidence: c,
        icon: "trending",
      });
    }
  }

  return patterns;
}

// ─── Pattern B: Dose Sensitivity ─────────────────────────────────────────────
function detectDoseSensitivity(sessions: SessionLog[]): PatternInsight[] {
  const highDoseUncomfortable = sessions.filter(
    (s) => s.dose_level === "high" && s.comfort_score === 0
  );

  if (highDoseUncomfortable.length < 3) return [];
  // Need at least MIN_SESSIONS total to be meaningful
  if (sessions.length < MIN_SESSIONS) return [];

  const highDoseTotal = sessions.filter((s) => s.dose_level === "high").length;
  if (highDoseTotal < 3) return [];

  const rate = highDoseUncomfortable.length / highDoseTotal;
  if (rate < 0.5) return [];

  const c = confidence(highDoseTotal);
  return [
    {
      id: "dose-sensitivity",
      type: "dose",
      title: "Dose Comfort Pattern",
      headline: "Higher doses may reduce your comfort",
      description: `${prefix(c)} higher doses may reduce comfort for you (${Math.round(rate * 100)}% of high-dose sessions felt too strong).`,
      explanation: `In ${highDoseUncomfortable.length} of ${highDoseTotal} high-dose sessions, you reported low comfort. This is a notable pattern in your data.`,
      suggestion: "You might explore lower or medium doses and compare your comfort ratings.",
      confidence: c,
      icon: "trending",
    },
  ];
}

// ─── Pattern C: Intent Success Pattern ───────────────────────────────────────
function detectIntentSuccess(sessions: SessionLog[]): PatternInsight[] {
  if (sessions.length < MIN_SESSIONS) return [];

  // Group by intent + strain_name_text
  const groups: Record<string, SessionLog[]> = {};
  for (const s of sessions) {
    if (s.intent_match_score === null || s.intent_match_score === undefined) continue;
    const key = `${s.intent}::${s.strain_name_text}`;
    (groups[key] ??= []).push(s);
  }

  const patterns: PatternInsight[] = [];

  for (const [key, group] of Object.entries(groups)) {
    if (group.length < 3) continue;

    const perfectCount = group.filter((s) => s.intent_match_score === 2).length;
    const rate = perfectCount / group.length;

    if (rate >= 0.6) {
      const [intent, strain] = key.split("::");
      const c = confidence(group.length);
      patterns.push({
        id: `intent-success-${intent}-${strain}`,
        type: "intent_success",
        title: `Great ${intent} Match`,
        headline: `${strain} often matches your ${intent} intent`,
        description: `${prefix(c)} ${strain} often matches your ${intent} intent (${Math.round(rate * 100)}% perfect match across ${group.length} sessions).`,
        explanation: `Across ${group.length} sessions using ${strain} for ${intent}, ${Math.round(rate * 100)}% resulted in a perfect intent match.`,
        confidence: c,
        icon: "sparkles",
      });
    }
  }

  // Return top pattern by sample size
  return patterns.sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[b.confidence] - order[a.confidence];
  }).slice(0, 2);
}

// ─── Pattern D: Time-of-Day Pattern ──────────────────────────────────────────
function detectTimeOfDayPattern(sessions: SessionLog[]): PatternInsight[] {
  if (sessions.length < MIN_SESSIONS) return [];

  const buckets: Record<string, SessionLog[]> = {};
  for (const s of sessions) {
    const bucket = getTimeBucket(getSessionHour(s));
    (buckets[bucket] ??= []).push(s);
  }

  const patterns: PatternInsight[] = [];

  for (const [bucket, group] of Object.entries(buckets)) {
    if (group.length < 3) continue;

    const positiveCount = group.filter(
      (s) => normalizeOutcome(s.outcome) === "positive"
    ).length;
    const rate = positiveCount / group.length;

    if (rate >= 0.7) {
      const c = confidence(group.length);
      patterns.push({
        id: `time-${bucket}`,
        type: "time",
        title: `${bucket.charAt(0).toUpperCase() + bucket.slice(1)} Sessions Shine`,
        headline: `Your ${bucket} sessions tend to go well`,
        description: `${prefix(c)} ${bucket} sessions tend to produce better outcomes (${Math.round(rate * 100)}% positive across ${group.length} sessions).`,
        explanation: `${Math.round(rate * 100)}% of your ${group.length} ${bucket} sessions had a positive outcome, compared to other times of day.`,
        suggestion: `If consistency matters to you, ${bucket} sessions seem to work in your favor.`,
        confidence: c,
        icon: "sleep",
      });
    }
  }

  // Best bucket only
  return patterns.sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[b.confidence] - order[a.confidence];
  }).slice(0, 1);
}

// ─── Main Hook ───────────────────────────────────────────────────────────────
export function usePersonalPatterns() {
  const { data: sessions, isLoading } = useSessionLogs();

  const patterns = useMemo(() => {
    if (!sessions || sessions.length < MIN_SESSIONS) return [];

    return [
      ...detectSideEffectSensitivity(sessions),
      ...detectDoseSensitivity(sessions),
      ...detectIntentSuccess(sessions),
      ...detectTimeOfDayPattern(sessions),
    ];
  }, [sessions]);

  return { data: patterns, isLoading };
}
