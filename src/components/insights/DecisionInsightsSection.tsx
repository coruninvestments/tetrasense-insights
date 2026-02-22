import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Zap, Target, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDecisionInsights, StrainOutcome, IntentBestWorst, MethodComparison } from "@/hooks/useDecisionInsights";

const INTENT_LABELS: Record<string, string> = {
  sleep: "😴 Sleep",
  relaxation: "🧘 Relaxation",
  creativity: "🎨 Creativity",
  focus: "🎯 Focus",
  pain_relief: "💊 Pain Relief",
  social: "🎉 Social",
  recreation: "🎮 Recreation",
  learning: "🧠 Learning",
};

function StrainRow({ strain, variant }: { strain: StrainOutcome; variant: "best" | "avoid" }) {
  const rate = variant === "best" ? strain.positiveRate : strain.negativeRate;
  const color = variant === "best" ? "text-success" : "text-destructive";

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-foreground truncate mr-3">{strain.strainName}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-semibold ${color}`}>{rate}%</span>
        <span className="text-xs text-muted-foreground">({strain.sampleSize})</span>
      </div>
    </div>
  );
}

function BestMatchesSection({ intentBreakdowns }: { intentBreakdowns: IntentBestWorst[] }) {
  const withBest = intentBreakdowns.filter(ib => ib.best.length > 0);
  if (withBest.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-success" />
        <h2 className="font-serif text-lg font-medium text-foreground">Best Matches</h2>
      </div>
      <div className="space-y-3">
        {withBest.map(ib => (
          <Card key={ib.intent} variant="glass">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {INTENT_LABELS[ib.intent] || ib.intent}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {ib.totalSessions} sessions
                </Badge>
              </div>
              <div className="divide-y divide-border">
                {ib.best.map(s => (
                  <StrainRow key={s.strainName} strain={s} variant="best" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.section>
  );
}

function AvoidListSection({ avoidList }: { avoidList: StrainOutcome[] }) {
  if (avoidList.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ThumbsDown className="w-5 h-5 text-destructive" />
        <h2 className="font-serif text-lg font-medium text-foreground">Avoid List</h2>
      </div>
      <Card variant="glass">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Strains with highest negative outcome rates (min. 2 sessions)
          </p>
          <div className="divide-y divide-border">
            {avoidList.map(s => (
              <StrainRow key={s.strainName} strain={s} variant="avoid" />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}

function WhatWorksSection({ bestMethod, methodComparisons }: { bestMethod: MethodComparison | null; methodComparisons: MethodComparison[] }) {
  if (!bestMethod && methodComparisons.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="font-serif text-lg font-medium text-foreground">What Works For You</h2>
      </div>
      <div className="space-y-3">
        {/* Best method highlight */}
        {bestMethod && (
          <Card variant="glass" className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Best Method</span>
              </div>
              <p className="text-2xl font-serif font-medium text-foreground capitalize">
                {bestMethod.method}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {bestMethod.positiveRate}% positive across {bestMethod.sampleSize} sessions
              </p>
            </CardContent>
          </Card>
        )}

        {/* Method comparison */}
        {methodComparisons.length > 1 && (
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                Method Comparison
              </p>
              <div className="space-y-2">
                {methodComparisons.map(mc => (
                  <div key={mc.method} className="flex items-center gap-3">
                    <span className="text-sm text-foreground capitalize w-20 shrink-0">{mc.method}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${mc.positiveRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {mc.positiveRate}% ({mc.sampleSize})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.section>
  );
}

export function DecisionInsightsSection() {
  const { data, isLoading } = useDecisionInsights();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!data || !data.hasEnoughData) {
    return (
      <Card variant="glass">
        <CardContent className="p-5 text-center">
          <ThumbsUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Log at least 3 sessions to unlock decision insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <BestMatchesSection intentBreakdowns={data.intentBreakdowns} />
      <AvoidListSection avoidList={data.avoidList} />
      <WhatWorksSection bestMethod={data.bestMethod} methodComparisons={data.methodComparisons} />
    </div>
  );
}
