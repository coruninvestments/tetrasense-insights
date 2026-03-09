import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "./PageTransition";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  useNotificationTriggers();

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <main className={showNav ? "pb-24" : ""}>
          {children}
        </main>
      </PageTransition>
      {showNav && <BottomNav />}
    </div>
  );
}
