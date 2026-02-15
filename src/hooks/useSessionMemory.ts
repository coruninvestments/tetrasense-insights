import { useMemo } from "react";
import { useSessionLogs, type SessionLog } from "./useSessionLogs";
import { normalizeOutcome, type SessionOutcome } from "@/lib/sessionOutcome";

export interface SessionMemory {
  lastOutcome?: SessionOutcome;
  mostCommonEffects?: string[];
  typicalDuration?: string;
  typicalDose?: string;
  sessionCount: number;
}

const EFFECT_KEYS: { key: keyof SessionLog; label: string }[] = [
  { key: "effect_relaxation", label: "Relaxation" },
  { key: "effect_sleepiness", label: "Sleepiness" },
  { key: "effect_focus", label: "Focus" },
  { key: "effect_euphoria", label: "Euphoria" },
  { key: "effect_pain_relief", label: "Pain Relief" },
  { key: "effect_anxiety", label: "Anxiety" },
];

function mode<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  const counts = new Map<T, number>();
  for (const v of arr) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function deriveMemory(sessions: SessionLog[]): SessionMemory {
  if (!sessions.length) return { sessionCount: 0 };

  // Sort newest first
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Last outcome
  const lastOutcome = normalizeOutcome(sorted[0].outcome) as SessionOutcome | undefined;

  // Most common effects (top 2 by average score ≥ 4)
  const effectAvgs = EFFECT_KEYS.map(({ key, label }) => {
    const vals = sessions
      .map((s) => s[key] as number | null)
      .filter((v): v is number => v !== null && v !== undefined);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { label, avg };
  })
    .filter((e) => e.avg >= 4)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 2)
    .map((e) => e.label);

  // Typical duration
  const durations = sessions
    .map((s) => s.effect_duration_bucket)
    .filter((d): d is string => !!d);
  const typicalDuration = mode(durations);

  // Typical dose
  const doses = sessions
    .map((s) => s.dose_level)
    .filter((d): d is NonNullable<typeof d> => !!d);
  const typicalDose = mode(doses);

  return {
    lastOutcome: lastOutcome || undefined,
    mostCommonEffects: effectAvgs.length ? effectAvgs : undefined,
    typicalDuration: typicalDuration || undefined,
    typicalDose: typicalDose || undefined,
    sessionCount: sessions.length,
  };
}

export function useSessionMemory(
  intent?: string,
  strainNameText?: string,
  batchId?: string
) {
  const { data: allSessions, isLoading } = useSessionLogs();

  const memory = useMemo(() => {
    if (!allSessions) return { sessionCount: 0 } as SessionMemory;

    // Filter to matching sessions
    let filtered = allSessions;

    if (strainNameText) {
      const lower = strainNameText.toLowerCase();
      filtered = filtered.filter(
        (s) => s.strain_name_text.toLowerCase() === lower
      );
    }

    if (intent) {
      filtered = filtered.filter((s) => s.intent === intent);
    }

    if (batchId) {
      filtered = filtered.filter((s) => (s as any).batch_id === batchId);
    }

    return deriveMemory(filtered);
  }, [allSessions, intent, strainNameText, batchId]);

  return { data: memory, isLoading };
}
