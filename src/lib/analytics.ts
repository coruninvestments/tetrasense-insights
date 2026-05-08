import { supabase } from "@/integrations/supabase/client";

type AnalyticsEvent =
  | "user_created"
  | "onboarding_started"
  | "onboarding_completed"
  | "onboarding_skipped"
  // Activation funnel
  | "session_logged"
  | "session_2_logged"
  | "session_5_logged"
  | "session_10_logged"
  // Engagement
  | "app_opened"
  | "match_viewed"
  | "product_viewed"
  | "viewed_insights"
  | "used_todays_goal"
  | "toggled_community_sharing"
  | "viewed_session_replay"
  | "tapped_similar_session"
  | "opened_compare"
  | "viewed_confidence_meter"
  | "tapped_confidence_cta"
  | "streak_incremented"
  | "viewed_streak_card"
  // COA
  | "coa_import_started"
  | "coa_import_completed"
  // Retention
  | "returned_24h"
  | "returned_7d"
  | "blocked_client_write_premium"
  // Legacy milestones (kept for compat)
  | "first_session_logged"
  | "sessions_logged_count_milestone";

export async function logEvent(eventName: AnalyticsEvent, metadata?: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: eventName,
      metadata: metadata ?? {},
    } as any);
  } catch {
    // Fire-and-forget — never block UI
  }
}

/** Check if a specific event has already been fired for the current user (dedup) */
async function hasEvent(eventName: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true; // safe default: assume fired
    const { count } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_name", eventName);
    return (count ?? 0) > 0;
  } catch {
    return true;
  }
}

/** Fire a milestone event only once per user */
async function logOnce(eventName: AnalyticsEvent, metadata?: Record<string, unknown>) {
  const already = await hasEvent(eventName);
  if (!already) {
    await logEvent(eventName, metadata);
  }
}

const MILESTONE_THRESHOLDS = [3, 5, 10] as const;

/** Call after a session is created with the new total count */
export function checkSessionMilestones(newTotal: number) {
  // Always fire the generic session_logged
  logEvent("session_logged", { total: newTotal });

  // One-time milestone events
  if (newTotal === 1) {
    logOnce("first_session_logged");
  }
  if (newTotal === 2) {
    logOnce("session_2_logged");
  }
  if (newTotal === 5) {
    logOnce("session_5_logged");
  }
  if (newTotal === 10) {
    logOnce("session_10_logged");
  }
  if ((MILESTONE_THRESHOLDS as readonly number[]).includes(newTotal)) {
    logEvent("sessions_logged_count_milestone", { total: newTotal });
  }
}

/** Fire retention events based on user's session history. Call on app open. */
export async function checkRetentionEvents() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: sessions } = await supabase
      .from("session_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (!sessions || sessions.length === 0) return;

    const firstSessionDate = new Date(sessions[0].created_at);
    const now = Date.now();
    const hoursSinceFirst = (now - firstSessionDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceFirst >= 24) {
      await logOnce("returned_24h");
    }
    if (hoursSinceFirst >= 168) { // 7 days
      await logOnce("returned_7d");
    }
  } catch {
    // fire-and-forget
  }
}

/** Fire app_opened event (once per browser session via sessionStorage) */
export function trackAppOpened() {
  const key = "sl_app_opened_tracked";
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
  logEvent("app_opened");
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
}
