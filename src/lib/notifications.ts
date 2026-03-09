import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "log_reminder" | "weekly_report" | "new_unlock" | "challenge_progress";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  ctaLabel?: string;
  ctaPath?: string;
}

export interface ReminderPreferences {
  log_reminder: boolean;
  weekly_report: boolean;
  new_unlock: boolean;
  challenge_progress: boolean;
  preferred_time: "morning" | "afternoon" | "evening";
  browser_notifications: boolean;
}

const STORAGE_KEY = "signal-leaf-notifications";
const PREFS_KEY = "signal-leaf-reminder-prefs";

const DEFAULT_PREFS: ReminderPreferences = {
  log_reminder: true,
  weekly_report: true,
  new_unlock: true,
  challenge_progress: true,
  preferred_time: "evening",
  browser_notifications: false,
};

// ── Notification storage (localStorage-backed) ──

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function addNotification(n: Omit<AppNotification, "id" | "read" | "createdAt">) {
  const notifications = getNotifications();
  // Deduplicate by type + title within last 24h
  const recent = notifications.find(
    (x) => x.type === n.type && x.title === n.title &&
      Date.now() - new Date(x.createdAt).getTime() < 24 * 60 * 60 * 1000
  );
  if (recent) return notifications;

  const entry: AppNotification = {
    ...n,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  const updated = [entry, ...notifications].slice(0, 50); // cap at 50
  saveNotifications(updated);

  // Browser notification if enabled
  tryBrowserNotification(entry);

  return updated;
}

export function markAsRead(id: string) {
  const notifications = getNotifications().map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(notifications);
  return notifications;
}

export function markAllRead() {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  saveNotifications(notifications);
  return notifications;
}

export function clearAllNotifications() {
  saveNotifications([]);
  return [];
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

// ── Preferences ──

export function getReminderPreferences(): ReminderPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveReminderPreferences(prefs: ReminderPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ── Browser Notification API ──

export async function requestBrowserPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function tryBrowserNotification(n: AppNotification) {
  const prefs = getReminderPreferences();
  if (!prefs.browser_notifications) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  new Notification(n.title, {
    body: n.message,
    icon: "/brand/app-icon-192.png",
    tag: n.type,
  });
}

// ── Trigger evaluation ──

export async function evaluateNotificationTriggers(userId: string) {
  const prefs = getReminderPreferences();

  // 1. Log reminder: no session in 48h
  if (prefs.log_reminder) {
    try {
      const { data } = await supabase
        .from("session_logs")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastSession = data?.[0]?.created_at;
      const gap = lastSession ? Date.now() - new Date(lastSession).getTime() : Infinity;
      if (gap > 48 * 60 * 60 * 1000) {
        addNotification({
          type: "log_reminder",
          title: "Time to log",
          message: "Log your session to strengthen your signal.",
          ctaLabel: "Log Session",
          ctaPath: "/log",
        });
      }
    } catch { /* ignore */ }
  }

  // 2. Weekly report — if it's Monday and no report notification this week
  if (prefs.weekly_report) {
    const today = new Date();
    if (today.getDay() === 1) {
      const existing = getNotifications().find(
        (n) => n.type === "weekly_report" &&
          Date.now() - new Date(n.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
      );
      if (!existing) {
        addNotification({
          type: "weekly_report",
          title: "Weekly report ready",
          message: "Your weekly cannabis report is ready to review.",
          ctaLabel: "View Insights",
          ctaPath: "/insights",
        });
      }
    }
  }

  // 3. Challenge progress — check session count
  if (prefs.challenge_progress) {
    try {
      const { count } = await supabase
        .from("session_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const total = count ?? 0;
      const milestones = [3, 5, 10];
      for (const m of milestones) {
        if (total > 0 && total < m && m - total <= 2) {
          addNotification({
            type: "challenge_progress",
            title: "Almost there",
            message: `${m - total} more session${m - total > 1 ? "s" : ""} to reach your next milestone.`,
            ctaLabel: "Log Session",
            ctaPath: "/log",
          });
          break;
        }
      }
    } catch { /* ignore */ }
  }

  // 4. New unlock — check recent achievements
  if (prefs.new_unlock) {
    try {
      const { data } = await supabase
        .from("achievements")
        .select("key, unlocked_at")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false })
        .limit(1);

      const latest = data?.[0];
      if (latest) {
        const age = Date.now() - new Date(latest.unlocked_at).getTime();
        if (age < 60 * 60 * 1000) {
          addNotification({
            type: "new_unlock",
            title: "New insight unlocked",
            message: "You unlocked a new achievement. Check your profile!",
            ctaLabel: "View Profile",
            ctaPath: "/profile",
          });
        }
      }
    } catch { /* ignore */ }
  }
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, { label: string; color: string }> = {
  log_reminder: { label: "Reminder", color: "text-primary" },
  weekly_report: { label: "Report", color: "text-info" },
  new_unlock: { label: "Unlock", color: "text-success" },
  challenge_progress: { label: "Challenge", color: "text-warning" },
};
