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

type ConfidenceLevel = "low" | "medium" | "high";

function getConfidence(sampleSize: number): ConfidenceLevel {
  if (sampleSize >= 8) return "high";
  if (sampleSize >= 3) return "medium";
  return "low";
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const styles: Record<ConfidenceLevel, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-primary/10 text-primary",
    high: "bg-success/10 text-success",
  };
  const labels: Record<ConfidenceLevel, string> = {
    low: "Early data",
    medium: "Growing",
    high: "Strong",
  };

  return (
    <Badge className={`text-[10px] font-normal border-0 ${styles[level]}`}>
      {labels[level]}
    </Badge>
  );
}

function StrainRow({ strain, variant }: { strain: StrainOutcome; variant: "best" | "avoid" }) {
  const confidence = getConfidence(strain.sampleSize);

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{strain.strainName}</span>
        <ConfidenceBadge level={confidence} />
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-2">
        {variant === "best" ? `${strain.positiveRate}%` : `${strain.negativeRate}%`} · {strain.sampleSize} sessions
      </span>
    </div>
  );
}

function humanLabel(count: number): string {
  if (count === 1) return "1 session";
  return `${count} sessions`;
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
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-success" />
        <h3 className="font-serif text-base font-medium text-foreground">Best Matches</h3>
      </div>
      <div className="space-y-3">
        {withBest.map(ib => {
          const confidence = getConfidence(ib.totalSessions);
          return (
            <Card key={ib.intent} variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {INTENT_LABELS[ib.intent] || ib.intent}
                  </span>
                  <ConfidenceBadge level={confidence} />
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Your top strains for this goal from {humanLabel(ib.totalSessions)}
                </p>
                <div className="divide-y divide-border">
                  {ib.best.map(s => (
                    <StrainRow key={s.strainName} strain={s} variant="best" />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
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
      <div className="flex items-center gap-2 mb-3">
        <ThumbsDown className="w-5 h-5 text-destructive" />
        <h3 className="font-serif text-base font-medium text-foreground">Avoid List</h3>
      </div>
      <Card variant="glass">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            These strains tend to give you less favorable results.
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
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-base font-medium text-foreground">What Works For You</h3>
      </div>
      <div className="space-y-3">
        {bestMethod && (
          <Card variant="glass" className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Best Method</span>
                </div>
                <ConfidenceBadge level={getConfidence(bestMethod.sampleSize)} />
              </div>
              <p className="text-xl font-serif font-medium text-foreground capitalize mt-1">
                {bestMethod.method}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {bestMethod.positiveRate}% positive across {humanLabel(bestMethod.sampleSize)}
              </p>
            </CardContent>
          </Card>
        )}

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
    <div className="space-y-6">
      <BestMatchesSection intentBreakdowns={data.intentBreakdowns} />
      <AvoidListSection avoidList={data.avoidList} />
      <WhatWorksSection bestMethod={data.bestMethod} methodComparisons={data.methodComparisons} />
    </div>
  );
}
