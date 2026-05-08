import { ReactNode, useEffect, useRef } from "react";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "./PageTransition";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { trackAppOpened, checkRetentionEvents } from "@/lib/analytics";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  useNotificationTriggers();
  const { newUnlock, dismissUnlock, Toast } = useEasterEggs();
  const { user } = useAuth();
  const { ready: onboardingReady, shouldShow: showOnboarding, complete: completeOnboarding, skip: skipOnboarding } = useOnboarding();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!user || trackedRef.current) return;
    trackedRef.current = true;
    trackAppOpened();
    checkRetentionEvents();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className={showNav ? "pb-24" : ""}>
          {children}
        </main>
      </PageTransition>
      {showNav && <BottomNav />}
      <Toast eggKey={newUnlock} onClose={dismissUnlock} />
      {user && onboardingReady && showOnboarding && (
        <OnboardingFlow onComplete={completeOnboarding} onSkip={skipOnboarding} />
      )}
    </div>
  );
}
