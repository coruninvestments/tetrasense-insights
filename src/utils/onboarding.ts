export const CURRENT_DISCLAIMER_VERSION = "v1";

export const DISCLAIMER_LINES = [
  "This app is for personal tracking and educational insights only.",
  "It does not provide medical advice, diagnosis, or treatment.",
  "Effects vary by person, dose, and product.",
  "Do not drive or operate machinery while impaired.",
  "If you feel unwell or unsafe, stop use and seek medical help.",
  "You are responsible for complying with local laws and age requirements.",
] as const;

interface OnboardingProfile {
  legal_age_confirmed?: boolean;
  disclaimer_accepted_at?: string | null;
  disclaimer_version?: string | null;
  privacy_acknowledged_at?: string | null;
  onboarding_completed?: boolean;
}

export function isOnboardingComplete(profile: OnboardingProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.legal_age_confirmed === true &&
    profile.disclaimer_accepted_at != null &&
    profile.disclaimer_version === CURRENT_DISCLAIMER_VERSION &&
    profile.privacy_acknowledged_at != null
  );
}
