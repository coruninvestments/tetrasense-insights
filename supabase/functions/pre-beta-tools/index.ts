import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Early auth guard: reject requests with no Authorization header
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
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

    const { data: { user } } = await userClient.auth.getUser();
    const adminUserId = user?.id;

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const action = body.action as string;

    // ── Dry Run ──
    if (action === "dry_run") {
      const { count: userCount } = await admin.from("profiles").select("*", { count: "exact", head: true });
      const { count: sessionCount } = await admin.from("session_logs").select("*", { count: "exact", head: true });
      const { count: ticketCount } = await admin.from("support_tickets").select("*", { count: "exact", head: true });
      const { count: achievementCount } = await admin.from("achievements").select("*", { count: "exact", head: true });
      const { count: analyticsCount } = await admin.from("analytics_events").select("*", { count: "exact", head: true });
      const { count: draftBatchCount } = await admin.from("product_batches").select("*", { count: "exact", head: true }).eq("is_public_library", false);
      const { count: feedbackCount } = await admin.from("feedback").select("*", { count: "exact", head: true });

      return new Response(JSON.stringify({
        users: userCount ?? 0,
        sessions: sessionCount ?? 0,
        tickets: ticketCount ?? 0,
        achievements: achievementCount ?? 0,
        analytics: analyticsCount ?? 0,
        draftBatches: draftBatchCount ?? 0,
        feedback: feedbackCount ?? 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Readiness Check ──
    if (action === "readiness") {
      const { count: unresolvedTickets } = await admin.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["new", "open"]);
      const { count: totalUsers } = await admin.from("profiles").select("*", { count: "exact", head: true });
      const { count: totalSessions } = await admin.from("session_logs").select("*", { count: "exact", head: true });
      const { count: founderBadges } = await admin.from("achievements").select("*", { count: "exact", head: true }).eq("key", "founding_user");
      const { data: adminRoles } = await admin.from("user_roles").select("role, user_id");

      const creatorCount = (adminRoles ?? []).filter((r: any) => r.role === "moderator").length;
      const devCount = (adminRoles ?? []).filter((r: any) => r.role === "admin").length;

      return new Response(JSON.stringify({
        unresolvedTickets: unresolvedTickets ?? 0,
        totalUsers: totalUsers ?? 0,
        totalSessions: totalSessions ?? 0,
        founderBadges: founderBadges ?? 0,
        creatorAccounts: creatorCount,
        devAccounts: devCount,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Assign founder identity ──
    if (action === "assign_identity") {
      const targetRole = body.role as string; // "creator" or "developer"
      const targetUserId = body.user_id as string;

      if (!targetUserId || !["creator", "developer"].includes(targetRole)) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map: creator → moderator role, developer → admin role
      const dbRole = targetRole === "creator" ? "moderator" : "admin";

      const { error } = await admin.from("user_roles").upsert(
        { user_id: targetUserId, role: dbRole },
        { onConflict: "user_id,role" }
      );

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log admin action
      await admin.from("analytics_events").insert({
        user_id: adminUserId,
        event_name: `admin_assign_${targetRole}`,
      });

      return new Response(JSON.stringify({ success: true, role: targetRole, user_id: targetUserId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Beta Reset (stubbed — legacy) ──
    if (action === "beta_reset") {
      const confirmation = body.confirmation as string;
      if (confirmation !== "RESET FOR BETA") {
        return new Response(JSON.stringify({ error: "Invalid confirmation phrase" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await admin.from("analytics_events").insert({
        user_id: adminUserId,
        event_name: "admin_beta_reset_requested",
      });
      return new Response(JSON.stringify({
        success: false,
        message: "Use 'full_beta_reset' action instead. This legacy stub is preserved for audit.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Full Beta Reset ──
    if (action === "full_beta_reset") {
      const confirmation = body.confirmation as string;
      const preserveAdmin = body.preserve_admin !== false; // default true

      if (confirmation !== "RESET SIGNAL LEAF BETA") {
        return new Response(JSON.stringify({ error: "Invalid confirmation phrase" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log intent BEFORE deleting analytics
      await admin.from("analytics_events").insert({
        user_id: adminUserId,
        event_name: "admin_full_beta_reset_executed",
        metadata: { timestamp: new Date().toISOString(), preserve_admin: preserveAdmin },
      });

      const deleted: Record<string, number> = {};

      // 1. Delete user-generated data (order matters for FK constraints)
      for (const table of [
        "feedback",
        "support_tickets",
        "achievements",
        "analytics_events",
        "session_logs",
      ]) {
        const { count } = await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").select("*", { count: "exact", head: true });
        deleted[table] = count ?? 0;
      }

      // 2. Clear product ecosystem (FK order: compounds → batches → ingestions → products)
      for (const table of [
        "batch_terpenes",
        "batch_cannabinoids",
        "coa_ingestions",
        "product_batches",
        "products",
      ]) {
        const { count } = await admin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").select("*", { count: "exact", head: true });
        deleted[table] = count ?? 0;
      }

      // 3. Clear community stats
      const { count: statsCount } = await admin.from("community_strain_stats").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("*", { count: "exact", head: true });
      deleted["community_strain_stats"] = statsCount ?? 0;

      // 4. Reset verified_batch_count on strains_canonical
      await admin.from("strains_canonical").update({ verified_batch_count: 0 }).neq("id", "00000000-0000-0000-0000-000000000000");

      // 5. Reset profiles (clear active references)
      await admin.from("profiles").update({
        active_batch_id: null,
        active_product_id: null,
        active_strain_id: null,
        onboarding_completed: false,
        calibration_anchors: null,
        dismissed_tip_ids: [],
      }).neq("id", "00000000-0000-0000-0000-000000000000");

      // 6. Delete users (via admin auth API) — preserve current admin if requested
      if (preserveAdmin && adminUserId) {
        // Delete all user_roles except admin's
        await admin.from("user_roles").delete().neq("user_id", adminUserId);
        // Delete all profiles except admin's
        await admin.from("profiles").delete().neq("user_id", adminUserId);
        // Delete auth users except admin
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
        let usersDeleted = 0;
        for (const u of (authUsers?.users ?? [])) {
          if (u.id !== adminUserId) {
            await admin.auth.admin.deleteUser(u.id);
            usersDeleted++;
          }
        }
        deleted["auth_users"] = usersDeleted;
      } else {
        // Delete all roles and profiles, then all auth users
        await admin.from("user_roles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await admin.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
        let usersDeleted = 0;
        for (const u of (authUsers?.users ?? [])) {
          await admin.auth.admin.deleteUser(u.id);
          usersDeleted++;
        }
        deleted["auth_users"] = usersDeleted;
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Full beta reset complete. Canonical catalog preserved.",
        deleted,
        preserve_admin: preserveAdmin,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
