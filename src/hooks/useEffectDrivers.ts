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

export type SignalMode = "strong" | "early" | "none";

export interface EffectDriversData {
  positiveDrivers: EffectDriver[];
  negativeDrivers: EffectDriver[];
  hasEnoughData: boolean;
  signalMode: SignalMode;
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

  // Not enough data at all
  if (positive.length < 1 || negative.length < 1) {
    return {
      positiveDrivers: [],
      negativeDrivers: [],
      hasEnoughData: false,
      signalMode: "none",
      positiveSampleSize: positive.length,
      negativeSampleSize: negative.length,
    };
  }

  // Determine signal mode: strong requires 2+ pos AND 2+ neg
  const isStrong = positive.length >= 2 && negative.length >= 2;
  const signalMode: SignalMode = isStrong ? "strong" : "early";

  const avgThreshold = isStrong ? 4 : 3.5;
  const gapThreshold = isStrong ? 1.5 : 1.0;
  const negGapThreshold = isStrong ? 1.5 : 1.0;
  const negAvgThreshold = isStrong ? 4 : 3.5;
  const anxietyAvgThreshold = isStrong ? 3 : 2.5;
  const anxietyGapThreshold = isStrong ? 1 : 0.75;

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

  const positiveDrivers = drivers
    .filter((d) => d.key !== "effect_anxiety" && d.avgPositive >= avgThreshold && d.difference >= gapThreshold)
    .sort((a, b) => b.difference - a.difference)
    .slice(0, 3);

  const negativeDrivers = drivers
    .filter((d) => {
      if (d.key === "effect_anxiety") {
        return d.avgNegative >= anxietyAvgThreshold && d.avgNegative - d.avgPositive >= anxietyGapThreshold;
      }
      return d.difference <= -negGapThreshold && d.avgNegative >= negAvgThreshold;
    })
    .sort((a, b) => a.difference - b.difference)
    .slice(0, 3);

  return {
    positiveDrivers,
    negativeDrivers,
    hasEnoughData: true,
    signalMode,
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
        signalMode: "none" as const,
        positiveSampleSize: 0,
        negativeSampleSize: 0,
      } as EffectDriversData;
    }
    return computeDrivers(sessions);
  }, [sessions]);

  return { data, isLoading };
}
