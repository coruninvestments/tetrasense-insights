import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ------------------------------------------------------------------ */
/*  Lab source detection (server-side mirror)                          */
/* ------------------------------------------------------------------ */

interface LabPattern {
  sourceType: string;
  labName: string;
  domains: RegExp[];
  paths?: RegExp[];
}

const LAB_PATTERNS: LabPattern[] = [
  { sourceType: "sc_labs", labName: "SC Labs", domains: [/sclabs\.com/i], paths: [/\/sample\//i, /\/coa\//i] },
  { sourceType: "acs", labName: "ACS Laboratory", domains: [/acslabcannabis\.com/i], paths: [/\/reports?\//i] },
  { sourceType: "kaycha", labName: "Kaycha Labs", domains: [/kaychalabs\.com/i, /yourcoa\.com/i] },
  { sourceType: "psi", labName: "PSI Labs", domains: [/psilabs\.org/i] },
  { sourceType: "steep_hill", labName: "Steep Hill", domains: [/steephill\.com/i] },
  { sourceType: "confident_cannabis", labName: "Confident Cannabis", domains: [/confidentcannabis\.com/i] },
  { sourceType: "anresco", labName: "Anresco Laboratories", domains: [/anresco\.com/i] },
  { sourceType: "encore", labName: "Encore Labs", domains: [/encorelabs\.com/i] },
];

function detectLab(url: string) {
  const lower = url.toLowerCase();
  for (const lab of LAB_PATTERNS) {
    if (!lab.domains.some((d) => d.test(lower))) continue;
    const pathMatch = lab.paths ? lab.paths.some((p) => p.test(lower)) : false;
    return { sourceType: lab.sourceType, labName: lab.labName, confidence: pathMatch ? "high" : "medium" };
  }
  return { sourceType: "unknown", labName: "Unknown", confidence: "low" };
}

/* ------------------------------------------------------------------ */
/*  Canonical compound name normalization                              */
/* ------------------------------------------------------------------ */

// Common terpene name aliases → canonical lookup name
const TERPENE_ALIASES: Record<string, string> = {
  "b-myrcene": "myrcene", "β-myrcene": "myrcene", "beta-myrcene": "myrcene", "beta myrcene": "myrcene",
  "d-limonene": "limonene", "d limonene": "limonene",
  "a-pinene": "alpha-pinene", "α-pinene": "alpha-pinene", "alpha pinene": "alpha-pinene",
  "b-pinene": "beta-pinene", "β-pinene": "beta-pinene", "beta pinene": "beta-pinene",
  "b-caryophyllene": "beta-caryophyllene", "β-caryophyllene": "beta-caryophyllene",
  "beta caryophyllene": "beta-caryophyllene", "caryophyllene": "beta-caryophyllene",
  "a-humulene": "alpha-humulene", "α-humulene": "alpha-humulene", "alpha humulene": "alpha-humulene",
  "a-bisabolol": "alpha-bisabolol", "α-bisabolol": "alpha-bisabolol", "bisabolol": "alpha-bisabolol",
  "a-terpineol": "alpha-terpineol", "α-terpineol": "alpha-terpineol", "terpineol": "alpha-terpineol",
  "trans-nerolidol": "nerolidol", "cis-nerolidol": "nerolidol",
  "b-ocimene": "beta-ocimene", "β-ocimene": "beta-ocimene", "ocimene": "beta-ocimene",
  "a-phellandrene": "alpha-phellandrene", "β-phellandrene": "beta-phellandrene",
  "a-cedrene": "alpha-cedrene", "α-cedrene": "alpha-cedrene",
  "3-carene": "delta-3-carene",
};

const CANNABINOID_ALIASES: Record<string, string> = {
  "thca": "thca", "thc-a": "thca", "δ9-thca": "thca",
  "thc": "thc", "δ9-thc": "thc", "delta-9-thc": "thc", "delta 9 thc": "thc", "d9-thc": "thc", "d9 thc": "thc",
  "cbda": "cbda", "cbd-a": "cbda",
  "cbd": "cbd",
  "cbga": "cbga", "cbg-a": "cbga",
  "cbg": "cbg",
  "cbn": "cbn",
  "cbc": "cbc",
  "cbdv": "cbdv",
  "thcv": "thcv", "thc-v": "thcv",
  "cbgv": "cbgv",
  "cbcv": "cbcv",
  "cbl": "cbl",
  "cbt": "cbt",
  "δ8-thc": "delta-8-thc", "delta-8-thc": "delta-8-thc", "delta 8 thc": "delta-8-thc", "d8-thc": "delta-8-thc", "d8 thc": "delta-8-thc", "d8": "delta-8-thc",
  "δ10-thc": "delta-10-thc", "delta-10-thc": "delta-10-thc", "d10-thc": "delta-10-thc", "d10": "delta-10-thc",
  "hhc": "hhc",
  "thcp": "thcp", "thc-p": "thcp",
  "cbdp": "cbdp", "cbd-p": "cbdp",
  "total thc": "total-thc",
  "total cbd": "total-cbd",
  "total cannabinoids": "total-cannabinoids",
};

function normalizeCompoundName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9\-αβδ]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/* ------------------------------------------------------------------ */
/*  Simulated page content extraction (v1 stub)                        */
/* ------------------------------------------------------------------ */

interface ParsedChemistry {
  terpenes: Array<{ name: string; percent: number }>;
  cannabinoids: Array<{ name: string; percent: number | null; mg: number | null }>;
  totalThc: number | null;
  totalCbd: number | null;
  totalTerpenes: number | null;
  batchNumber: string | null;
  testDate: string | null;
  labName: string | null;
  strainName: string | null;
  productName: string | null;
}

/**
 * V1 stub parser: attempts basic extraction from page text.
 * Real parsers for specific labs will be added incrementally.
 * For v1, this creates a draft with whatever metadata we have.
 */
function parseCoaContent(_url: string, _pageText: string | null): ParsedChemistry {
  // V1: return empty parsed result — actual parsing requires
  // fetching page content which we'll add via Firecrawl or
  // lab-specific APIs in a future iteration.
  return {
    terpenes: [],
    cannabinoids: [],
    totalThc: null,
    totalCbd: null,
    totalTerpenes: null,
    batchNumber: null,
    testDate: null,
    labName: null,
    strainName: null,
    productName: null,
  };
}

/* ------------------------------------------------------------------ */
/*  Main handler                                                       */
/* ------------------------------------------------------------------ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Missing auth" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) return json({ success: false, error: "Unauthorized" }, 401);

    // ── Input ─────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      coa_url,
      product_name,
      brand_name,
      strain_name,
      lab_name,
      source_type,
      source_confidence,
    } = body;

    if (!coa_url || typeof coa_url !== "string" || !coa_url.startsWith("http")) {
      return json({ success: false, error: "Valid COA URL is required" }, 400);
    }

    // ── Service client for writes ────────────────────────────────────
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Lab detection ────────────────────────────────────────────────
    const labDetection = detectLab(coa_url);
    const resolvedLabName = lab_name || labDetection.labName;

    // ── Parse (v1 stub — no actual page fetch yet) ───────────────────
    const parsed = parseCoaContent(coa_url, null);
    const resolvedProductName = product_name || parsed.productName || `Import ${new Date().toISOString().slice(0, 10)}`;
    const resolvedBrand = brand_name || null;
    const resolvedStrain = strain_name || parsed.strainName || null;

    const warnings: string[] = [];
    const unmappedTerms: string[] = [];

    // ── Strain resolution ────────────────────────────────────────────
    let strainId: string | null = null;
    if (resolvedStrain) {
      const normalized = resolvedStrain.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const { data: strainMatch } = await admin
        .from("strains_canonical")
        .select("id")
        .eq("normalized_name", normalized)
        .maybeSingle();

      if (strainMatch) {
        strainId = strainMatch.id;
      } else {
        // Try alias
        const { data: aliasMatch } = await admin
          .from("strain_aliases_canonical")
          .select("strain_id")
          .eq("normalized_alias", normalized)
          .maybeSingle();

        if (aliasMatch) strainId = aliasMatch.strain_id;
        else warnings.push(`Strain "${resolvedStrain}" not found in canonical catalog`);
      }
    }

    // ── Product matching / dedup ──────────────────────────────────────
    let productId: string | null = null;
    let productMatched = false;

    const normalizedPName = resolvedProductName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const normalizedBName = resolvedBrand?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || null;

    // Try to find existing product
    let matchQuery = admin
      .from("products")
      .select("id, product_name")
      .eq("normalized_product_name", normalizedPName);

    if (normalizedBName) {
      matchQuery = matchQuery.eq("normalized_brand_name", normalizedBName);
    }

    const { data: existingProducts } = await matchQuery.limit(1);

    if (existingProducts && existingProducts.length > 0) {
      productId = existingProducts[0].id;
      productMatched = true;
    } else {
      // Create new product
      const { data: newProduct, error: pErr } = await admin
        .from("products")
        .insert({
          product_name: resolvedProductName.trim(),
          normalized_product_name: normalizedPName,
          brand_name: resolvedBrand,
          normalized_brand_name: normalizedBName,
          strain_id: strainId,
          product_type: "flower",
          source_type: "user_submitted",
          is_verified: false,
          is_active: true,
        })
        .select("id")
        .single();

      if (pErr) {
        console.error("Product insert error:", pErr);
        return json({ success: false, error: "Failed to create product record" }, 500);
      }
      productId = newProduct.id;
    }

    // ── Determine verification status ────────────────────────────────
    const hasParsedChemistry = parsed.terpenes.length > 0 || parsed.cannabinoids.length > 0;
    const verificationStatus = hasParsedChemistry ? "pending" : "draft";

    // ── Create batch ─────────────────────────────────────────────────
    const { data: batch, error: bErr } = await admin
      .from("product_batches")
      .insert({
        product_id: productId,
        batch_number: parsed.batchNumber || null,
        lot_number: null,
        lab_name: resolvedLabName !== "Unknown" ? resolvedLabName : null,
        coa_url: coa_url,
        coa_source_type: source_type === "unknown" ? "manual" : "qr_scan",
        coa_status: verificationStatus === "pending" ? "pending" : "unverified",
        verification_status: verificationStatus,
        tested_at: parsed.testDate || null,
        total_thc_percent: parsed.totalThc,
        total_cbd_percent: parsed.totalCbd,
        total_terpenes_percent: parsed.totalTerpenes,
        created_by_user_id: user.id,
        is_public_library: false,
      })
      .select("id")
      .single();

    if (bErr) {
      console.error("Batch insert error:", bErr);
      return json({ success: false, error: "Failed to create batch record" }, 500);
    }

    const batchId = batch.id;

    // ── Map terpenes to canonical ────────────────────────────────────
    let terpeneCount = 0;

    if (parsed.terpenes.length > 0) {
      // Load all canonical terpenes for matching
      const { data: canonTerpenes } = await admin
        .from("terpenes_canonical")
        .select("id, canonical_name");

      const terpeneMap = new Map<string, string>();
      (canonTerpenes || []).forEach((t: any) => {
        terpeneMap.set(t.canonical_name.toLowerCase(), t.id);
      });

      // Also load aliases
      const { data: terpeneAliases } = await admin
        .from("terpene_aliases")
        .select("terpene_id, alias_name");

      (terpeneAliases || []).forEach((a: any) => {
        terpeneMap.set(a.alias_name.toLowerCase(), a.terpene_id);
      });

      const terpeneRows: Array<{ batch_id: string; terpene_id: string; percent_value: number; rank_order: number }> = [];

      for (let i = 0; i < parsed.terpenes.length; i++) {
        const t = parsed.terpenes[i];
        const norm = normalizeCompoundName(t.name);
        const alias = TERPENE_ALIASES[norm] || norm;

        // Try canonical match
        const terpeneId = terpeneMap.get(alias) || terpeneMap.get(norm) || terpeneMap.get(t.name.toLowerCase());

        if (terpeneId) {
          terpeneRows.push({ batch_id: batchId, terpene_id: terpeneId, percent_value: t.percent, rank_order: i + 1 });
        } else {
          unmappedTerms.push(`terpene: ${t.name}`);
        }
      }

      if (terpeneRows.length > 0) {
        const { error: tErr } = await admin.from("batch_terpenes").insert(terpeneRows);
        if (tErr) {
          console.error("Batch terpenes insert error:", tErr);
          warnings.push("Some terpene data could not be saved");
        } else {
          terpeneCount = terpeneRows.length;
        }
      }
    }

    // ── Map cannabinoids to canonical ────────────────────────────────
    let cannabinoidCount = 0;

    if (parsed.cannabinoids.length > 0) {
      const { data: canonCannabinoids } = await admin
        .from("cannabinoids_canonical")
        .select("id, canonical_name, short_name");

      const cannabinoidMap = new Map<string, string>();
      (canonCannabinoids || []).forEach((c: any) => {
        cannabinoidMap.set(c.canonical_name.toLowerCase(), c.id);
        if (c.short_name) cannabinoidMap.set(c.short_name.toLowerCase(), c.id);
      });

      const { data: cannabinoidAliases } = await admin
        .from("cannabinoid_aliases")
        .select("cannabinoid_id, alias_name");

      (cannabinoidAliases || []).forEach((a: any) => {
        cannabinoidMap.set(a.alias_name.toLowerCase(), a.cannabinoid_id);
      });

      const cannabinoidRows: Array<{ batch_id: string; cannabinoid_id: string; percent_value: number | null; mg_value: number | null }> = [];

      for (const c of parsed.cannabinoids) {
        const norm = normalizeCompoundName(c.name);
        const alias = CANNABINOID_ALIASES[norm] || norm;

        const cannabinoidId = cannabinoidMap.get(alias) || cannabinoidMap.get(norm) || cannabinoidMap.get(c.name.toLowerCase());

        if (cannabinoidId) {
          cannabinoidRows.push({ batch_id: batchId, cannabinoid_id: cannabinoidId, percent_value: c.percent, mg_value: c.mg });
        } else {
          unmappedTerms.push(`cannabinoid: ${c.name}`);
        }
      }

      if (cannabinoidRows.length > 0) {
        const { error: cErr } = await admin.from("batch_cannabinoids").insert(cannabinoidRows);
        if (cErr) {
          console.error("Batch cannabinoids insert error:", cErr);
          warnings.push("Some cannabinoid data could not be saved");
        } else {
          cannabinoidCount = cannabinoidRows.length;
        }
      }
    }

    // ── Also store in coa_ingestions for audit trail ──────────────────
    await admin.from("coa_ingestions").insert({
      batch_id: batchId,
      user_id: user.id,
      source: coa_url,
      status: hasParsedChemistry ? "parsed" : "queued",
      extracted_json: hasParsedChemistry ? parsed : null,
      parser_version: "v1-stub",
    }).then(({ error }) => {
      if (error) console.error("coa_ingestions insert warning:", error);
    });

    // ── Determine overall status ─────────────────────────────────────
    let status: "complete" | "partial" | "review_needed" = "review_needed";
    if (terpeneCount > 0 && cannabinoidCount > 0) {
      status = unmappedTerms.length === 0 ? "complete" : "partial";
    } else if (terpeneCount > 0 || cannabinoidCount > 0) {
      status = "partial";
    }

    if (!hasParsedChemistry) {
      warnings.push("No chemistry data could be extracted from this URL yet. A draft batch has been created for manual review.");
    }

    return json({
      success: true,
      status,
      labDetection: { ...labDetection, labName: resolvedLabName },
      productId,
      productName: resolvedProductName,
      productMatched,
      batchId,
      verificationStatus,
      terpeneCount,
      cannabinoidCount,
      unmappedTerms,
      warnings,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
