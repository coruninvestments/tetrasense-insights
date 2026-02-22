import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { isOnboardingComplete } from "@/utils/onboarding";
import { OnboardingFlow } from "./OnboardingFlow";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingGateProps {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground text-sm">
          Unable to load your profile. This is usually temporary.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (isOnboardingComplete(profile)) return <>{children}</>;

  return <OnboardingFlow onComplete={() => setDismissed(true)} />;
}
