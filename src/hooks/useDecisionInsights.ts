import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";

export interface StrainOutcome {
  strainName: string;
  positiveRate: number;
  negativeRate: number;
  sampleSize: number;
}

export interface IntentBestWorst {
  intent: string;
  best: StrainOutcome[];
  worst: StrainOutcome[];
  totalSessions: number;
}

export interface MethodComparison {
  method: string;
  positiveRate: number;
  sampleSize: number;
}

export interface DecisionInsights {
  strainOutcomes: StrainOutcome[];
  intentBreakdowns: IntentBestWorst[];
  methodComparisons: MethodComparison[];
  bestMethod: MethodComparison | null;
  avoidList: StrainOutcome[];
  hasEnoughData: boolean;
}

function computeStrainOutcomes(sessions: SessionLog[]): StrainOutcome[] {
  const byStrain: Record<string, SessionLog[]> = {};
  for (const s of sessions) {
    const key = s.strain_name_text || "Unknown";
    (byStrain[key] ??= []).push(s);
  }

  return Object.entries(byStrain).map(([name, logs]) => {
    const pos = logs.filter(s => normalizeOutcome(s.outcome) === "positive").length;
    const neg = logs.filter(s => normalizeOutcome(s.outcome) === "negative").length;
    return {
      strainName: name,
      positiveRate: Math.round((pos / logs.length) * 100),
      negativeRate: Math.round((neg / logs.length) * 100),
      sampleSize: logs.length,
    };
  });
}

function computeIntentBreakdowns(sessions: SessionLog[]): IntentBestWorst[] {
  const byIntent: Record<string, SessionLog[]> = {};
  for (const s of sessions) {
    (byIntent[s.intent] ??= []).push(s);
  }

  return Object.entries(byIntent)
    .filter(([, logs]) => logs.length >= 2)
    .map(([intent, logs]) => {
      // Group by strain within this intent
      const byStrain: Record<string, SessionLog[]> = {};
      for (const s of logs) {
        const key = s.strain_name_text || "Unknown";
        (byStrain[key] ??= []).push(s);
      }

      const strainStats = Object.entries(byStrain)
        .filter(([, sl]) => sl.length >= 1)
        .map(([name, sl]) => {
          const pos = sl.filter(s => normalizeOutcome(s.outcome) === "positive").length;
          const neg = sl.filter(s => normalizeOutcome(s.outcome) === "negative").length;
          return {
            strainName: name,
            positiveRate: Math.round((pos / sl.length) * 100),
            negativeRate: Math.round((neg / sl.length) * 100),
            sampleSize: sl.length,
          };
        });

      const best = [...strainStats]
        .sort((a, b) => b.positiveRate - a.positiveRate || b.sampleSize - a.sampleSize)
        .slice(0, 3);
      const worst = [...strainStats]
        .sort((a, b) => b.negativeRate - a.negativeRate || b.sampleSize - a.sampleSize)
        .slice(0, 3)
        .filter(s => s.negativeRate > 0);

      return { intent, best, worst, totalSessions: logs.length };
    })
    .sort((a, b) => b.totalSessions - a.totalSessions);
}

function computeMethodComparisons(sessions: SessionLog[]): MethodComparison[] {
  const byMethod: Record<string, SessionLog[]> = {};
  for (const s of sessions) {
    const method = s.method || "other";
    (byMethod[method] ??= []).push(s);
  }

  return Object.entries(byMethod)
    .filter(([, logs]) => logs.length >= 2)
    .map(([method, logs]) => {
      const pos = logs.filter(s => normalizeOutcome(s.outcome) === "positive").length;
      return {
        method,
        positiveRate: Math.round((pos / logs.length) * 100),
        sampleSize: logs.length,
      };
    })
    .sort((a, b) => b.positiveRate - a.positiveRate || b.sampleSize - a.sampleSize);
}

export function useDecisionInsights(): {
  data: DecisionInsights | null;
  isLoading: boolean;
} {
  const { data: sessions, isLoading } = useSessionLogs();

  const insights = useMemo(() => {
    if (!sessions || sessions.length < 2) return null;

    const strainOutcomes = computeStrainOutcomes(sessions);
    const intentBreakdowns = computeIntentBreakdowns(sessions);
    const methodComparisons = computeMethodComparisons(sessions);
    const bestMethod = methodComparisons[0] ?? null;

    // Avoid list: strains with highest negative %, min 2 sessions
    const avoidList = [...strainOutcomes]
      .filter(s => s.sampleSize >= 2 && s.negativeRate > 0)
      .sort((a, b) => b.negativeRate - a.negativeRate || b.sampleSize - a.sampleSize)
      .slice(0, 5);

    return {
      strainOutcomes,
      intentBreakdowns,
      methodComparisons,
      bestMethod,
      avoidList,
      hasEnoughData: sessions.length >= 3,
    };
  }, [sessions]);

  return { data: insights, isLoading };
}
