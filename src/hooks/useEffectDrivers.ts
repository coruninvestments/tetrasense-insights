import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";

const EFFECT_KEYS = [
  { key: "effect_sleepiness", label: "Sleepiness", emoji: "😴" },
  { key: "effect_relaxation", label: "Relaxation", emoji: "🧘" },
  { key: "effect_focus", label: "Focus", emoji: "🎯" },
  { key: "effect_pain_relief", label: "Pain Relief", emoji: "💊" },
  { key: "effect_euphoria", label: "Euphoria", emoji: "✨" },
  { key: "effect_anxiety", label: "Anxiety", emoji: "😰" },
] as const;

type EffectKey = (typeof EFFECT_KEYS)[number]["key"];

export interface EffectDriver {
  key: EffectKey;
  label: string;
  emoji: string;
  avgPositive: number;
  avgNegative: number;
  difference: number; // positive means higher in positive sessions
}

export interface EffectDriversData {
  positiveDrivers: EffectDriver[];
  negativeDrivers: EffectDriver[];
  hasEnoughData: boolean;
  positiveSampleSize: number;
  negativeSampleSize: number;
}

function avg(sessions: SessionLog[], key: EffectKey): number {
  const vals = sessions.map((s) => (s[key] as number) ?? 0);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function computeDrivers(sessions: SessionLog[]): EffectDriversData {
  const positive = sessions.filter((s) => normalizeOutcome(s.outcome) === "positive");
  const negative = sessions.filter(
    (s) => normalizeOutcome(s.outcome) === "negative"
  );

  if (positive.length < 2 || negative.length < 1) {
    return {
      positiveDrivers: [],
      negativeDrivers: [],
      hasEnoughData: false,
      positiveSampleSize: positive.length,
      negativeSampleSize: negative.length,
    };
  }

  const drivers: EffectDriver[] = EFFECT_KEYS.map((ek) => {
    const avgPos = avg(positive, ek.key);
    const avgNeg = avg(negative, ek.key);
    return {
      key: ek.key,
      label: ek.label,
      emoji: ek.emoji,
      avgPositive: avgPos,
      avgNegative: avgNeg,
      difference: avgPos - avgNeg,
    };
  });

  // Positive drivers: effects significantly higher in positive sessions (≥4 avg) with meaningful gap
  const positiveDrivers = drivers
    .filter((d) => d.key !== "effect_anxiety" && d.avgPositive >= 4 && d.difference >= 1.5)
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 3);

  // Negative drivers: effects correlated with worse outcomes
  // For anxiety: higher in negative is bad
  // For others: lower positive avg but high negative avg
  const negativeDrivers = drivers
    .filter((d) => {
      if (d.key === "effect_anxiety") {
        return d.avgNegative >= 3 && d.avgNegative - d.avgPositive >= 1;
      }
      // Effects that are notably higher in negative sessions
      return d.difference <= -1.5 && d.avgNegative >= 4;
    })
    .sort((a, b) => a.difference - b.difference)
    .slice(0, 3);

  return {
    positiveDrivers,
    negativeDrivers,
    hasEnoughData: true,
    positiveSampleSize: positive.length,
    negativeSampleSize: negative.length,
  };
}

export function useEffectDrivers() {
  const { data: sessions, isLoading } = useSessionLogs();

  const data = useMemo(() => {
    if (!sessions || sessions.length < 3) {
      return {
        positiveDrivers: [],
        negativeDrivers: [],
        hasEnoughData: false,
        positiveSampleSize: 0,
        negativeSampleSize: 0,
      } as EffectDriversData;
    }
    return computeDrivers(sessions);
  }, [sessions]);

  return { data, isLoading };
}
