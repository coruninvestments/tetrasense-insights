import { motion } from "framer-motion";
import { Sparkles, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDecisionInsights } from "@/hooks/useDecisionInsights";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { normalizeOutcome } from "@/lib/sessionOutcome";
import { useMemo } from "react";
import { InsightUnlockCard } from "./InsightUnlockCard";

const INTENT_LABELS: Record<string, string> = {
  sleep: "Sleep",
  relaxation: "Relaxation",
  creativity: "Creativity",
  focus: "Focus",
  pain_relief: "Pain Relief",
  social: "Social",
  recreation: "Recreation",
  learning: "Learning",
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
    medium: "Growing confidence",
    high: "Strong signal",
  };

  return (
    <Badge className={`text-[10px] font-normal border-0 ${styles[level]}`}>
      {labels[level]}
    </Badge>
  );
}

interface WarningItem {
  label: string;
  detail: string;
  rate: number;
  sampleSize: number;
}

export function RecommendationSection() {
  const { data: sessions } = useSessionLogs();
  const { data, isLoading } = useDecisionInsights();

  const recommendation = useMemo(() => {
    if (!sessions || sessions.length < 3 || !data) return null;

    // Find most-used intent
    const intentCounts: Record<string, number> = {};
    for (const s of sessions) {
      intentCounts[s.intent] = (intentCounts[s.intent] || 0) + 1;
    }
    const topIntent = Object.entries(intentCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topIntent) return null;

    // Best strain for that intent
    const intentSessions = sessions.filter(s => s.intent === topIntent);
    const byStrain: Record<string, { pos: number; total: number }> = {};
    for (const s of intentSessions) {
      const key = s.strain_name_text || "Unknown";
      if (!byStrain[key]) byStrain[key] = { pos: 0, total: 0 };
      byStrain[key].total++;
      if (normalizeOutcome(s.outcome) === "positive") byStrain[key].pos++;
    }
    const bestStrain = Object.entries(byStrain)
      .map(([name, d]) => ({ name, rate: d.total > 0 ? d.pos / d.total : 0, total: d.total }))
      .sort((a, b) => b.rate - a.rate || b.total - a.total)[0];

    // Best method for that intent
    const byMethod: Record<string, { pos: number; total: number }> = {};
    for (const s of intentSessions) {
      if (!byMethod[s.method]) byMethod[s.method] = { pos: 0, total: 0 };
      byMethod[s.method].total++;
      if (normalizeOutcome(s.outcome) === "positive") byMethod[s.method].pos++;
    }
    const bestMethod = Object.entries(byMethod)
      .map(([name, d]) => ({ name, rate: d.total > 0 ? d.pos / d.total : 0, total: d.total }))
      .sort((a, b) => b.rate - a.rate || b.total - a.total)[0];

    // Typical dose
    const doseCounts: Record<string, number> = {};
    for (const s of intentSessions) {
      if (s.dose_level) doseCounts[s.dose_level] = (doseCounts[s.dose_level] || 0) + 1;
    }
    const typicalDose = Object.entries(doseCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const confidence = getConfidence(intentSessions.length);

    return {
      intent: topIntent,
      intentLabel: INTENT_LABELS[topIntent] || topIntent,
      strain: bestStrain?.name,
      strainRate: bestStrain ? Math.round(bestStrain.rate * 100) : 0,
      method: bestMethod?.name,
      dose: typicalDose,
      sampleSize: intentSessions.length,
      confidence,
    };
  }, [sessions, data]);

  // Warning items
  const warnings = useMemo((): WarningItem[] => {
    if (!data) return [];
    const items: WarningItem[] = [];

    // Strains with high negative rates
    for (const s of data.avoidList) {
      if (s.negativeRate >= 40) {
        items.push({
          label: s.strainName,
          detail: "Often leads to negative outcomes",
          rate: s.negativeRate,
          sampleSize: s.sampleSize,
        });
      }
    }

    // Methods with low success
    for (const m of data.methodComparisons) {
      if (m.positiveRate < 40 && m.sampleSize >= 2) {
        items.push({
          label: m.method,
          detail: "Low success rate with this method",
          rate: m.positiveRate,
          sampleSize: m.sampleSize,
        });
      }
    }

    return items.slice(0, 3);
  }, [data]);

  if (isLoading) return null;

  if (!data?.hasEnoughData) {
    const sessionCount = sessions?.length ?? 0;
    return (
      <InsightUnlockCard
        icon={Sparkles}
        title="Log 3 sessions to get personalized recommendations"
        subtitle="We'll find your ideal strain, method, and dose"
        current={sessionCount}
        target={3}
        showIllustration
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Your Recommendation */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-serif text-base font-medium text-foreground">
                    Your Recommendation
                  </h3>
                </div>
                <ConfidenceBadge level={recommendation.confidence} />
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-3">
                For <span className="font-medium">{recommendation.intentLabel}</span>, you tend to have the best outcomes with:
              </p>

              <ul className="space-y-2 ml-1">
                {recommendation.strain && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <div>
                      <span className="text-sm font-medium text-foreground">{recommendation.strain}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {recommendation.strainRate}% positive
                      </span>
                    </div>
                  </li>
                )}
                {recommendation.method && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-sm text-foreground capitalize">{recommendation.method}</span>
                  </li>
                )}
                {recommendation.dose && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span className="text-sm text-foreground capitalize">{recommendation.dose} dose</span>
                  </li>
                )}
              </ul>

              <p className="text-[11px] text-muted-foreground mt-3">
                Based on {recommendation.sampleSize} sessions with this goal
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Worth Watching */}
      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                <h3 className="font-serif text-base font-medium text-foreground">
                  Worth Watching
                </h3>
              </div>

              <p className="text-sm text-foreground mb-3">
                You often report negative outcomes when using:
              </p>

              <ul className="space-y-2 ml-1">
                {warnings.map((w) => (
                  <li key={w.label} className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">•</span>
                    <div>
                      <span className="text-sm font-medium text-foreground capitalize">{w.label}</span>
                      <p className="text-xs text-muted-foreground">{w.detail}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {w.rate}% · {w.sampleSize} sessions
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="text-xs text-muted-foreground mt-3 italic">
                Consider avoiding or adjusting your approach.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
