import { supabase } from "@/integrations/supabase/client";

type AnalyticsEvent =
  | "onboarding_completed"
  | "first_session_logged"
  | "sessions_logged_count_milestone"
  | "viewed_insights"
  | "used_todays_goal"
  | "toggled_community_sharing"
  | "viewed_session_replay"
  | "tapped_similar_session"
  | "opened_compare"
  | "viewed_confidence_meter"
  | "tapped_confidence_cta"
  | "streak_incremented"
  | "viewed_streak_card";

export async function logEvent(eventName: AnalyticsEvent) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: eventName,
    } as any);
  } catch {
    // Fire-and-forget — never block UI
  }
}

const MILESTONE_THRESHOLDS = [3, 5, 10] as const;

/** Call after a session is created with the new total count */
export function checkSessionMilestones(newTotal: number) {
  if (newTotal === 1) {
    logEvent("first_session_logged");
  }
  if ((MILESTONE_THRESHOLDS as readonly number[]).includes(newTotal)) {
    logEvent("sessions_logged_count_milestone");
  }
}
