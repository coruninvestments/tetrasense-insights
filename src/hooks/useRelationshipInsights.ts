import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";
import { normalizeOutcome, SessionOutcome } from "@/lib/sessionOutcome";

export type DataQualityTier = "insufficient" | "early" | "good" | "strong";

export interface RelationshipInsight {
  id: string;
  title: string;
  description: string;
  type: "primary-intent" | "outcome-balance" | "correlation" | "stability";
  tier: DataQualityTier;
}

export interface RelationshipInsightsData {
  insights: RelationshipInsight[];
  sessionCount: number;
  dataTier: DataQualityTier;
  hasMinimumData: boolean;
}

/**
 * Determine data quality tier based on session count
 */
function getDataTier(count: number): DataQualityTier {
  if (count < 3) return "insufficient";
  if (count < 7) return "early";
  if (count < 15) return "good";
  return "strong";
}

/**
 * Calculate the most frequent intent from sessions
 */
function calculatePrimaryIntent(sessions: SessionLog[]): { intent: string; count: number; percentage: number } | null {
  if (sessions.length === 0) return null;

  const intentCounts = sessions.reduce((acc, s) => {
    acc[s.intent] = (acc[s.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sorted = Object.entries(intentCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const [intent, count] = sorted[0];
  return {
    intent,
    count,
    percentage: Math.round((count / sessions.length) * 100),
  };
}

/**
 * Calculate outcome distribution percentages
 */
function calculateOutcomeBalance(sessions: SessionLog[]): {
  positive: number;
  neutral: number;
  negative: number;
} {
  if (sessions.length === 0) return { positive: 0, neutral: 0, negative: 0 };

  const counts = { positive: 0, neutral: 0, negative: 0 };
  sessions.forEach((s) => {
    const outcome = normalizeOutcome(s.outcome);
    counts[outcome]++;
  });

  return {
    positive: Math.round((counts.positive / sessions.length) * 100),
    neutral: Math.round((counts.neutral / sessions.length) * 100),
    negative: Math.round((counts.negative / sessions.length) * 100),
  };
}

/**
 * Detect if higher doses correlate with higher anxiety
 */
function detectDoseAnxietyCorrelation(sessions: SessionLog[]): {
  detected: boolean;
  avgHighAnxiety: number;
  avgLowAnxiety: number;
  difference: number;
} | null {
  const withAnxiety = sessions.filter(
    (s) => s.effect_anxiety !== null && s.effect_anxiety !== undefined && s.dose_level
  );

  const high = withAnxiety.filter((s) => s.dose_level === "high");
  const low = withAnxiety.filter((s) => s.dose_level === "low");

  if (high.length < 2 || low.length < 2) return null;

  const avgHigh = high.reduce((sum, s) => sum + (s.effect_anxiety || 0), 0) / high.length;
  const avgLow = low.reduce((sum, s) => sum + (s.effect_anxiety || 0), 0) / low.length;
  const difference = avgHigh - avgLow;

  return {
    detected: difference > 1.5,
    avgHighAnxiety: avgHigh,
    avgLowAnxiety: avgLow,
    difference,
  };
}

/**
 * Calculate outcome stability/volatility over time
 * Compares recent sessions to older sessions
 */
function calculateStabilityTrend(sessions: SessionLog[]): {
  trend: "stable" | "improving" | "volatile" | "insufficient";
  recentPositiveRate: number;
  olderPositiveRate: number;
} {
  if (sessions.length < 6) return { trend: "insufficient", recentPositiveRate: 0, olderPositiveRate: 0 };

  // Sort by date descending (most recent first)
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const midpoint = Math.floor(sorted.length / 2);
  const recent = sorted.slice(0, midpoint);
  const older = sorted.slice(midpoint);

  const recentPositive = recent.filter((s) => normalizeOutcome(s.outcome) === "positive").length;
  const olderPositive = older.filter((s) => normalizeOutcome(s.outcome) === "positive").length;

  const recentRate = recentPositive / recent.length;
  const olderRate = olderPositive / older.length;

  // Calculate variance in outcomes for volatility
  const recentOutcomes = recent.map((s) => normalizeOutcome(s.outcome));
  const recentVariance = calculateOutcomeVariance(recentOutcomes);

  let trend: "stable" | "improving" | "volatile";
  if (recentVariance > 0.7) {
    trend = "volatile";
  } else if (recentRate > olderRate + 0.15) {
    trend = "improving";
  } else {
    trend = "stable";
  }

  return {
    trend,
    recentPositiveRate: Math.round(recentRate * 100),
    olderPositiveRate: Math.round(olderRate * 100),
  };
}

/**
 * Simple variance calculation for outcomes
 */
function calculateOutcomeVariance(outcomes: SessionOutcome[]): number {
  if (outcomes.length < 3) return 0;

  // Count transitions between different outcome types
  let transitions = 0;
  for (let i = 1; i < outcomes.length; i++) {
    if (outcomes[i] !== outcomes[i - 1]) transitions++;
  }

  return transitions / (outcomes.length - 1);
}

/**
 * Format intent name for display
 */
function formatIntent(intent: string): string {
  return intent
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build relationship insights based on session data and tier
 */
function buildInsights(sessions: SessionLog[], tier: DataQualityTier): RelationshipInsight[] {
  const insights: RelationshipInsight[] = [];

  // Primary Intent (available at early tier)
  const primaryIntent = calculatePrimaryIntent(sessions);
  if (primaryIntent && primaryIntent.percentage >= 25) {
    const tierLanguage = tier === "early"
      ? `Your most logged intent is ${formatIntent(primaryIntent.intent)} (${primaryIntent.percentage}% of sessions).`
      : `${formatIntent(primaryIntent.intent)} represents ${primaryIntent.percentage}% of your ${sessions.length} sessions, making it your primary usage intent.`;

    insights.push({
      id: "primary-intent",
      title: "Primary Usage Intent",
      description: tierLanguage,
      type: "primary-intent",
      tier,
    });
  }

  // Outcome Balance (available at early tier)
  const balance = calculateOutcomeBalance(sessions);
  if (sessions.length >= 5) {
    let balanceDescription: string;
    if (tier === "early") {
      balanceDescription = `So far, ${balance.positive}% of your sessions have been positive, ${balance.neutral}% neutral, and ${balance.negative}% negative.`;
    } else {
      balanceDescription = `Your sessions show ${balance.positive}% positive outcomes, ${balance.neutral}% neutral, and ${balance.negative}% negative. This reflects your personal response patterns.`;
    }

    insights.push({
      id: "outcome-balance",
      title: "Outcome Balance",
      description: balanceDescription,
      type: "outcome-balance",
      tier,
    });
  }

  // Dose-Anxiety Correlation (available at good tier)
  if (tier === "good" || tier === "strong") {
    const correlation = detectDoseAnxietyCorrelation(sessions);
    if (correlation?.detected) {
      insights.push({
        id: "dose-anxiety",
        title: "Dose & Comfort Pattern",
        description: `Based on your data, higher doses correlate with elevated anxiety ratings (avg ${correlation.avgHighAnxiety.toFixed(1)} vs ${correlation.avgLowAnxiety.toFixed(1)} for low doses). This is a personal pattern worth noting.`,
        type: "correlation",
        tier,
      });
    }
  }

  // Stability Trend (available at good tier with 6+ sessions)
  if ((tier === "good" || tier === "strong") && sessions.length >= 6) {
    const stability = calculateStabilityTrend(sessions);
    if (stability.trend !== "insufficient") {
      let stabilityDescription: string;
      switch (stability.trend) {
        case "improving":
          stabilityDescription = `Your recent sessions show ${stability.recentPositiveRate}% positive outcomes compared to ${stability.olderPositiveRate}% earlier. Your experience appears to be trending positively.`;
          break;
        case "volatile":
          stabilityDescription = `Your outcomes vary considerably between sessions. This variability is normal and may reflect different contexts, strains, or doses.`;
          break;
        case "stable":
        default:
          stabilityDescription = `Your outcomes have remained consistent over time, with similar positive rates across recent and earlier sessions.`;
          break;
      }

      insights.push({
        id: "stability-trend",
        title: "Experience Consistency",
        description: stabilityDescription,
        type: "stability",
        tier,
      });
    }
  }

  return insights;
}

export function useRelationshipInsights(): {
  data: RelationshipInsightsData | null;
  isLoading: boolean;
} {
  const { data: sessions, isLoading } = useSessionLogs();

  const relationshipData = useMemo(() => {
    if (!sessions) return null;

    const sessionCount = sessions.length;
    const dataTier = getDataTier(sessionCount);
    const hasMinimumData = sessionCount >= 5;

    // Only build insights if minimum data threshold met
    const insights = hasMinimumData ? buildInsights(sessions, dataTier) : [];

    return {
      insights,
      sessionCount,
      dataTier,
      hasMinimumData,
    };
  }, [sessions]);

  return { data: relationshipData, isLoading };
}
