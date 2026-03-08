import { supabase } from "@/integrations/supabase/client";
import {
  Sprout, TreePine, Trees, Leaf, Mountain, Telescope, Beaker,
  FlaskConical, Brain, ShieldCheck, Sparkles, type LucideIcon,
} from "lucide-react";

/* ── Point values ── */
const POINTS: Record<string, number> = {
  log_session: 10,
  complete_session: 20,
  flavor_aroma: 5,
  new_product: 15,
  challenge_milestone: 25,
  challenge_complete: 100,
  learning_module: 10,
  share_profile: 25,
  compare_products: 10,
  first_verified_coa: 20,
};

/* ── Anti-spam: max CP earnable per day from session logging ── */
const DAILY_SESSION_CP_CAP = 80;

/* ── Levels ── */
interface LevelDef { name: string; minPoints: number }
const LEVELS: LevelDef[] = [
  { name: "Novice", minPoints: 0 },
  { name: "Explorer", minPoints: 100 },
  { name: "Connoisseur", minPoints: 300 },
  { name: "Expert", minPoints: 600 },
  { name: "Signal Master", minPoints: 1000 },
];

function getLevel(points: number): { current: string; next: string | null; pointsToNext: number } {
  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) { idx = i; break; }
  }
  const nextLevel = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  return {
    current: LEVELS[idx].name,
    next: nextLevel?.name ?? null,
    pointsToNext: nextLevel ? nextLevel.minPoints - points : 0,
  };
}

/* ── Expanded achievements ── */
export type CPAchievementKey =
  | "first_signal"
  | "pattern_hunter"
  | "flavor_explorer"
  | "context_tracker"
  | "strain_scientist"
  | "signal_builder"
  | "learning_mind"
  | "verified_explorer"
  | "signal_master";

export interface CPAchievementDef {
  key: CPAchievementKey;
  title: string;
  description: string;
  icon: LucideIcon;
  check: (ctx: ActivityContext) => boolean;
}

interface ActivityContext {
  totalSessions: number;
  completeSessions: number;
  sensoryLogs: number;
  uniqueStrains: number;
  challengeMilestones: number;
  challengeComplete: boolean;
  learningModules: number;
  hasVerifiedCoa: boolean;
  profileShared: boolean;
}

export const CP_ACHIEVEMENTS: CPAchievementDef[] = [
  { key: "first_signal", title: "First Signal", description: "Logged your first session", icon: Sprout, check: (c) => c.totalSessions >= 1 },
  { key: "pattern_hunter", title: "Pattern Hunter", description: "Logged 10 complete sessions", icon: Telescope, check: (c) => c.completeSessions >= 10 },
  { key: "flavor_explorer", title: "Flavor Explorer", description: "Logged sensory details 5 times", icon: FlaskConical, check: (c) => c.sensoryLogs >= 5 },
  { key: "context_tracker", title: "Context Tracker", description: "Logged 15 sessions with full context", icon: Brain, check: (c) => c.completeSessions >= 15 },
  { key: "strain_scientist", title: "Strain Scientist", description: "Explored 10 unique strains", icon: Beaker, check: (c) => c.uniqueStrains >= 10 },
  { key: "signal_builder", title: "Signal Builder", description: "Completed your calibration challenge", icon: TreePine, check: (c) => c.challengeComplete },
  { key: "learning_mind", title: "Learning Mind", description: "Completed 3 learning modules", icon: Leaf, check: (c) => c.learningModules >= 3 },
  { key: "verified_explorer", title: "Verified Explorer", description: "Logged a verified COA product", icon: ShieldCheck, check: (c) => c.hasVerifiedCoa },
  { key: "signal_master", title: "Signal Master", description: "Reached Signal Master level", icon: Mountain, check: (c) => c.totalSessions >= 30 && c.completeSessions >= 20 && c.uniqueStrains >= 8 },
];

export function getCPAchievementDef(key: string): CPAchievementDef | undefined {
  return CP_ACHIEVEMENTS.find((a) => a.key === key);
}

/* ── Main output ── */
export interface ConnoisseurPointsResult {
  totalPoints: number;
  currentLevel: string;
  nextLevel: string | null;
  pointsToNext: number;
  progressPercent: number;
  unlockedAchievements: { key: CPAchievementKey; title: string; description: string; unlockedAt?: string }[];
  recentUnlocks: { key: CPAchievementKey; title: string; description: string; unlockedAt?: string }[];
}

/* ── Compute points from session data ── */
export async function computeConnoisseurPoints(userId: string): Promise<ConnoisseurPointsResult> {
  // Fetch all sessions
  const { data: sessions } = await supabase
    .from("session_logs")
    .select("id, created_at, effect_relaxation, effect_focus, effect_euphoria, effect_anxiety, effect_pain_relief, effect_sleepiness, dose_level, mood_before, stress_before, setting, aroma_tags, flavor_tags, outcome, strain_name_text, coa_attached, method")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const logs = (sessions ?? []) as any[];

  // Fetch achievements already stored
  const { data: existingAch } = await supabase
    .from("achievements")
    .select("key, unlocked_at")
    .eq("user_id", userId);
  const achMap = new Map((existingAch ?? []).map((a: any) => [a.key, a.unlocked_at]));

  // Build activity context
  const uniqueStrains = new Set(logs.map((l) => l.strain_name_text?.toLowerCase())).size;
  const sensoryLogs = logs.filter((l) => (l.aroma_tags?.length > 0 || l.flavor_tags?.length > 0)).length;
  const completeSessions = logs.filter((l) => l.dose_level && l.mood_before && l.stress_before).length;
  const hasVerifiedCoa = logs.some((l) => l.coa_attached);
  const challengeComplete = achMap.has("signal_builder") || logs.length >= 10;
  const challengeMilestones = [1, 3, 5, 7, 10].filter((n) => logs.length >= n).length;

  // Compute raw points with daily cap for session-based CP
  let totalPoints = 0;
  const dailySessionCP = new Map<string, number>();

  for (const log of logs) {
    const day = log.created_at?.substring(0, 10) ?? "unknown";
    const daySoFar = dailySessionCP.get(day) ?? 0;

    let sessionCP = POINTS.log_session;
    if (log.dose_level && log.mood_before && log.stress_before) {
      sessionCP = POINTS.complete_session;
    }
    if (log.aroma_tags?.length > 0 || log.flavor_tags?.length > 0) {
      sessionCP += POINTS.flavor_aroma;
    }

    // Apply daily cap
    const allowed = Math.min(sessionCP, DAILY_SESSION_CP_CAP - daySoFar);
    if (allowed > 0) {
      totalPoints += allowed;
      dailySessionCP.set(day, daySoFar + allowed);
    }
  }

  // Count unique products logged (first time a new strain appears)
  const seenStrains = new Set<string>();
  for (const log of logs) {
    const key = log.strain_name_text?.toLowerCase();
    if (key && !seenStrains.has(key)) {
      seenStrains.add(key);
      if (seenStrains.size > 1) totalPoints += POINTS.new_product; // skip the first one (already counted in session)
    }
  }

  // Challenge milestones
  totalPoints += challengeMilestones * POINTS.challenge_milestone;
  if (challengeComplete) totalPoints += POINTS.challenge_complete;

  // First verified COA
  if (hasVerifiedCoa) totalPoints += POINTS.first_verified_coa;

  // Check profile sharing / learning (from analytics events)
  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_name")
    .eq("user_id", userId)
    .in("event_name", ["share_profile", "compare_products", "learning_module_complete"]);

  const eventNames = (events ?? []).map((e: any) => e.event_name);
  const profileShared = eventNames.includes("share_profile");
  const learningModules = eventNames.filter((e: string) => e === "learning_module_complete").length;

  if (profileShared) totalPoints += POINTS.share_profile;
  if (eventNames.includes("compare_products")) totalPoints += POINTS.compare_products;
  totalPoints += learningModules * POINTS.learning_module;

  // Check achievements
  const activityCtx: ActivityContext = {
    totalSessions: logs.length,
    completeSessions,
    sensoryLogs,
    uniqueStrains,
    challengeMilestones,
    challengeComplete,
    learningModules,
    hasVerifiedCoa,
    profileShared,
  };

  const unlockedAchievements: ConnoisseurPointsResult["unlockedAchievements"] = [];
  for (const def of CP_ACHIEVEMENTS) {
    if (def.check(activityCtx)) {
      unlockedAchievements.push({
        key: def.key,
        title: def.title,
        description: def.description,
        unlockedAt: achMap.get(def.key) ?? undefined,
      });
    }
  }

  // Recent unlocks = last 3 with dates
  const recentUnlocks = [...unlockedAchievements]
    .filter((a) => a.unlockedAt)
    .sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""))
    .slice(0, 3);

  const level = getLevel(totalPoints);
  const currentLevelDef = LEVELS.find((l) => l.name === level.current)!;
  const nextLevelDef = LEVELS.find((l) => l.name === level.next);
  const progressPercent = nextLevelDef
    ? Math.round(((totalPoints - currentLevelDef.minPoints) / (nextLevelDef.minPoints - currentLevelDef.minPoints)) * 100)
    : 100;

  return {
    totalPoints,
    currentLevel: level.current,
    nextLevel: level.next,
    pointsToNext: level.pointsToNext,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    unlockedAchievements,
    recentUnlocks,
  };
}

export { POINTS as CP_POINT_VALUES, LEVELS as CP_LEVELS };
