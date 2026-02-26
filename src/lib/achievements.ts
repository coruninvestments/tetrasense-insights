import { supabase } from "@/integrations/supabase/client";

export type AchievementKey =
  | "first_session"
  | "three_sessions"
  | "five_sessions"
  | "first_insight_view";

export interface AchievementDef {
  key: AchievementKey;
  title: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { key: "first_session", title: "First Light", description: "Logged your first session", emoji: "🌱" },
  { key: "three_sessions", title: "Getting the Hang", description: "Logged 3 sessions", emoji: "🌿" },
  { key: "five_sessions", title: "Seasoned Logger", description: "Logged 5 sessions", emoji: "🌳" },
  { key: "first_insight_view", title: "Data Explorer", description: "Viewed your insights for the first time", emoji: "🔍" },
];

export function getAchievementDef(key: string): AchievementDef | undefined {
  return ACHIEVEMENT_DEFS.find((a) => a.key === key);
}

/**
 * Attempt to unlock an achievement. Returns the key if newly unlocked, null otherwise.
 */
export async function tryUnlock(key: AchievementKey): Promise<AchievementKey | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { error } = await supabase.from("achievements").insert({
      user_id: user.id,
      key,
    } as any);

    // unique constraint violation = already unlocked
    if (error) return null;
    return key;
  } catch {
    return null;
  }
}

/**
 * Check session-count achievements given the new total.
 * Returns array of newly unlocked keys.
 */
export async function checkSessionAchievements(totalSessions: number): Promise<AchievementKey[]> {
  const unlocked: AchievementKey[] = [];

  if (totalSessions >= 1) {
    const r = await tryUnlock("first_session");
    if (r) unlocked.push(r);
  }
  if (totalSessions >= 3) {
    const r = await tryUnlock("three_sessions");
    if (r) unlocked.push(r);
  }
  if (totalSessions >= 5) {
    const r = await tryUnlock("five_sessions");
    if (r) unlocked.push(r);
  }

  return unlocked;
}
