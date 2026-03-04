import type { SessionLog } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";

export interface StrainRanking {
  strainName: string;
  strainType: string | null;
  sessionsCount: number;
  positiveRate: number;
  negativeRate: number;
  avgAnxiety: number;
  avgPrimaryGoalMatch: number;
  lastUsedAt: string;
  score: number;
  hasAnxietyRisk: boolean;
  reasons: string[];
}

function confidenceFactor(count: number): number {
  if (count >= 5) return 1.0;
  if (count >= 3) return 0.9;
  if (count >= 2) return 0.75;
  return 0.55;
}

export function computeStrainRankings(
  sessions: SessionLog[],
  intentFilter: string | null = null,
  typeFilter: string | null = null,
  minSessions: number = 2
): StrainRanking[] {
  // Group sessions by strain name (lowercased)
  const grouped = new Map<string, SessionLog[]>();
  for (const s of sessions) {
    const key = s.strain_name_text?.trim().toLowerCase();
    if (!key) continue;
    // If intent filter, only include matching sessions
    if (intentFilter && s.intent !== intentFilter) continue;
    const list = grouped.get(key) ?? [];
    list.push(s);
    grouped.set(key, list);
  }

  const rankings: StrainRanking[] = [];

  grouped.forEach((group, _key) => {
    const total = group.length;
    if (total < minSessions) return;

    // Use display name from most recent session
    const sorted = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const displayName = sorted[0].strain_name_text;
    const strainType = sorted[0].strain_type;

    // Type filter
    if (typeFilter && strainType?.toLowerCase() !== typeFilter.toLowerCase()) return;

    let positiveCount = 0;
    let negativeCount = 0;
    let anxietySum = 0;
    let anxietyCount = 0;
    let goalMatchCount = 0;

    for (const s of group) {
      const outcome = normalizeOutcome(s.outcome);
      if (outcome === "positive") positiveCount++;
      if (outcome === "negative") negativeCount++;
      if (s.effect_anxiety != null) {
        anxietySum += s.effect_anxiety;
        anxietyCount++;
      }
      // Goal match: if session intent matches the filter intent
      if (intentFilter && s.intent === intentFilter) {
        const o = normalizeOutcome(s.outcome);
        if (o === "positive") goalMatchCount++;
      }
    }

    const positiveRate = positiveCount / total;
    const negativeRate = negativeCount / total;
    const avgAnxiety = anxietyCount > 0 ? anxietySum / anxietyCount : 0;
    const avgPrimaryGoalMatch = intentFilter ? goalMatchCount / total : positiveRate;

    // Score
    let score = positiveRate * 100;
    if (negativeRate >= 0.35) score -= 20;
    if (avgAnxiety >= 5) score -= 15;
    score *= confidenceFactor(total);

    const hasAnxietyRisk = avgAnxiety >= 5 || negativeRate >= 0.35;

    // Build reasons
    const reasons: string[] = [];
    if (positiveRate >= 0.6) {
      const intentLabel = intentFilter ? intentFilter.replace("_", " ") : "sessions";
      reasons.push(`High positive rate for ${intentLabel}`);
    }
    if (avgAnxiety < 3 && total >= 2) {
      reasons.push("Low anxiety reported");
    }
    if (negativeRate >= 0.35) {
      reasons.push("Higher negative rate — use with caution");
    }
    if (avgAnxiety >= 5) {
      reasons.push("Elevated anxiety risk");
    }
    if (reasons.length === 0) {
      reasons.push(`${Math.round(positiveRate * 100)}% positive across ${total} sessions`);
    }

    rankings.push({
      strainName: displayName,
      strainType: strainType,
      sessionsCount: total,
      positiveRate,
      negativeRate,
      avgAnxiety,
      avgPrimaryGoalMatch,
      lastUsedAt: sorted[0].created_at,
      score,
      hasAnxietyRisk,
      reasons,
    });
  });

  return rankings.sort((a, b) => b.score - a.score);
}
