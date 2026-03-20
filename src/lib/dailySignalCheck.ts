/**
 * Daily Signal Check — generates 1–2 personalized nudge messages per day
 * based on session history, tolerance, and match engine status.
 */

import type { SessionLog } from "@/hooks/useSessionLogs";
import { differenceInDays, differenceInHours } from "date-fns";

export interface DailySignal {
  id: string;
  message: string;
  icon: "flame" | "target" | "trending" | "star" | "zap";
  priority: number; // higher = more important
}

const STORAGE_KEY = "signal-leaf-daily-check";

/** Returns true if the daily check was already shown today */
export function wasShownToday(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  const storedDate = new Date(stored).toDateString();
  return storedDate === new Date().toDateString();
}

/** Mark today as shown */
export function markShownToday(): void {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

interface SignalContext {
  sessions: SessionLog[];
  toleranceLevel?: string;
  toleranceTrend?: string;
}

export function generateDailySignals(ctx: SignalContext): DailySignal[] {
  const { sessions, toleranceLevel, toleranceTrend } = ctx;
  if (!sessions.length) return [];

  const signals: DailySignal[] = [];
  const total = sessions.length;
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const lastSession = sorted[0];
  const hoursSinceLast = differenceInHours(new Date(), new Date(lastSession.created_at));
  const daysSinceLast = differenceInDays(new Date(), new Date(lastSession.created_at));

  // Best session (highest positive outcome with high euphoria/relaxation)
  const bestSession = sorted.find((s) => s.outcome === "positive");

  // ── Milestone proximity ──
  const milestones = [5, 10, 25, 50];
  for (const m of milestones) {
    if (total < m && total >= m - 2) {
      signals.push({
        id: `milestone-${m}`,
        message: `You're ${m - total} session${m - total > 1 ? "s" : ""} away from ${m} — keep building your Signal`,
        icon: "target",
        priority: 80,
      });
      break;
    }
  }

  // ── Match engine readiness ──
  if (total < 5) {
    signals.push({
      id: "match-unlock",
      message: `Log ${5 - total} more session${5 - total > 1 ? "s" : ""} to unlock personalized product matching`,
      icon: "zap",
      priority: 90,
    });
  }

  // ── Repeat best session ──
  if (bestSession && daysSinceLast >= 1) {
    const daysSinceBest = differenceInDays(new Date(), new Date(bestSession.created_at));
    if (daysSinceBest <= 7 && daysSinceBest >= 1) {
      signals.push({
        id: "repeat-best",
        message: `Your best session was ${daysSinceBest} day${daysSinceBest > 1 ? "s" : ""} ago with ${bestSession.strain_name_text} — want to repeat it?`,
        icon: "star",
        priority: 70,
      });
    }
  }

  // ── Tolerance nudge ──
  if (toleranceTrend === "rising" && toleranceLevel && ["High", "Very High"].includes(toleranceLevel)) {
    signals.push({
      id: "tolerance-rising",
      message: "Your tolerance is trending up — consider a lighter dose or a rest day",
      icon: "trending",
      priority: 60,
    });
  }

  // ── Profile forming ──
  if (total >= 3 && total < 10) {
    signals.push({
      id: "profile-forming",
      message: "Your personal Signal profile is forming — each session sharpens your insights",
      icon: "flame",
      priority: 40,
    });
  }

  // ── Come back nudge ──
  if (daysSinceLast >= 3 && daysSinceLast <= 14) {
    signals.push({
      id: "come-back",
      message: `It's been ${daysSinceLast} days since your last session — log one to keep your insights fresh`,
      icon: "flame",
      priority: 75,
    });
  }

  // ── Streak building ──
  if (hoursSinceLast < 36 && total >= 2) {
    // Check if they logged yesterday too
    const yesterday = sorted.find((s) => {
      const d = differenceInDays(new Date(), new Date(s.created_at));
      return d === 1;
    });
    if (yesterday) {
      signals.push({
        id: "streak",
        message: "You're on a logging streak — consistency builds better matches",
        icon: "flame",
        priority: 50,
      });
    }
  }

  // Sort by priority descending and return top 2
  signals.sort((a, b) => b.priority - a.priority);
  return signals.slice(0, 2);
}
