import { supabase } from "@/integrations/supabase/client";

export interface FounderMetrics {
  users: {
    total: number;
    active7d: number;
    active30d: number;
    newUsers7d: number;
    newUsers30d: number;
    premium: number;
  };
  sessions: {
    total: number;
    avgPerUser: number;
    completionRate: number;
    quickLogs: number;
    fullLogs: number;
  };
  challenge: {
    started: number;
    reached3: number;
    reached5: number;
    reached10: number;
    completionRate: number;
  };
  unlocks: {
    fingerprint: number;
    signalCard: number;
    genome: number;
  };
  topAchievements: Array<{ key: string; count: number }>;
  methodDistribution: Array<{ method: string; count: number }>;
  topStrains: Array<{ name: string; count: number }>;
  sessionsOverTime: Array<{ date: string; count: number }>;
  doseDistribution: Record<string, number>;
  verifiedCoaCount: number;
  analyticsEvents: Record<string, number>;
}

export type TimeRange = "7d" | "30d" | "all";

export async function fetchFounderMetrics(range: TimeRange = "all"): Promise<FounderMetrics> {
  const { data, error } = await supabase.functions.invoke("founder-metrics", {
    body: null,
    method: "GET",
    headers: {},
  });

  // Edge functions invoked via supabase-js use POST; use fetch for GET with query params
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/founder-metrics?range=${range}`;
  const session = (await supabase.auth.getSession()).data.session;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed to fetch metrics: ${resp.status} ${body}`);
  }

  return resp.json();
}

/* ── Achievement label mapping ── */
export const ACHIEVEMENT_LABELS: Record<string, string> = {
  first_signal: "First Signal",
  session_3: "3 Sessions",
  session_5: "5 Sessions",
  session_7: "7 Sessions",
  session_10: "10 Sessions",
  pattern_hunter: "Pattern Hunter",
  flavor_explorer: "Flavor Explorer",
  context_tracker: "Context Tracker",
  strain_scientist: "Strain Scientist",
  signal_builder: "Signal Builder",
  learning_mind: "Learning Mind",
  verified_explorer: "Verified Explorer",
  signal_master: "Signal Master",
  founding_user: "Founding User",
};

export const METHOD_LABELS: Record<string, string> = {
  smoke: "Flower",
  vape: "Vape",
  edible: "Edible",
  tincture: "Tincture",
  topical: "Topical",
  other: "Other",
};
