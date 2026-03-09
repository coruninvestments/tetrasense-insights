import { supabase } from "@/integrations/supabase/client";

export const SUPPORT_EMAIL = "support@signalleaf.app";

export type TicketType = "bug" | "support" | "feedback" | "feature_request";
export type TicketStatus = "new" | "open" | "resolved" | "closed";

export interface SupportTicket {
  id: string;
  user_id: string;
  type: TicketType;
  subject: string;
  message: string;
  metadata: Record<string, unknown>;
  status: TicketStatus;
  created_at: string;
}

export interface TicketInput {
  type: TicketType;
  subject: string;
  message: string;
  includeContext?: boolean;
}

function collectDeviceContext(): Record<string, unknown> {
  return {
    app_version: "1.0.0",
    route: window.location.pathname,
    theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    user_agent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export async function submitTicket(input: TicketInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const metadata = input.includeContext ? collectDeviceContext() : {};

  const { error } = await supabase.from("support_tickets" as any).insert({
    user_id: user.id,
    type: input.type,
    subject: input.subject,
    message: input.message,
    metadata,
  } as any);

  if (error) throw error;
}

export function getMailtoFallback(input: TicketInput): string {
  const subject = encodeURIComponent(`[${input.type}] ${input.subject}`);
  const body = encodeURIComponent(input.message);
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
