import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "./PageTransition";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
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
