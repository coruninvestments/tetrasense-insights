import { supabase } from "@/integrations/supabase/client";

/* ── Types ───────────────────────────────────────────────────────── */

export interface DryRunReport {
  users: number;
  sessions: number;
  tickets: number;
  achievements: number;
  analytics: number;
  draftBatches: number;
  feedback: number;
}

export interface ReadinessReport {
  unresolvedTickets: number;
  totalUsers: number;
  totalSessions: number;
  founderBadges: number;
  creatorAccounts: number;
  devAccounts: number;
}

/* ── API calls ───────────────────────────────────────────────────── */

async function callPreBetaTools(action: string, payload: Record<string, unknown> = {}): Promise<any> {
  const session = (await supabase.auth.getSession()).data.session;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pre-beta-tools`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Pre-beta tools error: ${resp.status} ${body}`);
  }

  return resp.json();
}

export async function fetchDryRunReport(): Promise<DryRunReport> {
  return callPreBetaTools("dry_run");
}

export async function fetchReadinessReport(): Promise<ReadinessReport> {
  return callPreBetaTools("readiness");
}

export async function assignFounderIdentity(userId: string, role: "creator" | "developer"): Promise<void> {
  const result = await callPreBetaTools("assign_identity", { user_id: userId, role });
  if (result.error) throw new Error(result.error);
}

export async function requestBetaReset(confirmation: string): Promise<{ success: boolean; message: string }> {
  return callPreBetaTools("beta_reset", { confirmation });
}
