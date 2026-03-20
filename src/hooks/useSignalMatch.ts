import { useMemo } from "react";
import { useSessionLogs } from "./useSessionLogs";
import { useNewestVerifiedBatchChemistry } from "./useProductBatchChemistry";
import { computeSignalMatch, type SignalMatchResult } from "@/lib/signalMatchEngine";

/**
 * Computes signal match score for a product (by productId).
 * Returns null while loading, or result when ready.
 */
export function useSignalMatch(productId: string | null | undefined): {
  match: SignalMatchResult | null;
  isLoading: boolean;
} {
  const { data: sessions, isLoading: sessionsLoading } = useSessionLogs();
  const { data: chemistry, isLoading: chemLoading } = useNewestVerifiedBatchChemistry(productId);

  const match = useMemo(() => {
    if (!sessions || !chemistry?.batch) return null;

    try {
      return computeSignalMatch(
        sessions,
        chemistry.batch,
        chemistry.terpenes ?? [],
        chemistry.cannabinoids ?? []
      );
    } catch (err) {
      console.warn("[useSignalMatch] failed:", err);
      return null;
    }
  }, [sessions, chemistry]);

  return {
    match,
    isLoading: sessionsLoading || chemLoading,
  };
}

/**
 * Batch-compute signal match for multiple products.
 * Returns a Map<productId, SignalMatchResult>.
 */
export function useSignalMatchBatch(
  products: Array<{ id: string; productId?: string | null }> | undefined
): {
  matches: Map<string, SignalMatchResult>;
  isLoading: boolean;
} {
  const { data: sessions, isLoading: sessionsLoading } = useSessionLogs();

  // For the product library, we don't have per-product batch chemistry loaded.
  // Return empty map — match scores should only appear on detail pages or
  // when chemistry is individually fetched.
  const matches = useMemo(() => new Map<string, SignalMatchResult>(), []);

  return { matches, isLoading: sessionsLoading };
}
