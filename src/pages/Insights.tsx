import { motion } from "framer-motion";
import { Lock, ChevronRight, TrendingUp, Moon, Brain, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useSessionLogs, useSessionStats } from "@/hooks/useSessionLogs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Insights() {
  const { data: profile } = useProfile();
  const { data: sessions, isLoading: sessionsLoading } = useSessionLogs();
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  
  const isPremium = profile?.is_premium || false;

  // Calculate real insights from session data
  const topIntent = sessions?.reduce((acc, session) => {
    acc[session.intent] = (acc[session.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topIntentName = topIntent ? Object.entries(topIntent).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
  
  const topStrain = sessions?.reduce((acc, session) => {
    acc[session.strain_name_text] = (acc[session.strain_name_text] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topStrainName = topStrain ? Object.entries(topStrain).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
  
  const positiveRate = sessions?.length 
    ? Math.round((sessions.filter(s => s.outcome === "positive").length / sessions.length) * 100)
    : 0;

  const insights = [
    {
      id: "1",
      icon: Moon,
      title: "Sleep Quality Correlation",
      description: "Lower doses before 9 PM correlate with better sleep quality.",
      isPremium: false,
    },
    {
      id: "2",
      icon: Brain,
      title: "Best Strains for Focus",
      description: "Track more sessions to discover your best focus strains.",
      isPremium: true,
    },
    {
      id: "3",
      icon: AlertCircle,
      title: "Anxiety Warning",
      description: "High doses of sativas may increase anxiety for some users.",
      isPremium: true,
    },
    {
      id: "4",
      icon: TrendingUp,
      title: "Weekly Pattern",
      description: "Log more sessions to see your weekly patterns.",
      isPremium: false,
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-2xl font-medium text-foreground">
              Personal Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              Patterns from your session data
            </p>
          </motion.div>
        </header>

        <div className="px-5 pb-8 space-y-6">
          {/* Premium Banner */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="gradient-primary border-0 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-medium text-primary-foreground mb-1">
                        Unlock All Insights
                      </h3>
                      <p className="text-sm text-primary-foreground/80 mb-4">
                        Get personalized patterns and predictive insights.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      >
                        Upgrade for $4.99/mo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Overview */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Your Stats
            </h2>
            {statsLoading || sessionsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Card variant="glass" className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Total Sessions
                  </p>
                  <p className="text-2xl font-serif font-medium text-foreground">
                    {stats?.totalSessions || 0}
                  </p>
                </Card>
                <Card variant="glass" className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Positive Rate
                  </p>
                  <p className="text-2xl font-serif font-medium text-success">
                    {positiveRate}%
                  </p>
                </Card>
                <Card variant="glass" className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Top Intent
                  </p>
                  <p className="text-lg font-serif font-medium text-foreground capitalize">
                    {topIntentName || "—"}
                  </p>
                </Card>
                <Card variant="glass" className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Favorite Strain
                  </p>
                  <p className="text-lg font-serif font-medium text-foreground truncate">
                    {topStrainName || "—"}
                  </p>
                </Card>
              </div>
            )}
          </section>

          {/* Insights List */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Discovered Patterns
            </h2>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    variant={insight.isPremium && !isPremium ? "default" : "interactive"}
                    className={`p-4 ${insight.isPremium && !isPremium ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <insight.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground">
                            {insight.title}
                          </h3>
                          {insight.isPremium && !isPremium && (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.isPremium && !isPremium
                            ? "Upgrade to unlock this insight"
                            : insight.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
