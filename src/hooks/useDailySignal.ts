import { useMemo } from "react";
import { useSessionLogs } from "./useSessionLogs";
import { generateDailySignals, wasShownToday, type DailySignal } from "@/lib/dailySignalCheck";
import { computeTolerance } from "@/lib/toleranceEngine";

export function useDailySignal() {
  const { data: sessions } = useSessionLogs();

  const signals = useMemo<DailySignal[]>(() => {
    if (!sessions || sessions.length === 0) return [];

    try {
      const tolerance = computeTolerance(sessions);
      return generateDailySignals({
        sessions,
        toleranceLevel: tolerance.ready ? tolerance.level : undefined,
        toleranceTrend: tolerance.ready ? tolerance.trend : undefined,
      });
    } catch (err) {
      console.warn("[useDailySignal] failed:", err);
      return [];
    }
  }, [sessions]);

  return {
    signals,
    alreadyShown: wasShownToday(),
    sessionCount: sessions?.length ?? 0,
  };
}
