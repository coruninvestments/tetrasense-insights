import type { SessionLog } from "@/hooks/useSessionLogs";

export interface StreakResult {
  loggingStreak: number;
  longestLoggingStreak: number;
  reliabilityStreak: number;
  longestReliabilityStreak: number;
  lastLogDate: string | null;
}

/** YYYY-MM-DD key in local timezone */
function dayKey(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayKey(): string {
  return dayKey(new Date().toISOString());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d.toISOString());
}

/** Subtract days and return YYYY-MM-DD */
function subtractDays(key: string, n: number): string {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() - n);
  return dayKey(d.toISOString());
}

/** Calculate consecutive day streak going backwards from today/yesterday.
 *  48-hour resilience: streak stays active if last log was yesterday. */
function calcStreak(daySet: Set<string>): { current: number; longest: number } {
  if (daySet.size === 0) return { current: 0, longest: 0 };

  const today = todayKey();
  const yesterday = yesterdayKey();

  // Determine starting point: today or yesterday (48h resilience)
  let anchor: string;
  if (daySet.has(today)) {
    anchor = today;
  } else if (daySet.has(yesterday)) {
    anchor = yesterday;
  } else {
    // Streak broken — still compute longest
    return { current: 0, longest: computeLongest(daySet) };
  }

  let current = 0;
  let cursor = anchor;
  while (daySet.has(cursor)) {
    current++;
    cursor = subtractDays(cursor, 1);
  }

  const longest = Math.max(current, computeLongest(daySet));
  return { current, longest };
}

/** Compute longest streak from any sorted day set */
function computeLongest(daySet: Set<string>): number {
  if (daySet.size === 0) return 0;
  const sorted = Array.from(daySet).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const expected = subtractDays(sorted[i], -0); // sorted[i] itself
    const prev = sorted[i - 1];
    // Check if previous day is exactly 1 day before
    if (subtractDays(sorted[i], 1) === prev) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  return longest;
}

/** A session qualifies for reliability if it has intent, dose, and at least one effect recorded */
function isReliableSession(s: SessionLog): boolean {
  const hasIntent = !!s.intent;
  const hasDose = !!s.dose || !!s.dose_level;
  const hasEffects =
    (s.effect_relaxation != null && s.effect_relaxation > 0) ||
    (s.effect_focus != null && s.effect_focus > 0) ||
    (s.effect_sleepiness != null && s.effect_sleepiness > 0) ||
    (s.effect_anxiety != null && s.effect_anxiety > 0) ||
    (s.effect_pain_relief != null && s.effect_pain_relief > 0) ||
    (s.effect_euphoria != null && s.effect_euphoria > 0);
  return hasIntent && hasDose && hasEffects;
}

export function computeStreaks(sessions: SessionLog[]): StreakResult {
  if (!sessions || sessions.length === 0) {
    return {
      loggingStreak: 0,
      longestLoggingStreak: 0,
      reliabilityStreak: 0,
      longestReliabilityStreak: 0,
      lastLogDate: null,
    };
  }

  // Build sets of unique days
  const loggingDays = new Set<string>();
  const reliabilityDays = new Set<string>();

  for (const s of sessions) {
    const dk = dayKey(s.created_at);
    loggingDays.add(dk);
    if (isReliableSession(s)) {
      reliabilityDays.add(dk);
    }
  }

  const logging = calcStreak(loggingDays);
  const reliability = calcStreak(reliabilityDays);

  // Find most recent log date
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    loggingStreak: logging.current,
    longestLoggingStreak: logging.longest,
    reliabilityStreak: reliability.current,
    longestReliabilityStreak: reliability.longest,
    lastLogDate: sorted[0]?.created_at ?? null,
  };
}
