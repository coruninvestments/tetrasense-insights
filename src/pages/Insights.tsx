import { motion } from "framer-motion";
import { Lock, Flame, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProfile } from "@/hooks/useProfile";
import { useSessionLogs, useSessionStats } from "@/hooks/useSessionLogs";
import { useInsights } from "@/hooks/useInsights";
import { usePersonalPatterns } from "@/hooks/usePersonalPatterns";
import { PatternCard, NoPatternCard } from "@/components/insights/PatternCard";
import { MilestoneCallout } from "@/components/insights/MilestoneCallout";
import { DataQualityIndicator } from "@/components/insights/DataQualityIndicator";
import { RelationshipInsightsSection } from "@/components/insights/RelationshipInsightsSection";
import { WeeklyUsageSection } from "@/components/insights/WeeklyUsageSection";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DevToolsPanel } from "@/components/insights/DevToolsPanel";
import { HelpTip } from "@/components/guide/HelpTip";
import { DecisionInsightsSection } from "@/components/insights/DecisionInsightsSection";
import { RecommendationSection } from "@/components/insights/RecommendationSection";
import { EffectDriversSection } from "@/components/insights/EffectDriversSection";
import { ActionTipsSection } from "@/components/insights/ActionTipsSection";

export default function Insights() {
  const { data: profile } = useProfile();
  const { data: sessions, isLoading: sessionsLoading } = useSessionLogs();
  const { data: stats, isLoading: statsLoading } = useSessionStats();
  const { data: insights, isLoading: insightsLoading } = useInsights();
  const { data: personalPatterns, isLoading: personalPatternsLoading } = usePersonalPatterns();
  
  const isPremium = profile?.is_premium || false;

  // Calculate real insights from session data
  const topIntent = sessions?.reduce((acc, session) => {
    acc[session.intent] = (acc[session.intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topIntentName = topIntent ? Object.entries(topIntent).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
  
  const topStrain = sessions?.reduce((acc, session) => {
    const key = session.strain_name_text || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topStrainName = topStrain ? Object.entries(topStrain).sort((a, b) => b[1] - a[1])[0]?.[0] : null;

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
          {/* Milestone Callout - shown once at 10 sessions */}
          {sessions && <MilestoneCallout sessionCount={sessions.length} />}
          
          {/* Dev Tools Panel - only shows in development */}
          <DevToolsPanel />
          
          {/* Personalized Recommendation + Warnings */}
          <RecommendationSection />
          
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
                        Unlock Advanced Insights
                      </h3>
                      <p className="text-sm text-primary-foreground/80 mb-4">
                        Get predictive patterns and deeper analysis.
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

          {/* Key Metrics */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Your Metrics
            </h2>
            {statsLoading || insightsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Card variant="glass" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Weekly Positive
                    </p>
                  </div>
                  <p className="text-2xl font-serif font-medium text-success">
                    {insights?.weeklyPositiveRate || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on your data
                  </p>
                </Card>
                <Card variant="glass" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Current Streak
                    </p>
                  </div>
                  <p className="text-2xl font-serif font-medium text-foreground">
                    {insights?.streak || 0} day{insights?.streak !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consecutive logging
                  </p>
                </Card>
                <Card variant="glass" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Avg Session Time
                    </p>
                  </div>
                  <p className="text-xl font-serif font-medium text-foreground">
                    {insights?.avgSessionTimeLabel || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Most common period
                  </p>
                </Card>
                <Card variant="glass" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Top Intent
                    </p>
                  </div>
                  <p className="text-xl font-serif font-medium text-foreground capitalize">
                    {topIntentName || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {topStrainName ? `Fav: ${topStrainName}` : "No favorite yet"}
                  </p>
                </Card>
              </div>
            )}
          </section>

          {/* Weekly Usage Summary */}
          <WeeklyUsageSection />

          {/* Decision Insights Engine */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-serif text-lg font-medium text-foreground">
                Decision Insights
              </h2>
              <HelpTip
                id="decision-insights-info"
                title="About Decision Insights"
                description="Shows what strains and methods work best for your goals, based on your logged outcomes. Not medical advice."
              />
            </div>
            <DecisionInsightsSection />
          </section>

          {/* Effect Drivers */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-serif text-lg font-medium text-foreground">
                What Drives Your Best Sessions
              </h2>
              <HelpTip
                id="effect-drivers-info"
                title="About Effect Drivers"
                description="Compares the sensations you report in positive vs negative sessions to find what matters most. Not medical advice."
              />
            </div>
            <EffectDriversSection />
            <ActionTipsSection />
          </section>

          {/* Your Cannabis Relationship */}
          <div id="relationship-section">
            <RelationshipInsightsSection />
          </div>

          {/* Discovered Patterns */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-serif text-lg font-medium text-foreground">
                Discovered Patterns
              </h2>
              <HelpTip
                id="discovered-patterns-info"
                title="About Discovered Patterns"
                description="Insights are based only on your past sessions. They reflect patterns in your personal data and are not medical advice."
              />
            </div>
            
            {/* Data Quality Indicator */}
            {!insightsLoading && sessions && (
              <div className="mb-4">
                <DataQualityIndicator totalSessions={sessions.length} />
              </div>
            )}
            
            <TooltipProvider>
              {insightsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                </div>
              ) : insights?.patterns && insights.patterns.length > 0 ? (
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                >
                  {insights.patterns.map((pattern) => (
                    <motion.div
                      key={pattern.id}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <PatternCard pattern={pattern} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <NoPatternCard />
              )}
            </TooltipProvider>
            
            {insights?.patterns && insights.patterns.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4 px-4">
                Based on your logged sessions. These observations are personal patterns, not medical advice.
              </p>
            )}
          </section>

          {/* Personal Patterns */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-serif text-lg font-medium text-foreground">
                Personal Patterns
              </h2>
              <HelpTip
                id="personal-patterns-info"
                title="About Personal Patterns"
                description="Insights are based only on your past sessions. They reflect patterns in your personal data and are not medical advice."
              />
            </div>
            <TooltipProvider>
              {personalPatternsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                </div>
              ) : personalPatterns && personalPatterns.length > 0 ? (
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.1 },
                    },
                  }}
                >
                  {personalPatterns.map((pattern) => (
                    <motion.div
                      key={pattern.id}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <PatternCard pattern={pattern} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <Card variant="glass" className="overflow-hidden">
                  <CardContent className="p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Log at least 5 sessions to start detecting personal patterns.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TooltipProvider>
            {personalPatterns && personalPatterns.length > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4 px-4">
                Based on your personal session data. These are observations, not medical advice.
              </p>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
