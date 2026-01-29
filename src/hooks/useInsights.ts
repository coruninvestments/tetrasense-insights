import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";

export interface InsightData {
  weeklyPositiveRate: number;
  streak: number;
  avgSessionHour: number | null;
  avgSessionTimeLabel: string;
  patterns: PatternInsight[];
  hasEnoughData: boolean;
}

export interface PatternInsight {
  id: string;
  title: string;
  description: string;
  confidence: "low" | "medium" | "high";
  icon: "sleep" | "focus" | "trending" | "sparkles";
}

// Stable day key helper - produces YYYY-MM-DD regardless of locale
function toDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateStreak(sessions: SessionLog[]): number {
  if (!sessions.length) return 0;

  // Get unique dates with sessions using stable day keys
  const datesWithSessions = new Set(
    sessions.map((s) => toDayKey(new Date(s.created_at)))
  );

  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  // Check if there's a session today or yesterday to start the streak
  const todayKey = toDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toDayKey(yesterday);

  if (!datesWithSessions.has(todayKey) && !datesWithSessions.has(yesterdayKey)) {
    return 0;
  }

  // If no session today, start from yesterday
  if (!datesWithSessions.has(todayKey)) {
    currentDate = yesterday;
  }

  // Count consecutive days going backwards
  while (datesWithSessions.has(toDayKey(currentDate))) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

function calculateWeeklyPositiveRate(sessions: SessionLog[]): number {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weekSessions = sessions.filter(
    (s) => new Date(s.created_at) >= oneWeekAgo
  );

  if (weekSessions.length === 0) return 0;

  const positiveCount = weekSessions.filter(
    (s) => normalizeOutcome(s.outcome) === "positive"
  ).length;

  return Math.round((positiveCount / weekSessions.length) * 100);
}

function calculateAvgSessionHour(sessions: SessionLog[]): number | null {
  if (sessions.length === 0) return null;

  // Use local_time if available, otherwise parse created_at
  const hours = sessions.map((s) => {
    if (s.local_time) {
      // Parse time like "10:30 AM"
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
  });

  const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
  return avgHour;
}

function getTimeLabel(hour: number | null): string {
  if (hour === null) return "—";
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

/**
 * Confidence scoring thresholds
 * 
 * HIGH confidence requires:
 *   - Sample size ≥ 5 sessions AND
 *   - Strong effect signal (large difference, high rate, etc.)
 * 
 * MEDIUM confidence requires:
 *   - Sample size 3-4 sessions OR
 *   - Moderate effect signal with smaller sample
 * 
 * LOW confidence:
 *   - Minimum threshold met but weak signal or very small sample
 */
type ConfidenceLevel = "low" | "medium" | "high";

interface ConfidenceFactors {
  sampleSize: number;
  effectStrength: "weak" | "moderate" | "strong";
}

/**
 * Calculate confidence level based on sample size and effect strength
 * 
 * Logic:
 * - High: ≥5 samples AND strong effect
 * - Medium: (3-4 samples AND moderate+ effect) OR (≥5 samples AND moderate effect)
 * - Low: minimum threshold met but weak signal or very small sample
 */
function calculateConfidence(factors: ConfidenceFactors): ConfidenceLevel {
  const { sampleSize, effectStrength } = factors;
  
  // High confidence: large sample AND strong signal
  if (sampleSize >= 5 && effectStrength === "strong") {
    return "high";
  }
  
  // Medium confidence: decent sample with moderate+ signal, or large sample with moderate signal
  if (
    (sampleSize >= 3 && effectStrength === "strong") ||
    (sampleSize >= 5 && effectStrength === "moderate") ||
    (sampleSize >= 4 && effectStrength === "moderate")
  ) {
    return "medium";
  }
  
  // Low confidence: minimum threshold met but weak signal
  return "low";
}

/**
 * Get confidence-aware prefix for pattern descriptions
 */
function getConfidencePrefix(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "high":
      return "Your sessions consistently show";
    case "medium":
      return "Your data shows a pattern:";
    case "low":
    default:
      return "Early signals suggest";
  }
}

function detectPatterns(sessions: SessionLog[]): PatternInsight[] {
  const patterns: PatternInsight[] = [];

  if (sessions.length < 3) return patterns;

  // ─────────────────────────────────────────────────────────────────────────────
  // Pattern 1: Sleep intent + low dose → higher sleepiness/relaxation
  // Compares low vs high dose sleepiness ratings for sleep-intent sessions
  // ─────────────────────────────────────────────────────────────────────────────
  const sleepSessions = sessions.filter((s) => s.intent === "sleep");
  if (sleepSessions.length >= 2) {
    const lowDoseSleep = sleepSessions.filter((s) => s.dose_level === "low");
    const highDoseSleep = sleepSessions.filter((s) => s.dose_level === "high");

    if (lowDoseSleep.length >= 1 && highDoseSleep.length >= 1) {
      const avgLowSleepiness =
        lowDoseSleep.reduce((sum, s) => sum + (s.effect_sleepiness || 0), 0) /
        lowDoseSleep.length;
      const avgHighSleepiness =
        highDoseSleep.reduce((sum, s) => sum + (s.effect_sleepiness || 0), 0) /
        highDoseSleep.length;

      const difference = avgLowSleepiness - avgHighSleepiness;
      
      if (difference > 1) {
        // Effect strength based on how much better low dose performs
        // Strong: >3 point difference, Moderate: >2, Weak: >1
        const effectStrength: ConfidenceFactors["effectStrength"] = 
          difference > 3 ? "strong" : difference > 2 ? "moderate" : "weak";
        
        const confidence = calculateConfidence({
          sampleSize: lowDoseSleep.length + highDoseSleep.length,
          effectStrength,
        });

        const prefix = getConfidencePrefix(confidence);

        patterns.push({
          id: "sleep-low-dose",
          title: "Lower Doses May Help Sleep",
          description:
            `${prefix} lower doses for sleep intent tend to result in higher sleepiness ratings without excess effects.`,
          confidence,
          icon: "sleep",
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Pattern 2: Anxiety correlation with dose
  // Detects if higher doses correlate with increased anxiety ratings
  // ─────────────────────────────────────────────────────────────────────────────
  const sessionsWithAnxiety = sessions.filter(
    (s) => s.effect_anxiety !== null && s.effect_anxiety !== undefined
  );
  if (sessionsWithAnxiety.length >= 3) {
    const highDoseAnxiety = sessionsWithAnxiety.filter(
      (s) => s.dose_level === "high"
    );
    const lowDoseAnxiety = sessionsWithAnxiety.filter(
      (s) => s.dose_level === "low"
    );

    if (highDoseAnxiety.length >= 1 && lowDoseAnxiety.length >= 1) {
      const avgHighAnxiety =
        highDoseAnxiety.reduce((sum, s) => sum + (s.effect_anxiety || 0), 0) /
        highDoseAnxiety.length;
      const avgLowAnxiety =
        lowDoseAnxiety.reduce((sum, s) => sum + (s.effect_anxiety || 0), 0) /
        lowDoseAnxiety.length;

      const difference = avgHighAnxiety - avgLowAnxiety;

      if (difference > 2) {
        // Effect strength based on anxiety difference magnitude
        // Strong: >4 point difference, Moderate: >3, Weak: >2
        const effectStrength: ConfidenceFactors["effectStrength"] = 
          difference > 4 ? "strong" : difference > 3 ? "moderate" : "weak";

        const confidence = calculateConfidence({
          sampleSize: highDoseAnxiety.length + lowDoseAnxiety.length,
          effectStrength,
        });

        const prefix = getConfidencePrefix(confidence);

        patterns.push({
          id: "anxiety-dose",
          title: "Dose & Comfort Correlation",
          description:
            `${prefix} higher doses appear to correlate with increased anxiety ratings. Consider experimenting with lower doses to compare.`,
          confidence,
          icon: "trending",
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Pattern 3: Focus intent effectiveness
  // Measures success rate and average focus rating for focus-intent sessions
  // ─────────────────────────────────────────────────────────────────────────────
  const focusSessions = sessions.filter((s) => s.intent === "focus");
  if (focusSessions.length >= 2) {
    const avgFocusRating =
      focusSessions.reduce((sum, s) => sum + (s.effect_focus || 0), 0) /
      focusSessions.length;
    const positiveOutcomes = focusSessions.filter(
      (s) => normalizeOutcome(s.outcome) === "positive"
    ).length;
    const positiveRate = positiveOutcomes / focusSessions.length;

    if (avgFocusRating >= 6 && positiveRate >= 0.6) {
      // Effect strength based on both focus rating AND positive rate
      // Strong: avg ≥8 AND ≥80% positive, Moderate: avg ≥7 AND ≥70%, Weak: threshold met
      const effectStrength: ConfidenceFactors["effectStrength"] = 
        (avgFocusRating >= 8 && positiveRate >= 0.8) ? "strong" :
        (avgFocusRating >= 7 && positiveRate >= 0.7) ? "moderate" : "weak";

      const confidence = calculateConfidence({
        sampleSize: focusSessions.length,
        effectStrength,
      });

      const prefix = getConfidencePrefix(confidence);

      patterns.push({
        id: "focus-success",
        title: "Focus Sessions Working Well",
        description: `${prefix} focus sessions average ${avgFocusRating.toFixed(1)}/10 with ${Math.round(positiveRate * 100)}% positive outcomes.`,
        confidence,
        icon: "focus",
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Pattern 4: Relaxation correlation
  // Measures average relaxation rating for relaxation-intent sessions
  // ─────────────────────────────────────────────────────────────────────────────
  const relaxationSessions = sessions.filter((s) => s.intent === "relaxation");
  if (relaxationSessions.length >= 2) {
    const avgRelaxation =
      relaxationSessions.reduce(
        (sum, s) => sum + (s.effect_relaxation || 0),
        0
      ) / relaxationSessions.length;

    if (avgRelaxation >= 7) {
      // Effect strength based on relaxation rating magnitude
      // Strong: avg ≥9, Moderate: avg ≥8, Weak: avg ≥7
      const effectStrength: ConfidenceFactors["effectStrength"] = 
        avgRelaxation >= 9 ? "strong" : avgRelaxation >= 8 ? "moderate" : "weak";

      const confidence = calculateConfidence({
        sampleSize: relaxationSessions.length,
        effectStrength,
      });

      const prefix = getConfidencePrefix(confidence);

      patterns.push({
        id: "relaxation-success",
        title: "Strong Relaxation Results",
        description: `${prefix} relaxation sessions average ${avgRelaxation.toFixed(1)}/10 on the relaxation scale.`,
        confidence,
        icon: "sparkles",
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Pattern 5: Method preference
  // Identifies if a particular consumption method has high success rate
  // ─────────────────────────────────────────────────────────────────────────────
  const methodCounts = sessions.reduce(
    (acc, s) => {
      const method = s.method ?? "unknown";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Exclude "unknown" from being the top method if possible
  const sortedMethods = Object.entries(methodCounts)
    .filter(([method]) => method !== "unknown")
    .sort((a, b) => b[1] - a[1]);
  const topMethod = sortedMethods[0];
  if (topMethod && topMethod[1] >= 3) {
    const methodSessions = sessions.filter((s) => s.method === topMethod[0]);
    const methodPositiveRate =
      methodSessions.filter((s) => normalizeOutcome(s.outcome) === "positive").length /
      methodSessions.length;

    if (methodPositiveRate >= 0.7) {
      // Effect strength based on positive rate magnitude
      // Strong: ≥90% positive, Moderate: ≥80%, Weak: ≥70%
      const effectStrength: ConfidenceFactors["effectStrength"] = 
        methodPositiveRate >= 0.9 ? "strong" : methodPositiveRate >= 0.8 ? "moderate" : "weak";

      const confidence = calculateConfidence({
        sampleSize: topMethod[1],
        effectStrength,
      });

      const prefix = getConfidencePrefix(confidence);

      patterns.push({
        id: "method-preference",
        title: `${topMethod[0].charAt(0).toUpperCase() + topMethod[0].slice(1)} Works for You`,
        description: `${prefix} ${Math.round(methodPositiveRate * 100)}% of ${topMethod[0]} sessions have positive outcomes (${topMethod[1]} sessions).`,
        confidence,
        icon: "trending",
      });
    }
  }

  return patterns.slice(0, 3); // Return top 3 patterns
}

export function useInsights(): {
  data: InsightData | null;
  isLoading: boolean;
} {
  const { data: sessions, isLoading } = useSessionLogs();

  const insights = useMemo(() => {
    if (!sessions) return null;

    const weeklyPositiveRate = calculateWeeklyPositiveRate(sessions);
    const streak = calculateStreak(sessions);
    const avgSessionHour = calculateAvgSessionHour(sessions);
    const avgSessionTimeLabel = getTimeLabel(avgSessionHour);
    const patterns = detectPatterns(sessions);
    const hasEnoughData = sessions.length >= 3;

    return {
      weeklyPositiveRate,
      streak,
      avgSessionHour,
      avgSessionTimeLabel,
      patterns,
      hasEnoughData,
    };
  }, [sessions]);

  return { data: insights, isLoading };
}
