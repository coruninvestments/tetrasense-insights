import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";
import { normalizeOutcome, SessionOutcome } from "@/lib/sessionOutcome";

export type DataQualityTier = "insufficient" | "early" | "good" | "strong";

export type ToleranceTrend = "decreasing" | "stable" | "increasing";

export interface RelationshipInsight {
  id: string;
  title: string;
  description: string;
  type: "primary-intent" | "outcome-balance" | "correlation" | "stability" | "tolerance";
  tier: DataQualityTier;
  tooltipText?: string;
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
 * Map dose level to numeric value for comparison
 */
function doseToNumber(dose: string | null | undefined): number {
  if (dose === "high") return 3;
  if (dose === "medium") return 2;
  return 1; // low or undefined
}

/**
 * Calculate tolerance trend based on dose progression and outcome patterns
 * Only available with ≥10 sessions
 */
function calculateToleranceTrend(sessions: SessionLog[]): {
  trend: ToleranceTrend;
  recentAvgDose: number;
  olderAvgDose: number;
  recentFrequency: number;
  olderFrequency: number;
} | null {
  if (sessions.length < 10) return null;

  // Sort by date ascending (oldest first)
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const midpoint = Math.floor(sorted.length / 2);
  const older = sorted.slice(0, midpoint);
  const recent = sorted.slice(midpoint);

  // Calculate average dose levels
  const olderAvgDose = older.reduce((sum, s) => sum + doseToNumber(s.dose_level), 0) / older.length;
  const recentAvgDose = recent.reduce((sum, s) => sum + doseToNumber(s.dose_level), 0) / recent.length;

  // Calculate session frequency (sessions per 7 days)
  const olderDays = Math.max(1, (new Date(older[older.length - 1].created_at).getTime() - new Date(older[0].created_at).getTime()) / (1000 * 60 * 60 * 24));
  const recentDays = Math.max(1, (new Date(recent[recent.length - 1].created_at).getTime() - new Date(recent[0].created_at).getTime()) / (1000 * 60 * 60 * 24));
  
  const olderFrequency = (older.length / olderDays) * 7;
  const recentFrequency = (recent.length / recentDays) * 7;

  // Check outcome quality at higher doses
  const recentHighDose = recent.filter(s => s.dose_level === "high");
  const olderHighDose = older.filter(s => s.dose_level === "high");
  
  const recentHighPositiveRate = recentHighDose.length > 0 
    ? recentHighDose.filter(s => normalizeOutcome(s.outcome) === "positive").length / recentHighDose.length 
    : 0;
  const olderHighPositiveRate = olderHighDose.length > 0 
    ? olderHighDose.filter(s => normalizeOutcome(s.outcome) === "positive").length / olderHighDose.length 
    : 0;

  // Check anxiety at higher doses
  const recentHighAnxiety = recentHighDose.length > 0
    ? recentHighDose.reduce((sum, s) => sum + (s.effect_anxiety || 0), 0) / recentHighDose.length
    : 0;
  const olderHighAnxiety = olderHighDose.length > 0
    ? olderHighDose.reduce((sum, s) => sum + (s.effect_anxiety || 0), 0) / olderHighDose.length
    : 0;

  // Determine trend
  const doseIncreasing = recentAvgDose > olderAvgDose + 0.3;
  const doseDecreasing = recentAvgDose < olderAvgDose - 0.3;
  const frequencyIncreasing = recentFrequency > olderFrequency * 1.2;
  const outcomesWorseningAtHighDose = recentHighPositiveRate < olderHighPositiveRate - 0.15;
  const anxietyIncreasingAtHighDose = recentHighAnxiety > olderHighAnxiety + 1;

  let trend: ToleranceTrend = "stable";

  // Increasing tolerance signals
  if (doseIncreasing && (frequencyIncreasing || outcomesWorseningAtHighDose || anxietyIncreasingAtHighDose)) {
    trend = "increasing";
  } else if (doseIncreasing && recentHighDose.length >= 2) {
    trend = "increasing";
  }
  // Decreasing tolerance signals  
  else if (doseDecreasing && !frequencyIncreasing) {
    trend = "decreasing";
  }

  return {
    trend,
    recentAvgDose,
    olderAvgDose,
    recentFrequency,
    olderFrequency,
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
 * Get tier-aware language prefix
 */
function getTierPrefix(tier: DataQualityTier): string {
  switch (tier) {
    case "strong":
      return "Your data strongly suggests";
    case "good":
      return "Your data suggests";
    case "early":
    default:
      return "Early signals suggest";
  }
}

/**
 * Build relationship insights based on session data and tier
 */
function buildInsights(sessions: SessionLog[], tier: DataQualityTier): RelationshipInsight[] {
  const insights: RelationshipInsight[] = [];
  const prefix = getTierPrefix(tier);

  // Primary Intent (available at early tier)
  const primaryIntent = calculatePrimaryIntent(sessions);
  if (primaryIntent && primaryIntent.percentage >= 25) {
    insights.push({
      id: "primary-intent",
      title: "Primary Usage Intent",
      description: `${prefix} ${formatIntent(primaryIntent.intent)} is your most common intent (${primaryIntent.percentage}% of sessions).`,
      type: "primary-intent",
      tier,
    });
  }

  // Outcome Balance (available at early tier)
  const balance = calculateOutcomeBalance(sessions);
  if (sessions.length >= 5) {
    insights.push({
      id: "outcome-balance",
      title: "Outcome Balance",
      description: `${prefix} ${balance.positive}% positive, ${balance.neutral}% neutral, and ${balance.negative}% negative outcomes.`,
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
        description: `${prefix} higher doses correlate with elevated anxiety (avg ${correlation.avgHighAnxiety.toFixed(1)} vs ${correlation.avgLowAnxiety.toFixed(1)} for low doses).`,
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
          stabilityDescription = `${prefix} improvement: ${stability.recentPositiveRate}% positive recently vs ${stability.olderPositiveRate}% earlier.`;
          break;
        case "volatile":
          stabilityDescription = `${prefix} variability between outcomes, which may reflect different contexts, strains, or doses.`;
          break;
        case "stable":
        default:
          stabilityDescription = `${prefix} stable outcomes over time.`;
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

  // Tolerance Trend (requires ≥10 sessions, available at good/strong tier)
  if ((tier === "good" || tier === "strong") && sessions.length >= 10) {
    const tolerance = calculateToleranceTrend(sessions);
    if (tolerance) {
      let toleranceDescription: string;
      
      switch (tolerance.trend) {
        case "increasing":
          toleranceDescription = `${prefix} tolerance may be increasing—recent sessions use higher average doses.`;
          break;
        case "decreasing":
          toleranceDescription = `${prefix} decreasing effective doses over time.`;
          break;
        case "stable":
        default:
          toleranceDescription = `${prefix} stable dose levels over time.`;
          break;
      }

      insights.push({
        id: "tolerance-trend",
        title: "Tolerance Trend",
        description: toleranceDescription,
        type: "tolerance",
        tier,
        tooltipText: "Inferred from dose level changes, session frequency, and outcome patterns. This is an observation, not medical guidance.",
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
