import { useMemo } from "react";
import { useSessionLogs, SessionLog } from "./useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";

interface EffectAvg {
  key: string;
  label: string;
  emoji: string;
  avg: number;
}

export interface EffectPatternData {
  positiveDrivers: EffectAvg[];
  negativeDrivers: EffectAvg[];
  totalPositive: number;
  totalNegative: number;
  hasEnoughData: boolean;
}

const EFFECT_FIELDS: { key: string; field: keyof SessionLog; label: string; emoji: string }[] = [
  { key: "sleepiness", field: "effect_sleepiness", label: "Sleepiness", emoji: "😴" },
  { key: "relaxation", field: "effect_relaxation", label: "Relaxation", emoji: "🧘" },
  { key: "focus", field: "effect_focus", label: "Focus", emoji: "🎯" },
  { key: "pain_relief", field: "effect_pain_relief", label: "Pain Relief", emoji: "💊" },
  { key: "euphoria", field: "effect_euphoria", label: "Euphoria", emoji: "✨" },
  { key: "anxiety", field: "effect_anxiety", label: "Anxiety", emoji: "😰" },
];

function avgEffect(sessions: SessionLog[], field: keyof SessionLog): number {
  if (sessions.length === 0) return 0;
  const sum = sessions.reduce((acc, s) => acc + (Number(s[field]) || 0), 0);
  return sum / sessions.length;
}

export function useEffectPatterns(): { data: EffectPatternData | null; isLoading: boolean } {
  const { data: sessions, isLoading } = useSessionLogs();

  const data = useMemo(() => {
    if (!sessions || sessions.length < 3) return null;

    const positive = sessions.filter(s => normalizeOutcome(s.outcome) === "positive");
    const negative = sessions.filter(s => normalizeOutcome(s.outcome) === "negative");

    if (positive.length === 0 && negative.length === 0) return null;

    // Compute averages per outcome group
    const posAvgs = EFFECT_FIELDS.map(f => ({
      key: f.key,
      label: f.label,
      emoji: f.emoji,
      avg: avgEffect(positive, f.field),
    }));

    const negAvgs = EFFECT_FIELDS.map(f => ({
      key: f.key,
      label: f.label,
      emoji: f.emoji,
      avg: avgEffect(negative, f.field),
    }));

    // Positive drivers: effects that are notably higher in positive sessions vs negative
    // We want effects where positive avg is high AND meaningfully higher than negative avg
    const diffs = EFFECT_FIELDS.map(f => {
      const posVal = avgEffect(positive, f.field);
      const negVal = avgEffect(negative, f.field);
      return { ...f, posVal, negVal, diff: posVal - negVal };
    });

    // For "what drives good sessions": high in positive, higher than in negative
    // Exclude anxiety (high anxiety is bad)
    const positiveDrivers = diffs
      .filter(d => d.key !== "anxiety" && d.posVal >= 4 && d.diff > 0.5)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 3)
      .map(d => ({ key: d.key, label: d.label, emoji: d.emoji, avg: d.posVal }));

    // For "what drives bad sessions": high in negative sessions
    // Include anxiety here (high anxiety correlates with bad), or effects that are much higher in negative
    const negativeDrivers = diffs
      .filter(d => {
        if (d.key === "anxiety") return negative.length > 0 && d.negVal >= 4;
        return d.negVal >= 4 && d.diff < -0.5; // higher in negative than positive
      })
      .sort((a, b) => a.diff - b.diff) // most negative diff first
      .slice(0, 3)
      .map(d => ({ key: d.key, label: d.label, emoji: d.emoji, avg: d.negVal }));

    return {
      positiveDrivers,
      negativeDrivers,
      totalPositive: positive.length,
      totalNegative: negative.length,
      hasEnoughData: positive.length >= 2 || negative.length >= 2,
    };
  }, [sessions]);

  return { data, isLoading };
}
