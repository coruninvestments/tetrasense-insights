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

    // Verify caller is admin using their JWT
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

    // Parse time filter
    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "all"; // 7d, 30d, all
    let dateFilter: string | null = null;
    if (range === "7d") {
      dateFilter = new Date(Date.now() - 7 * 86400000).toISOString();
    } else if (range === "30d") {
      dateFilter = new Date(Date.now() - 30 * 86400000).toISOString();
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // ── User metrics ──
    const { count: totalUsers } = await admin.from("profiles").select("*", { count: "exact", head: true });

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const { count: newUsers7d } = await admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
    const { count: newUsers30d } = await admin.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo);
    const { count: premiumUsers } = await admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true);

    // Active users (users with sessions in period)
    const { data: activeUsers7dData } = await admin.from("session_logs").select("user_id").gte("created_at", sevenDaysAgo);
    const activeUsers7d = new Set(activeUsers7dData?.map((r: any) => r.user_id)).size;

    const { data: activeUsers30dData } = await admin.from("session_logs").select("user_id").gte("created_at", thirtyDaysAgo);
    const activeUsers30d = new Set(activeUsers30dData?.map((r: any) => r.user_id)).size;

    // ── Session metrics ──
    let sessionQuery = admin.from("session_logs").select("*");
    if (dateFilter) sessionQuery = sessionQuery.gte("created_at", dateFilter);
    const { data: allSessions } = await sessionQuery;
    const sessions = allSessions ?? [];

    const totalSessions = sessions.length;
    const sessionUsers = new Set(sessions.map((s: any) => s.user_id));
    const avgSessionsPerUser = sessionUsers.size > 0 ? Math.round((totalSessions / sessionUsers.size) * 10) / 10 : 0;

    // Complete = has effects + dose_level + context
    const completeSessions = sessions.filter((s: any) =>
      s.dose_level && (s.effect_relaxation || s.effect_focus || s.effect_euphoria) &&
      (s.time_of_day || s.setting || s.mood_before)
    );
    const completionRate = totalSessions > 0 ? Math.round((completeSessions.length / totalSessions) * 100) : 0;

    // Quick vs full (quick logs have dose like "quick_*" pattern or minimal fields)
    const quickLogs = sessions.filter((s: any) => s.dose === "quick" || (!s.effect_duration_bucket && !s.notes && !s.setting));
    const fullLogs = totalSessions - quickLogs.length;

    // ── Challenge metrics (derived from session counts per user) ──
    const userSessionCounts: Record<string, number> = {};
    for (const s of sessions) {
      userSessionCounts[s.user_id] = (userSessionCounts[s.user_id] || 0) + 1;
    }
    // For challenge, we need ALL sessions, not filtered
    const { data: allSessionsForChallenge } = await admin.from("session_logs").select("user_id");
    const challengeCounts: Record<string, number> = {};
    for (const s of (allSessionsForChallenge ?? [])) {
      challengeCounts[s.user_id] = (challengeCounts[s.user_id] || 0) + 1;
    }
    const challengeStarted = Object.values(challengeCounts).filter((c) => c >= 1).length;
    const reached3 = Object.values(challengeCounts).filter((c) => c >= 3).length;
    const reached5 = Object.values(challengeCounts).filter((c) => c >= 5).length;
    const reached10 = Object.values(challengeCounts).filter((c) => c >= 10).length;
    const challengeCompletionRate = challengeStarted > 0 ? Math.round((reached10 / challengeStarted) * 100) : 0;

    // ── Unlock counts (from all sessions per user) ──
    const fingerprintUnlocks = Object.values(challengeCounts).filter((c) => c >= 5).length;
    const signalCardUnlocks = fingerprintUnlocks; // same threshold
    const genomeUnlocks = Object.values(challengeCounts).filter((c) => c >= 3).length;

    // ── Achievement metrics ──
    const { data: achievements } = await admin.from("achievements").select("key");
    const achievementCounts: Record<string, number> = {};
    for (const a of (achievements ?? [])) {
      achievementCounts[a.key] = (achievementCounts[a.key] || 0) + 1;
    }
    const topAchievements = Object.entries(achievementCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));

    // ── Method distribution ──
    const methodCounts: Record<string, number> = {};
    for (const s of sessions) {
      methodCounts[s.method] = (methodCounts[s.method] || 0) + 1;
    }
    const methodDistribution = Object.entries(methodCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([method, count]) => ({ method, count }));

    // ── Most logged strains ──
    const strainCounts: Record<string, number> = {};
    for (const s of sessions) {
      const name = s.strain_name_text || "Unknown";
      strainCounts[name] = (strainCounts[name] || 0) + 1;
    }
    const topStrains = Object.entries(strainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // ── Sessions over time (daily buckets) ──
    const dailySessions: Record<string, number> = {};
    for (const s of sessions) {
      const day = s.created_at.substring(0, 10);
      dailySessions[day] = (dailySessions[day] || 0) + 1;
    }
    const sessionsOverTime = Object.entries(dailySessions)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    // ── Dose level distribution ──
    const doseCounts: Record<string, number> = {};
    for (const s of sessions) {
      const dl = s.dose_level || "unknown";
      doseCounts[dl] = (doseCounts[dl] || 0) + 1;
    }

    // ── Verified COA products ──
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

    // ── Analytics events ──
    const { data: analyticsEvents } = await admin.from("analytics_events").select("event_name");
    const eventCounts: Record<string, number> = {};
    for (const e of (analyticsEvents ?? [])) {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
    }

    const metrics = {
      users: {
        total: totalUsers ?? 0,
        active7d: activeUsers7d,
        active30d: activeUsers30d,
        newUsers7d: newUsers7d ?? 0,
        newUsers30d: newUsers30d ?? 0,
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
      topAchievements,
      methodDistribution,
      topStrains,
      sessionsOverTime,
      doseDistribution: doseCounts,
      verifiedCoaCount: verifiedCoaCount ?? 0,
      analyticsEvents: eventCounts,
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
