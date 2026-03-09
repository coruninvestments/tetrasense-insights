import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "./PageTransition";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { useEasterEggs } from "@/hooks/useEasterEggs";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  useNotificationTriggers();
  const { newUnlock, dismissUnlock, Toast } = useEasterEggs();

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
