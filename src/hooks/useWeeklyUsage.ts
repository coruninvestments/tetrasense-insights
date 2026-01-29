import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";

export interface DoseDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface MethodDistribution {
  smoke: number;
  vape: number;
  edible: number;
  tincture: number;
  topical: number;
  other: number;
}

export interface WeeklyUsageData {
  thisWeekCount: number;
  lastWeekCount: number;
  weekOverWeekChange: number | null;
  doseDistribution: DoseDistribution;
  methodDistribution: MethodDistribution;
  hasData: boolean;
}

/**
 * Get the start of today (midnight) in local time
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Calculate weekly usage statistics from session logs
 */
export function useWeeklyUsage(): {
  data: WeeklyUsageData | null;
  isLoading: boolean;
} {
  const { data: sessions, isLoading } = useSessionLogs();

  const weeklyData = useMemo(() => {
    if (!sessions) return null;

    const today = getStartOfToday();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Filter sessions for this week and last week
    const thisWeekSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.created_at);
      return sessionDate >= oneWeekAgo;
    });

    const lastWeekSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.created_at);
      return sessionDate >= twoWeeksAgo && sessionDate < oneWeekAgo;
    });

    const thisWeekCount = thisWeekSessions.length;
    const lastWeekCount = lastWeekSessions.length;

    // Calculate week-over-week change (only if last week had data)
    let weekOverWeekChange: number | null = null;
    if (lastWeekCount > 0) {
      weekOverWeekChange = thisWeekCount - lastWeekCount;
    }

    // Calculate dose distribution for this week
    const doseDistribution: DoseDistribution = { low: 0, medium: 0, high: 0 };
    thisWeekSessions.forEach((s) => {
      const dose = s.dose_level || "medium";
      if (dose in doseDistribution) {
        doseDistribution[dose as keyof DoseDistribution]++;
      }
    });

    // Calculate method distribution for this week
    const methodDistribution: MethodDistribution = {
      smoke: 0,
      vape: 0,
      edible: 0,
      tincture: 0,
      topical: 0,
      other: 0,
    };
    thisWeekSessions.forEach((s) => {
      const method = s.method?.toLowerCase() || "other";
      if (method in methodDistribution) {
        methodDistribution[method as keyof MethodDistribution]++;
      } else {
        methodDistribution.other++;
      }
    });

    return {
      thisWeekCount,
      lastWeekCount,
      weekOverWeekChange,
      doseDistribution,
      methodDistribution,
      hasData: thisWeekCount > 0 || lastWeekCount > 0,
    };
  }, [sessions]);

  return { data: weeklyData, isLoading };
}
