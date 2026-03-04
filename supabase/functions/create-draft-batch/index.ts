import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authErr,
    } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      product_name,
      brand_name,
      strain_id,
      form,
      batch_code,
      tested_at,
      lab_name,
      coa_url,
      coa_file_path,
      lab_panel_common,
      lab_panel_custom,
    } = body;

    if (!product_name || typeof product_name !== "string" || !product_name.trim()) {
      return new Response(JSON.stringify({ error: "product_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service_role to write to products table
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create product
    const { data: product, error: pErr } = await adminClient
      .from("products")
      .insert({
        product_name: product_name.trim(),
        brand_name: brand_name?.trim() || null,
        strain_id: strain_id || null,
        form: form || null,
      })
      .select()
      .single();

    if (pErr) {
      console.error("Product insert error:", pErr);
      return new Response(JSON.stringify({ error: pErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create batch (user-owned draft)
    const hasCoa = !!(coa_url?.trim() || coa_file_path);
    const { data: batch, error: bErr } = await adminClient
      .from("product_batches")
      .insert({
        product_id: product.id,
        batch_code: batch_code?.trim() || null,
        tested_at: tested_at || null,
        lab_name: lab_name?.trim() || null,
        coa_url: coa_url?.trim() || null,
        coa_file_path: coa_file_path || null,
        coa_status: hasCoa ? "pending" : "unverified",
        lab_panel_common: lab_panel_common || null,
        lab_panel_custom: lab_panel_custom?.length ? lab_panel_custom : null,
        created_by_user_id: user.id,
        is_public_library: false,
      })
      .select()
      .single();

    if (bErr) {
      console.error("Batch insert error:", bErr);
      return new Response(JSON.stringify({ error: bErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ product, batch }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
