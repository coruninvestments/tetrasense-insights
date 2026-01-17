import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";

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
    (s) => s.outcome === "positive"
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

function detectPatterns(sessions: SessionLog[]): PatternInsight[] {
  const patterns: PatternInsight[] = [];

  if (sessions.length < 3) return patterns;

  // Pattern 1: Sleep intent + low dose → higher sleepiness/relaxation
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

      if (avgLowSleepiness > avgHighSleepiness + 1) {
        patterns.push({
          id: "sleep-low-dose",
          title: "Lower Doses May Help Sleep",
          description:
            "Based on your data, lower doses for sleep intent tend to result in higher sleepiness ratings without excess effects.",
          confidence: lowDoseSleep.length >= 3 ? "medium" : "low",
          icon: "sleep",
        });
      }
    }
  }

  // Pattern 2: Anxiety correlation with dose
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

      if (avgHighAnxiety > avgLowAnxiety + 2) {
        patterns.push({
          id: "anxiety-dose",
          title: "Dose & Comfort Correlation",
          description:
            "Based on your data, higher doses appear to correlate with increased anxiety ratings. Consider starting with lower doses.",
          confidence: highDoseAnxiety.length >= 2 ? "medium" : "low",
          icon: "trending",
        });
      }
    }
  }

  // Pattern 3: Focus intent effectiveness
  const focusSessions = sessions.filter((s) => s.intent === "focus");
  if (focusSessions.length >= 2) {
    const avgFocusRating =
      focusSessions.reduce((sum, s) => sum + (s.effect_focus || 0), 0) /
      focusSessions.length;
    const positiveOutcomes = focusSessions.filter(
      (s) => s.outcome === "positive"
    ).length;

    if (avgFocusRating >= 6 && positiveOutcomes / focusSessions.length >= 0.6) {
      patterns.push({
        id: "focus-success",
        title: "Focus Sessions Working Well",
        description: `Based on your data, your focus sessions show an average focus rating of ${avgFocusRating.toFixed(1)}/10 with ${Math.round((positiveOutcomes / focusSessions.length) * 100)}% positive outcomes.`,
        confidence: focusSessions.length >= 4 ? "high" : "medium",
        icon: "focus",
      });
    }
  }

  // Pattern 4: Relaxation correlation
  const relaxationSessions = sessions.filter((s) => s.intent === "relaxation");
  if (relaxationSessions.length >= 2) {
    const avgRelaxation =
      relaxationSessions.reduce(
        (sum, s) => sum + (s.effect_relaxation || 0),
        0
      ) / relaxationSessions.length;

    if (avgRelaxation >= 7) {
      patterns.push({
        id: "relaxation-success",
        title: "Strong Relaxation Results",
        description: `Based on your data, relaxation sessions average ${avgRelaxation.toFixed(1)}/10 on the relaxation scale. Your approach appears effective.`,
        confidence: relaxationSessions.length >= 3 ? "medium" : "low",
        icon: "sparkles",
      });
    }
  }

  // Pattern 5: Method preference
  const methodCounts = sessions.reduce(
    (acc, s) => {
      acc[s.method] = (acc[s.method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topMethod = Object.entries(methodCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];
  if (topMethod && topMethod[1] >= 3) {
    const methodSessions = sessions.filter((s) => s.method === topMethod[0]);
    const methodPositiveRate =
      methodSessions.filter((s) => s.outcome === "positive").length /
      methodSessions.length;

    if (methodPositiveRate >= 0.7) {
      patterns.push({
        id: "method-preference",
        title: `${topMethod[0].charAt(0).toUpperCase() + topMethod[0].slice(1)} Works for You`,
        description: `Based on your data, ${Math.round(methodPositiveRate * 100)}% of your ${topMethod[0]} sessions have positive outcomes across ${topMethod[1]} logged sessions.`,
        confidence: topMethod[1] >= 5 ? "high" : "medium",
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
