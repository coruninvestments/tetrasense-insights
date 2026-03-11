/**
 * COA Ingestion — client-side helpers for the COA import workflow.
 * Server-side parsing happens in the ingest-coa edge function.
 */

import { supabase } from "@/integrations/supabase/client";
import { detectLabSource, isValidCoaUrl, normalizeCoaUrl, type LabDetectionResult } from "@/lib/coaLabRegistry";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CoaIngestionInput {
  coaUrl: string;
  productName?: string;
  brandName?: string;
  strainName?: string;
  labName?: string;
}

export interface CoaIngestionResult {
  success: boolean;
  status: "complete" | "partial" | "review_needed" | "error";
  labDetection: LabDetectionResult;
  productId: string | null;
  productName: string | null;
  productMatched: boolean;
  batchId: string | null;
  verificationStatus: string;
  terpeneCount: number;
  cannabinoidCount: number;
  unmappedTerms: string[];
  warnings: string[];
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Main ingestion function                                            */
/* ------------------------------------------------------------------ */

export async function ingestCoaUrl(input: CoaIngestionInput): Promise<CoaIngestionResult> {
  const errorResult: CoaIngestionResult = {
    success: false,
    status: "error",
    labDetection: { sourceType: "unknown", labName: "Unknown", confidence: "low" },
    productId: null,
    productName: null,
    productMatched: false,
    batchId: null,
    verificationStatus: "draft",
    terpeneCount: 0,
    cannabinoidCount: 0,
    unmappedTerms: [],
    warnings: [],
  };

  // Validate URL
  if (!isValidCoaUrl(input.coaUrl)) {
    return { ...errorResult, error: "Invalid URL format. Please enter a valid COA or lab report URL." };
  }

  const normalizedUrl = normalizeCoaUrl(input.coaUrl);

  // Detect lab source client-side for immediate UI feedback
  const labDetection = detectLabSource(normalizedUrl);

  try {
    // Call edge function for server-side parsing + writes
    const { data, error } = await supabase.functions.invoke("ingest-coa", {
      body: {
        coa_url: normalizedUrl,
        product_name: input.productName?.trim() || null,
        brand_name: input.brandName?.trim() || null,
        strain_name: input.strainName?.trim() || null,
        lab_name: input.labName?.trim() || labDetection.labName,
        source_type: labDetection.sourceType,
        source_confidence: labDetection.confidence,
      },
    });

    if (error) {
      console.error("COA ingest function error:", error);
      return { ...errorResult, labDetection, error: error.message || "Failed to process COA" };
    }

    if (!data || !data.success) {
      return {
        ...errorResult,
        labDetection,
        error: data?.error || "Unknown error during COA processing",
        warnings: data?.warnings || [],
      };
    }

    return {
      success: true,
      status: data.status || "partial",
      labDetection: data.labDetection || labDetection,
      productId: data.productId || null,
      productName: data.productName || null,
      productMatched: data.productMatched || false,
      batchId: data.batchId || null,
      verificationStatus: data.verificationStatus || "pending",
      terpeneCount: data.terpeneCount || 0,
      cannabinoidCount: data.cannabinoidCount || 0,
      unmappedTerms: data.unmappedTerms || [],
      warnings: data.warnings || [],
    };
  } catch (err: any) {
    console.error("COA ingestion error:", err);
    return { ...errorResult, labDetection, error: err.message || "Unexpected error" };
  }
}
