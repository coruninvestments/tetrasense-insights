import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { isOnboardingComplete } from "@/utils/onboarding";
import { OnboardingFlow } from "./OnboardingFlow";

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { data: profile, isLoading } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return <>{children}</>;
  if (!profile) return <>{children}</>;
  if (isOnboardingComplete(profile)) return <>{children}</>;

  return <OnboardingFlow onComplete={() => setDismissed(true)} />;
}
