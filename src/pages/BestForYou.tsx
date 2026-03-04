import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SignalLeafLogo } from "@/components/brand/SignalLeafLogo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { EmptyState } from "@/components/ui/EmptyState";
import { BrandImage } from "@/components/brand/BrandImage";
import { ASSETS } from "@/lib/assets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSessionLogs, type SessionIntent } from "@/hooks/useSessionLogs";
import { usePublicBatchBrowse } from "@/hooks/usePublicBatchBrowse";
import { computeStrainRankings, type StrainRanking } from "@/lib/bestForYou";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallGate } from "@/components/premium/PaywallGate";

const INTENTS: { value: SessionIntent; label: string }[] = [
  { value: "sleep", label: "Sleep" },
  { value: "relaxation", label: "Relaxation" },
  { value: "creativity", label: "Creativity" },
  { value: "focus", label: "Focus" },
  { value: "pain_relief", label: "Pain Relief" },
  { value: "social", label: "Social" },
  { value: "recreation", label: "Recreation" },
  { value: "learning", label: "Learning" },
];

const TYPE_CHIPS = ["All", "Indica", "Sativa", "Hybrid"] as const;

export default function BestForYou() {
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [minSessions, setMinSessions] = useState(2);
  const { isPremium } = useSubscription();

  const { data: sessions, isLoading } = useSessionLogs();
  const { data: verifiedBatches } = usePublicBatchBrowse();

  // Build COA status map
  const coaMap = useMemo(() => {
    if (!verifiedBatches) return new Set<string>();
    const set = new Set<string>();
    for (const b of verifiedBatches as any[]) {
      const name = (b.strain_name || b.product_name || "").toLowerCase();
      if (name) set.add(name);
    }
    return set;
  }, [verifiedBatches]);

  const rankings = useMemo(() => {
    if (!sessions) return [];
    return computeStrainRankings(
      sessions,
      intentFilter === "all" ? null : intentFilter,
      typeFilter === "All" ? null : typeFilter,
      minSessions
    );
  }, [sessions, intentFilter, typeFilter, minSessions]);

  const hasEnoughData = (sessions?.length ?? 0) >= 2;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-2 safe-top">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <SignalLeafLogo variant="icon" size="md" />
              <div>
                <h1 className="font-serif text-2xl font-medium text-foreground flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Best for you
                </h1>
                <p className="text-xs text-muted-foreground">Personalized strain rankings from your sessions</p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Filters */}
        <div className="px-5 py-4 space-y-4">
          {/* Intent dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Goal</span>
            <Select value={intentFilter} onValueChange={setIntentFilter}>
              <SelectTrigger className="h-9 text-xs bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All intents</SelectItem>
                {INTENTS.map(i => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type chips */}
          <div className="flex gap-2">
            {TYPE_CHIPS.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Min sessions slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Min sessions</span>
            {isPremium ? (
              <Slider
                value={[minSessions]}
                onValueChange={([v]) => setMinSessions(v)}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <Slider
                  value={[minSessions]}
                  onValueChange={([v]) => setMinSessions(Math.min(v, 2))}
                  min={1}
                  max={2}
                  step={1}
                  className="flex-1"
                />
                <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
            )}
            <span className="text-xs font-medium text-foreground w-4 text-right">{minSessions}</span>
          </div>
        </div>

        {/* Rankings list */}
        <div className="px-5 pb-28 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : !hasEnoughData ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="w-full max-h-[140px] flex items-center justify-center opacity-50">
                <BrandImage
                  src={ASSETS.emptyInsightsDark}
                  alt="Keep logging"
                  themeAware
                  className="max-h-[140px] w-auto object-contain rounded-xl"
                />
              </div>
              <EmptyState
                title="Not enough data yet"
                description="Log at least 2 sessions to see personalized rankings."
                actionLabel="Log a session"
                actionTo="/log"
              />
            </motion.div>
          ) : rankings.length > 0 ? (
            rankings.map((strain, idx) => (
              <motion.div
                key={strain.strainName}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4) }}
              >
                <RankingCard
                  rank={idx + 1}
                  strain={strain}
                  hasVerifiedCoa={coaMap.has(strain.strainName.toLowerCase())}
                  isPremium={isPremium}
                />
              </motion.div>
            ))
          ) : (
            <EmptyState
              title="No matches for these filters"
              description="Try adjusting your filters or log more sessions."
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function RankingCard({
  rank,
  strain,
  hasVerifiedCoa,
  isPremium,
}: {
  rank: number;
  strain: StrainRanking;
  hasVerifiedCoa: boolean;
  isPremium: boolean;
}) {
  const [open, setOpen] = useState(false);
  const typeLower = (strain.strainType ?? "hybrid").toLowerCase();
  const typeStyle =
    typeLower === "indica"
      ? "bg-accent/20 text-accent-foreground"
      : typeLower === "sativa"
      ? "bg-primary/15 text-primary"
      : "bg-secondary text-secondary-foreground";

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Rank */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base font-medium text-foreground truncate">
                {strain.strainName}
              </h3>
              <Badge className={`text-[9px] font-medium border-0 ${typeStyle}`}>
                {strain.strainType ?? "Hybrid"}
              </Badge>
              {hasVerifiedCoa && (
                <Badge className="text-[9px] font-medium border-0 bg-success/15 text-success gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  COA
                </Badge>
              )}
              {strain.hasAnxietyRisk && (
                <Badge className="text-[9px] font-medium border-0 bg-destructive/15 text-destructive gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Anxiety risk
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
              <span>{strain.sessionsCount} session{strain.sessionsCount !== 1 ? "s" : ""}</span>
              <span className="text-success font-medium">{Math.round(strain.positiveRate * 100)}% positive</span>
              {strain.negativeRate > 0 && (
                <span className="text-destructive">{Math.round(strain.negativeRate * 100)}% negative</span>
              )}
            </div>

            {/* Why it ranks — collapsible (premium) */}
            {isPremium ? (
              <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger className="flex items-center gap-1 mt-2 text-[11px] text-primary hover:underline">
                  Why it ranks
                  {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="mt-1.5 space-y-0.5">
                    {strain.reasons.map((r, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground/50">
                <Lock className="w-3 h-3" />
                <span>Why it ranks · Premium</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
