import { motion } from "framer-motion";
import { Plus, Calendar, Flame, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { InsightCard } from "@/components/home/InsightCard";
import { QuickStat } from "@/components/home/QuickStat";
import { RecentSession } from "@/components/home/RecentSession";
import { useRecentSessions, useSessionStats } from "@/hooks/useSessionLogs";
import { useInsights } from "@/hooks/useInsights";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const Index = () => {
  const { user } = useAuth();
  const { data: recentSessions, isLoading: sessionsLoading } = useRecentSessions(3);
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: insights } = useInsights();

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
      <div className="gradient-hero min-h-screen">
        {/* Header */}
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-sm text-muted-foreground mb-1">{getGreeting()}</p>
            <h1 className="font-serif text-2xl font-medium text-foreground">
              Your Cannabis Journal
            </h1>
          </motion.div>
        </header>

        <div className="px-5 space-y-6">
          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Link to="/log">
              <Button variant="primary" size="xl" className="w-full">
                <Plus className="w-5 h-5" />
                Log a Session
              </Button>
            </Link>
          </motion.div>

          {/* Insight Card - Show dynamic insights */}
          {insights?.patterns && insights.patterns.length > 0 ? (
            <InsightCard
              icon={insights.patterns[0].icon}
              title={insights.patterns[0].title}
              description={insights.patterns[0].description}
              stat={`${insights.weeklyPositiveRate}%`}
              statLabel="positive this week"
            />
          ) : stats && stats.totalSessions > 0 ? (
            <InsightCard
              icon="trending"
              title="Building Your Insights"
              description={`You've logged ${stats.totalSessions} session${stats.totalSessions > 1 ? 's' : ''}. ${insights?.streak ? `Current streak: ${insights.streak} day${insights.streak > 1 ? 's' : ''}!` : 'Keep tracking to discover patterns.'}`}
              stat={`${stats.uniqueStrains}`}
              statLabel="strains tried"
            />
          ) : (
            <InsightCard
              icon="sparkles"
              title="Start Your Journey"
              description="Log your first session to begin discovering how cannabis affects you. Personalized insights await!"
            />
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            {statsLoading ? (
              <>
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </>
            ) : (
              <>
                <QuickStat
                  icon={Flame}
                  label="Streak"
                  value={`${insights?.streak || 0}d`}
                  trend={insights?.streak && insights.streak >= 3 ? "up" : "neutral"}
                  delay={0.2}
                />
                <QuickStat
                  icon={TrendingUp}
                  label="Positive"
                  value={`${insights?.weeklyPositiveRate || 0}%`}
                  trend={insights?.weeklyPositiveRate && insights.weeklyPositiveRate >= 70 ? "up" : "neutral"}
                  delay={0.25}
                />
                <QuickStat
                  icon={Calendar}
                  label="Avg Time"
                  value={insights?.avgSessionTimeLabel || "—"}
                  trend="neutral"
                  delay={0.3}
                />
                <QuickStat
                  icon={Flame}
                  label="Strains"
                  value={String(stats?.uniqueStrains || 0)}
                  trend="neutral"
                  delay={0.35}
                />
              </>
            )}
          </div>

          {/* Recent Sessions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-medium text-foreground">
                Recent Sessions
              </h2>
              {recentSessions && recentSessions.length > 0 && (
                <Link
                  to="/insights"
                  className="text-sm text-primary font-medium hover:underline"
                >
                  View all
                </Link>
              )}
            </div>

            <div className="space-y-2">
              {sessionsLoading ? (
                <>
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </>
              ) : recentSessions && recentSessions.length > 0 ? (
                recentSessions.map((session, index) => (
                  <RecentSession
                    key={session.id}
                    intent={session.intent}
                    strain={session.strain_name_text}
                    outcome={session.outcome as "positive" | "neutral" | "negative" || "neutral"}
                    timeAgo={formatSessionTime(session.created_at)}
                    delay={0.35 + index * 0.05}
                  />
                ))
              ) : (
                <div className="text-center py-8 bg-secondary/30 rounded-xl">
                  <p className="text-muted-foreground text-sm">
                    No sessions logged yet
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Tap "Log a Session" to get started
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Education Teaser */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="pb-8"
          >
            <Link to="/learn">
              <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Featured Article
                </p>
                <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                  Understanding Terpenes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Learn how aromatic compounds influence your experience
                </p>
              </div>
            </Link>
          </motion.section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
