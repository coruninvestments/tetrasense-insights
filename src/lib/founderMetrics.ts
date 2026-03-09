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
  activation: {
    activationRate: number;
    avgTimeToFirst: number | null;
    avgTimeTo5: number | null;
    avgTimeTo10: number | null;
  };
  dataQuality: {
    avgCompleteness: number;
    pctDose: number;
    pctEffects: number;
    pctContext: number;
    pctSensory: number;
    avgUniqueProducts: number;
  };
  retention: {
    active7d: number;
    active30d: number;
    avgSessionsPerActiveUser: number;
    avgDaysBetweenSessions: number | null;
    weeklyReturning: number;
  };
  featureAdoption: {
    quickLogRate: number;
    fullLogRate: number;
    compareUsage: number;
    exportUsage: number;
    communityViews: number;
    supportCreationRate: number;
    mostUsedEvents: Array<{ name: string; count: number }>;
  };
  supportHealth: {
    total: number;
    byType: Record<string, number>;
    unresolved: number;
    bugTrend: number[];
    supportFeedbackRatio: number | null;
    recent: Array<{ type: string; status: string; created_at: string }>;
  };
  topAchievements: Array<{ key: string; count: number }>;
  methodDistribution: Array<{ method: string; count: number }>;
  topStrains: Array<{ name: string; count: number }>;
  sessionsOverTime: Array<{ date: string; count: number }>;
  doseDistribution: Record<string, number>;
  verifiedCoaCount: number;
  analyticsEvents: Record<string, number>;
  support: {
    total: number;
    byType: Record<string, number>;
    unresolved: number;
    recent: Array<{ type: string; status: string; created_at: string }>;
  };
}

export type TimeRange = "7d" | "30d" | "all";

export async function fetchFounderMetrics(range: TimeRange = "all"): Promise<FounderMetrics> {
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

/* ── Diagnostic insight generation ── */
export interface DiagnosticInsight {
  message: string;
  severity: "info" | "warn" | "good";
}

export function generateDiagnosticInsights(m: FounderMetrics): DiagnosticInsight[] {
  const insights: DiagnosticInsight[] = [];

  if (m.featureAdoption.quickLogRate > 60) {
    insights.push({ message: `Quick Log is used in ${m.featureAdoption.quickLogRate}% of sessions`, severity: "info" });
  }
  if (m.dataQuality.pctSensory < 30) {
    insights.push({ message: `Only ${m.dataQuality.pctSensory}% of sessions include flavor/aroma`, severity: "warn" });
  }
  if (m.dataQuality.pctContext < 40) {
    insights.push({ message: `Only ${m.dataQuality.pctContext}% of sessions have context data`, severity: "warn" });
  }
  if (m.challenge.completionRate > 0) {
    insights.push({ message: `Challenge completion rate is ${m.challenge.completionRate}%`, severity: m.challenge.completionRate >= 40 ? "good" : "info" });
  }
  if (m.activation.activationRate > 0) {
    insights.push({ message: `Activation rate (≥5 sessions) is ${m.activation.activationRate}%`, severity: m.activation.activationRate >= 30 ? "good" : "warn" });
  }
  if (m.supportHealth.unresolved > 0) {
    insights.push({ message: `${m.supportHealth.unresolved} unresolved support ticket${m.supportHealth.unresolved > 1 ? "s" : ""}`, severity: "warn" });
  }
  const bugThisWeek = m.supportHealth.bugTrend?.[0] ?? 0;
  const bugLastWeek = m.supportHealth.bugTrend?.[1] ?? 0;
  if (bugThisWeek > bugLastWeek && bugThisWeek > 0) {
    insights.push({ message: `Bug reports increased this week (${bugThisWeek} vs ${bugLastWeek} last week)`, severity: "warn" });
  }
  if (m.dataQuality.pctEffects >= 70) {
    insights.push({ message: `${m.dataQuality.pctEffects}% of sessions have effect data — strong signal quality`, severity: "good" });
  }
  if (m.retention.weeklyReturning > 0) {
    insights.push({ message: `${m.retention.weeklyReturning} returning user${m.retention.weeklyReturning > 1 ? "s" : ""} this week`, severity: "good" });
  }

  return insights.slice(0, 6);
}
