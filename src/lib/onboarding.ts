import { Sparkles, NotebookPen, Target, FlaskConical, ShieldCheck, type LucideIcon } from "lucide-react";

export const ONBOARDING_VERSION = "v1";
export const ONBOARDING_STORAGE_KEY = "sl_onboarding_completed";

export interface OnboardingScreen {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  helper?: string;
  cta: string;
}

export const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to Signal Leaf",
    body: "Signal Leaf learns how cannabis affects you personally over time.",
    cta: "Next",
  },
  {
    id: "logs",
    icon: NotebookPen,
    title: "Better Logs Build Better Signals",
    body: "Consistent details like product, method, dose, effects, and context help Signal Leaf learn patterns that are unique to you.",
    cta: "Next",
  },
  {
    id: "matches",
    icon: Target,
    title: "Your Matches Improve Over Time",
    body: "After a few sessions, Signal Leaf can begin showing personal match scores, tolerance trends, and profile insights.",
    helper: "More complete logs create stronger signals.",
    cta: "Next",
  },
  {
    id: "coa",
    icon: FlaskConical,
    title: "Use COAs When You Can",
    body: "A COA is a lab report that shows cannabinoids and terpenes in a product. Scanning or importing one helps Signal Leaf understand the chemistry behind your session.",
    cta: "Next",
  },
  {
    id: "privacy",
    icon: ShieldCheck,
    title: "Your Data Builds Your Signal",
    body: "Your personal logs are private. Signal Leaf uses your history to help you understand what works for you.",
    cta: "Start Logging",
  },
];

interface CompletionRecord {
  completed_at: string;
  version: string;
}

function storageKey(userId: string | null | undefined) {
  return userId ? `${ONBOARDING_STORAGE_KEY}:${userId}` : ONBOARDING_STORAGE_KEY;
}

export function getOnboardingCompletion(userId: string | null | undefined): CompletionRecord | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CompletionRecord;
    return parsed?.version ? parsed : null;
  } catch {
    return null;
  }
}

export function isOnboardingTutorialComplete(userId: string | null | undefined): boolean {
  const record = getOnboardingCompletion(userId);
  return record?.version === ONBOARDING_VERSION;
}

export function markOnboardingComplete(userId: string | null | undefined) {
  if (typeof localStorage === "undefined") return;
  const record: CompletionRecord = {
    completed_at: new Date().toISOString(),
    version: ONBOARDING_VERSION,
  };
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(record));
  } catch {
    // ignore quota errors
  }
}

export function clearOnboardingCompletion(userId: string | null | undefined) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
