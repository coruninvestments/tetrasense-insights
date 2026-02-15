import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { OnboardingFlow } from "./OnboardingFlow";

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { data: profile, isLoading } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed) return <>{children}</>;
  if (!profile) return <>{children}</>;
  if (profile.onboarding_completed) return <>{children}</>;

  return <OnboardingFlow onComplete={() => setDismissed(true)} />;
}
