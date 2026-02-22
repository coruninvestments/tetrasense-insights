export const CURRENT_DISCLAIMER_VERSION = "v1";

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
