import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "all";
    let dateFilter: string | null = null;
    if (range === "7d") dateFilter = new Date(Date.now() - 7 * 86400000).toISOString();
    else if (range === "30d") dateFilter = new Date(Date.now() - 30 * 86400000).toISOString();

    const admin = createClient(supabaseUrl, serviceKey);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    // ── Profiles ──
    const { data: allProfiles } = await admin.from("profiles").select("user_id, created_at, quick_log_enabled");
    const profiles = allProfiles ?? [];
    const totalUsers = profiles.length;
    const newUsers7d = profiles.filter((p: any) => p.created_at >= sevenDaysAgo).length;
    const newUsers30d = profiles.filter((p: any) => p.created_at >= thirtyDaysAgo).length;
    const { count: premiumUsers } = await admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true);

    // ── All sessions (unfiltered for challenge/activation) ──
    const { data: allSessionsRaw } = await admin.from("session_logs").select("user_id, created_at, dose_level, dose_amount_mg, effect_relaxation, effect_focus, effect_euphoria, effect_sleepiness, effect_pain_relief, effect_anxiety, time_of_day, setting, mood_before, stress_before, sleep_quality, aroma_tags, flavor_tags, effect_duration_bucket, notes, method, dose, strain_name_text, outcome");
    const allSessionsAll = allSessionsRaw ?? [];

    // Filtered sessions
    const sessions = dateFilter ? allSessionsAll.filter((s: any) => s.created_at >= dateFilter) : allSessionsAll;

    // ── Active users ──
    const activeUsers7d = new Set(allSessionsAll.filter((s: any) => s.created_at >= sevenDaysAgo).map((s: any) => s.user_id)).size;
    const activeUsers30d = new Set(allSessionsAll.filter((s: any) => s.created_at >= thirtyDaysAgo).map((s: any) => s.user_id)).size;

    // ── Session basics ──
    const totalSessions = sessions.length;
    const sessionUsers = new Set(sessions.map((s: any) => s.user_id));
    const avgSessionsPerUser = sessionUsers.size > 0 ? Math.round((totalSessions / sessionUsers.size) * 10) / 10 : 0;

    const completeSessions = sessions.filter((s: any) =>
      s.dose_level && (s.effect_relaxation || s.effect_focus || s.effect_euphoria) &&
      (s.time_of_day || s.setting || s.mood_before)
    );
    const completionRate = totalSessions > 0 ? Math.round((completeSessions.length / totalSessions) * 100) : 0;

    const quickLogs = sessions.filter((s: any) => s.dose === "quick" || (!s.effect_duration_bucket && !s.notes && !s.setting));
    const fullLogs = totalSessions - quickLogs.length;

    // ── Challenge / activation (always from all sessions) ──
    const userSessionCounts: Record<string, number> = {};
    const userFirstSession: Record<string, string> = {};
    const userSessionDates: Record<string, string[]> = {};
    for (const s of allSessionsAll) {
      userSessionCounts[s.user_id] = (userSessionCounts[s.user_id] || 0) + 1;
      if (!userFirstSession[s.user_id] || s.created_at < userFirstSession[s.user_id]) {
        userFirstSession[s.user_id] = s.created_at;
      }
      if (!userSessionDates[s.user_id]) userSessionDates[s.user_id] = [];
      userSessionDates[s.user_id].push(s.created_at);
    }

    const challengeStarted = Object.values(userSessionCounts).filter((c) => c >= 1).length;
    const reached3 = Object.values(userSessionCounts).filter((c) => c >= 3).length;
    const reached5 = Object.values(userSessionCounts).filter((c) => c >= 5).length;
    const reached10 = Object.values(userSessionCounts).filter((c) => c >= 10).length;
    const challengeCompletionRate = challengeStarted > 0 ? Math.round((reached10 / challengeStarted) * 100) : 0;

    // ── Activation metrics ──
    const activationRate = totalUsers > 0 ? Math.round((reached5 / totalUsers) * 100) : 0;
    const fingerprintUnlocks = reached5;
    const signalCardUnlocks = reached5;
    const genomeUnlocks = reached3;

    // Avg time to milestones (days from profile creation to Nth session)
    const profileCreatedMap: Record<string, string> = {};
    for (const p of profiles) profileCreatedMap[p.user_id] = p.created_at;

    function avgDaysToNthSession(n: number): number | null {
      const daysArr: number[] = [];
      for (const [uid, dates] of Object.entries(userSessionDates)) {
        if (dates.length < n) continue;
        const sorted = dates.sort();
        const profileDate = profileCreatedMap[uid];
        if (!profileDate) continue;
        const diff = (new Date(sorted[n - 1]).getTime() - new Date(profileDate).getTime()) / 86400000;
        if (diff >= 0) daysArr.push(diff);
      }
      if (daysArr.length === 0) return null;
      return Math.round((daysArr.reduce((a, b) => a + b, 0) / daysArr.length) * 10) / 10;
    }

    const avgTimeToFirst = avgDaysToNthSession(1);
    const avgTimeTo5 = avgDaysToNthSession(5);
    const avgTimeTo10 = avgDaysToNthSession(10);

    // ── Data quality ──
    const withDose = sessions.filter((s: any) => s.dose_level != null || (s.dose_amount_mg != null && s.dose_amount_mg > 0)).length;
    const withEffects = sessions.filter((s: any) => s.effect_relaxation > 0 || s.effect_focus > 0 || s.effect_euphoria > 0 || s.effect_sleepiness > 0 || s.effect_pain_relief > 0).length;
    const withContext = sessions.filter((s: any) => s.time_of_day || s.setting || s.mood_before || s.stress_before || s.sleep_quality).length;
    const withSensory = sessions.filter((s: any) => (s.aroma_tags?.length > 0) || (s.flavor_tags?.length > 0)).length;

    const pctDose = totalSessions > 0 ? Math.round((withDose / totalSessions) * 100) : 0;
    const pctEffects = totalSessions > 0 ? Math.round((withEffects / totalSessions) * 100) : 0;
    const pctContext = totalSessions > 0 ? Math.round((withContext / totalSessions) * 100) : 0;
    const pctSensory = totalSessions > 0 ? Math.round((withSensory / totalSessions) * 100) : 0;

    // Unique products per active user
    const userProducts: Record<string, Set<string>> = {};
    for (const s of sessions) {
      const name = s.strain_name_text?.toLowerCase().trim();
      if (!name) continue;
      if (!userProducts[s.user_id]) userProducts[s.user_id] = new Set();
      userProducts[s.user_id].add(name);
    }
    const activeUserProductCounts = Object.values(userProducts).map((s) => s.size);
    const avgUniqueProducts = activeUserProductCounts.length > 0
      ? Math.round((activeUserProductCounts.reduce((a, b) => a + b, 0) / activeUserProductCounts.length) * 10) / 10
      : 0;

    // ── Retention proxies ──
    // Avg days between sessions per user
    const gapDays: number[] = [];
    for (const dates of Object.values(userSessionDates)) {
      if (dates.length < 2) continue;
      const sorted = dates.sort();
      for (let i = 1; i < sorted.length; i++) {
        const gap = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
        gapDays.push(gap);
      }
    }
    const avgDaysBetweenSessions = gapDays.length > 0
      ? Math.round((gapDays.reduce((a, b) => a + b, 0) / gapDays.length) * 10) / 10
      : null;

    // Weekly returning: users with sessions in both current and previous 7-day window
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const usersThisWeek = new Set(allSessionsAll.filter((s: any) => s.created_at >= sevenDaysAgo).map((s: any) => s.user_id));
    const usersPrevWeek = new Set(allSessionsAll.filter((s: any) => s.created_at >= fourteenDaysAgo && s.created_at < sevenDaysAgo).map((s: any) => s.user_id));
    let weeklyReturning = 0;
    for (const uid of usersThisWeek) {
      if (usersPrevWeek.has(uid)) weeklyReturning++;
    }

    // ── Feature adoption from analytics ──
    const { data: analyticsRaw } = await admin.from("analytics_events").select("event_name");
    const eventCounts: Record<string, number> = {};
    for (const e of (analyticsRaw ?? [])) {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
    }

    const quickLogRate = totalSessions > 0 ? Math.round((quickLogs.length / totalSessions) * 100) : 0;
    const fullLogRate = totalSessions > 0 ? Math.round((fullLogs / totalSessions) * 100) : 0;

    // ── Method distribution ──
    const methodCounts: Record<string, number> = {};
    for (const s of sessions) methodCounts[s.method] = (methodCounts[s.method] || 0) + 1;
    const methodDistribution = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]).map(([method, count]) => ({ method, count }));

    // ── Top strains ──
    const strainCounts: Record<string, number> = {};
    for (const s of sessions) {
      const name = s.strain_name_text || "Unknown";
      strainCounts[name] = (strainCounts[name] || 0) + 1;
    }
    const topStrains = Object.entries(strainCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    // ── Sessions over time ──
    const dailySessions: Record<string, number> = {};
    for (const s of sessions) {
      const day = s.created_at.substring(0, 10);
      dailySessions[day] = (dailySessions[day] || 0) + 1;
    }
    const sessionsOverTime = Object.entries(dailySessions).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

    // ── Dose distribution ──
    const doseCounts: Record<string, number> = {};
    for (const s of sessions) doseCounts[s.dose_level || "unknown"] = (doseCounts[s.dose_level || "unknown"] || 0) + 1;

    // ── Achievements ──
    const { data: achievements } = await admin.from("achievements").select("key");
    const achievementCounts: Record<string, number> = {};
    for (const a of (achievements ?? [])) achievementCounts[a.key] = (achievementCounts[a.key] || 0) + 1;
    const topAchievements = Object.entries(achievementCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key, count]) => ({ key, count }));

    // ── Verified COA ──
    const { count: verifiedCoaCount } = await admin.from("product_batches").select("*", { count: "exact", head: true }).eq("coa_status", "verified");

    // ── Support tickets ──
    const { data: allTickets } = await admin.from("support_tickets").select("type, status, created_at");
    const tickets = allTickets ?? [];
    const ticketsByType: Record<string, number> = {};
    let unresolvedCount = 0;
    for (const t of tickets) {
      ticketsByType[t.type] = (ticketsByType[t.type] || 0) + 1;
      if (t.status === "new" || t.status === "open") unresolvedCount++;
    }
    const recentTickets = tickets
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((t: any) => ({ type: t.type, status: t.status, created_at: t.created_at }));

    // Bug trend (last 4 weeks)
    const bugsByWeek: number[] = [0, 0, 0, 0];
    const now = Date.now();
    for (const t of tickets) {
      if (t.type !== "bug") continue;
      const age = (now - new Date(t.created_at).getTime()) / 86400000;
      if (age < 7) bugsByWeek[0]++;
      else if (age < 14) bugsByWeek[1]++;
      else if (age < 21) bugsByWeek[2]++;
      else if (age < 28) bugsByWeek[3]++;
    }

    const supportCount = tickets.filter((t: any) => t.type === "support" || t.type === "bug").length;
    const feedbackCount = tickets.filter((t: any) => t.type === "feedback" || t.type === "feature_request").length;
    const supportFeedbackRatio = feedbackCount > 0 ? Math.round((supportCount / feedbackCount) * 10) / 10 : null;

    const metrics = {
      users: {
        total: totalUsers,
        active7d: activeUsers7d,
        active30d: activeUsers30d,
        newUsers7d,
        newUsers30d,
        premium: premiumUsers ?? 0,
      },
      sessions: {
        total: totalSessions,
        avgPerUser: avgSessionsPerUser,
        completionRate,
        quickLogs: quickLogs.length,
        fullLogs,
      },
      challenge: {
        started: challengeStarted,
        reached3,
        reached5,
        reached10,
        completionRate: challengeCompletionRate,
      },
      unlocks: {
        fingerprint: fingerprintUnlocks,
        signalCard: signalCardUnlocks,
        genome: genomeUnlocks,
      },
      activation: {
        activationRate,
        avgTimeToFirst,
        avgTimeTo5,
        avgTimeTo10,
      },
      dataQuality: {
        avgCompleteness: completionRate,
        pctDose,
        pctEffects,
        pctContext,
        pctSensory,
        avgUniqueProducts,
      },
      retention: {
        active7d: activeUsers7d,
        active30d: activeUsers30d,
        avgSessionsPerActiveUser: avgSessionsPerUser,
        avgDaysBetweenSessions,
        weeklyReturning,
      },
      featureAdoption: {
        quickLogRate,
        fullLogRate,
        compareUsage: eventCounts["opened_compare"] ?? 0,
        exportUsage: eventCounts["export_report"] ?? 0,
        communityViews: eventCounts["viewed_community_insights"] ?? 0,
        supportCreationRate: tickets.length,
        mostUsedEvents: Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count })),
      },
      supportHealth: {
        total: tickets.length,
        byType: ticketsByType,
        unresolved: unresolvedCount,
        bugTrend: bugsByWeek,
        supportFeedbackRatio,
        recent: recentTickets,
      },
      topAchievements,
      methodDistribution,
      topStrains,
      sessionsOverTime,
      doseDistribution: doseCounts,
      verifiedCoaCount: verifiedCoaCount ?? 0,
      analyticsEvents: eventCounts,
      // Keep old support key for backward compat
      support: {
        total: tickets.length,
        byType: ticketsByType,
        unresolved: unresolvedCount,
        recent: recentTickets,
      },
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
