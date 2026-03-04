import { motion } from "framer-motion";
import { Plus, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { SignalLeafLogo } from "@/components/brand/SignalLeafLogo";
import { TodaysGoalCard } from "@/components/home/TodaysGoalCard";
import { PatternSnapshotCard } from "@/components/home/PatternSnapshotCard";
import { ClarityScoreCard } from "@/components/home/ClarityScoreCard";
import { ConfidenceMeterCard } from "@/components/home/ConfidenceMeterCard";
import { QuickStatsCard } from "@/components/home/QuickStatsCard";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { BestForYouCard } from "@/components/home/BestForYouCard";
import { RecentSession } from "@/components/home/RecentSession";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRecentSessions } from "@/hooks/useSessionLogs";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { normalizeOutcome } from "@/lib/sessionOutcome";

const Index = () => {
  const { user } = useAuth();
  const { data: recentSessions, isLoading: sessionsLoading } = useRecentSessions(3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatSessionTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background aurora-bg">
        {/* Header */}
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <SignalLeafLogo variant="full" size="md" />
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          </motion.div>
        </header>

        <div className="px-5 space-y-4 pb-8">
          {/* Card 1 — Today's Goal */}
          <TodaysGoalCard />

          {/* Card 2 — Pattern Snapshot */}
          <PatternSnapshotCard />

          {/* Card 3 — Clarity Score */}
          <ClarityScoreCard />

          {/* Card 3b — Confidence Meter */}
          <ConfidenceMeterCard />

          {/* Streak Card */}
          <StreakCard />

          {/* Card — Best For You */}
          <BestForYouCard />

          {/* Card 4 — Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground">
                    Recent Sessions
                  </h3>
                  {recentSessions && recentSessions.length > 0 && (
                    <Link
                      to="/insights"
                      className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
                    >
                      View all
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                <div className="space-y-1">
                  {sessionsLoading ? (
                    <>
                      <Skeleton className="h-16 rounded-xl" />
                      <Skeleton className="h-16 rounded-xl" />
                    </>
                  ) : recentSessions && recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <RecentSession
                        key={session.id}
                        id={session.id}
                        intent={session.intent}
                        strain={session.strain_name_text}
                        outcome={normalizeOutcome(session.outcome)}
                        timeAgo={formatSessionTime(session.created_at)}
                        delay={0}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No sessions yet"
                      description="No sessions logged yet. Start your first session to unlock insights about your experience."
                      actionLabel="Log your first session"
                      actionTo="/log"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4 — Quick Stats */}
          <QuickStatsCard />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
