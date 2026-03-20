import { ReactNode, useEffect, useRef } from "react";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "./PageTransition";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { useEasterEggs } from "@/hooks/useEasterEggs";
import { useAuth } from "@/hooks/useAuth";
import { trackAppOpened, checkRetentionEvents } from "@/lib/analytics";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  useNotificationTriggers();
  const { newUnlock, dismissUnlock, Toast } = useEasterEggs();
  const { user } = useAuth();
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
    </div>
  );
}
