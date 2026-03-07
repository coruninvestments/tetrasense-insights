/**
 * Weekly Cannabis Insight Report Engine
 *
 * Generates a personalised summary from the last 7 days of sessions.
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";

/* ── Terpene-to-tag mapping (reused from terpenePreferences) ── */
const TERPENE_TAG_MAP: Record<string, string[]> = {
  Limonene: ["citrus", "lemon", "orange", "grapefruit", "sweet", "fruity", "tropical"],
  Myrcene: ["earthy", "musky", "herbal", "mango", "clove"],
  Pinene: ["pine", "woody", "cedar", "forest", "herbal"],
  Caryophyllene: ["pepper", "spicy", "woody", "clove"],
  Linalool: ["floral", "lavender", "sweet", "berry"],
  Terpinolene: ["fruity", "floral", "piney", "herbal"],
  Humulene: ["hoppy", "earthy", "woody", "spicy"],
  Ocimene: ["sweet", "herbal", "citrus", "tropical"],
};

export interface WeeklyInsightReport {
  bestSession: string;
  riskPattern: string;
  bestDoseRange: string;
  terpeneTrend: string;
  recommendation: string;
  sessionCount: number;
  positiveRate: number;
}

export function generateWeeklyInsights(
  allSessions: SessionLog[],
): WeeklyInsightReport | null {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const weeklySessions = allSessions.filter(
    s => now - new Date(s.created_at).getTime() < sevenDaysMs,
  );

  if (weeklySessions.length < 2) return null;

  const positives = weeklySessions.filter(s => normalizeOutcome(s.outcome) === "positive");
  const negatives = weeklySessions.filter(s => normalizeOutcome(s.outcome) === "negative");
  const positiveRate = Math.round((positives.length / weeklySessions.length) * 100);

  // ── Best session ──
  const bestSession = findBestSession(positives.length > 0 ? positives : weeklySessions);

  // ── Risk pattern ──
  const riskPattern = findRiskPattern(weeklySessions, negatives);

  // ── Best dose range ──
  const bestDoseRange = findBestDoseRange(weeklySessions);

  // ── Terpene trend ──
  const terpeneTrend = findTerpeneTrend(weeklySessions);

  // ── Recommendation ──
  const recommendation = generateRecommendation(positiveRate, weeklySessions);

  return {
    bestSession,
    riskPattern,
    bestDoseRange,
    terpeneTrend,
    recommendation,
    sessionCount: weeklySessions.length,
    positiveRate,
  };
}

/* ── Helpers ── */

function findBestSession(sessions: SessionLog[]): string {
  if (!sessions.length) return "Not enough data this week";

  // Score sessions by comfort + intent match + sensory enjoyment
  let best: SessionLog | null = null;
  let bestScore = -1;
  for (const s of sessions) {
    const score =
      (s.comfort_score ?? 0) * 2 +
      (s.intent_match_score ?? 0) * 2 +
      (s.sensory_enjoyment ?? 0) +
      (s.effect_euphoria ?? 0);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  if (!best) return "Not enough data this week";

  const day = new Date(best.created_at).toLocaleDateString("en-US", { weekday: "long" });
  return `${day}'s ${best.intent} session with ${best.strain_name_text}`;
}

function findRiskPattern(all: SessionLog[], negatives: SessionLog[]): string {
  if (negatives.length === 0) return "No negative patterns detected this week";

  // Check caffeine correlation
  const caffeineNeg = negatives.filter(s => s.caffeine).length;
  if (caffeineNeg >= 2 || (caffeineNeg > 0 && caffeineNeg === negatives.length)) {
    return "Caffeine was present in your less successful sessions";
  }

  // Check high dose correlation
  const highDoseNeg = negatives.filter(s => s.dose_level === "high").length;
  if (highDoseNeg >= 2) {
    return "Higher doses correlated with less positive outcomes";
  }

  // Check poor sleep
  const poorSleepNeg = negatives.filter(s => s.sleep_quality === "poor").length;
  if (poorSleepNeg >= 2) {
    return "Poor sleep quality preceded your less successful sessions";
  }

  // Check high stress
  const highStressNeg = negatives.filter(s => s.stress_before === "high").length;
  if (highStressNeg >= 1) {
    return "High pre-session stress may have affected your outcomes";
  }

  // Check anxiety
  const avgAnxiety = negatives.reduce((sum, s) => sum + (s.effect_anxiety ?? 0), 0) / negatives.length;
  if (avgAnxiety > 5) {
    return "Elevated anxiety was common in less positive sessions";
  }

  return "No clear negative pattern — keep logging for deeper insights";
}

function findBestDoseRange(sessions: SessionLog[]): string {
  const positives = sessions.filter(s => normalizeOutcome(s.outcome) === "positive");
  if (positives.length === 0) return "Not enough positive sessions to determine";

  const doseCounts: Record<string, number> = {};
  for (const s of positives) {
    const level = s.dose_level ?? "unknown";
    doseCounts[level] = (doseCounts[level] ?? 0) + 1;
  }

  const best = Object.entries(doseCounts).sort((a, b) => b[1] - a[1])[0];
  if (!best || best[0] === "unknown") return "Varied doses — no clear winner yet";

  const pct = Math.round((best[1] / positives.length) * 100);
  return `${capitalize(best[0])} dose range (${pct}% of positive sessions)`;
}

function findTerpeneTrend(sessions: SessionLog[]): string {
  const tagCounts: Record<string, number> = {};
  for (const s of sessions) {
    for (const tag of [...(s.aroma_tags ?? []), ...(s.flavor_tags ?? [])]) {
      tagCounts[tag.toLowerCase()] = (tagCounts[tag.toLowerCase()] ?? 0) + 1;
    }
  }

  if (Object.keys(tagCounts).length === 0) return "Log aroma & flavor tags for terpene insights";

  // Map tags to terpene families
  const terpScores: Record<string, number> = {};
  for (const [tag, count] of Object.entries(tagCounts)) {
    for (const [terp, tags] of Object.entries(TERPENE_TAG_MAP)) {
      if (tags.includes(tag)) {
        terpScores[terp] = (terpScores[terp] ?? 0) + count;
      }
    }
  }

  const sorted = Object.entries(terpScores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "No terpene trends detected yet";

  return `${sorted[0][0]}-forward profiles were most common this week`;
}

function generateRecommendation(positiveRate: number, sessions: SessionLog[]): string {
  if (positiveRate >= 80) {
    return "Great week — your current approach is working well. Keep it consistent.";
  }
  if (positiveRate >= 60) {
    return "Solid week overall. Review your less successful sessions for patterns to avoid.";
  }

  // Find what the positive sessions had in common
  const positives = sessions.filter(s => normalizeOutcome(s.outcome) === "positive");
  if (positives.length > 0) {
    const methods = positives.map(s => s.method);
    const mostCommon = mode(methods);
    if (mostCommon) {
      return `Your positive sessions leaned toward ${mostCommon} — consider focusing there.`;
    }
  }

  return "Try adjusting dose or context factors. Small changes can shift outcomes.";
}

function mode(arr: string[]): string | null {
  const counts: Record<string, number> = {};
  for (const v of arr) counts[v] = (counts[v] ?? 0) + 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
