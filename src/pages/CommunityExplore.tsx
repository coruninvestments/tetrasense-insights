import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Users, TrendingUp } from "lucide-react";
import { useCommunityStrainStats } from "@/hooks/useCommunityStrainStats";
import { format } from "date-fns";
import { motion } from "framer-motion";

const INTENTS = [
  { value: "", label: "All" },
  { value: "sleep", label: "Sleep" },
  { value: "relaxation", label: "Relaxation" },
  { value: "creativity", label: "Creativity" },
  { value: "focus", label: "Focus" },
  { value: "pain_relief", label: "Pain Relief" },
  { value: "social", label: "Social" },
  { value: "recreation", label: "Recreation" },
];

const typeColor: Record<string, string> = {
  indica: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  sativa: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  hybrid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function CommunityExplore() {
  const [selectedIntent, setSelectedIntent] = useState("");
  const { data: stats, isLoading } = useCommunityStrainStats(selectedIntent || undefined);

  return (
    <AppLayout>
      <div className="space-y-5 pb-24">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold text-foreground">Community Explore</h1>
          <p className="text-sm text-muted-foreground">
            Top strains by intent, based on anonymized community data.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          <span>
            All data is aggregated and anonymized. No individual sessions, notes, or personal details are shown.
          </span>
        </div>

        {/* Intent filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {INTENTS.map((intent) => (
            <button
              key={intent.value}
              type="button"
              onClick={() => setSelectedIntent(intent.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedIntent === intent.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {intent.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : !stats || stats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No community data available yet.</p>
            <p className="text-xs mt-1">Data will appear once enough sessions are aggregated.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className="p-4">
                  <CardContent className="p-0 space-y-3">
                    {/* Strain header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="font-serif text-base font-medium text-foreground">
                          {stat.strain_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${typeColor[stat.strain_type.toLowerCase()] ?? ""}`}
                          >
                            {stat.strain_type}
                          </Badge>
                          {selectedIntent === "" && (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {stat.intent.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{stat.sample_size}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top effects */}
                    {stat.top_effects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {stat.top_effects.slice(0, 3).map((effect) => (
                          <span
                            key={effect}
                            className="rounded-md bg-accent/50 px-2 py-0.5 text-[11px] text-accent-foreground capitalize"
                          >
                            {effect.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Outcome breakdown */}
                    {stat.outcome_positive_pct !== null && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span>Outcome breakdown</span>
                        </div>
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                          {stat.outcome_positive_pct != null && stat.outcome_positive_pct > 0 && (
                            <div
                              className="bg-emerald-500 transition-all"
                              style={{ width: `${stat.outcome_positive_pct}%` }}
                            />
                          )}
                          {stat.outcome_neutral_pct != null && stat.outcome_neutral_pct > 0 && (
                            <div
                              className="bg-amber-500 transition-all"
                              style={{ width: `${stat.outcome_neutral_pct}%` }}
                            />
                          )}
                          {stat.outcome_avoid_pct != null && stat.outcome_avoid_pct > 0 && (
                            <div
                              className="bg-red-400 transition-all"
                              style={{ width: `${stat.outcome_avoid_pct}%` }}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>👍 {stat.outcome_positive_pct}%</span>
                          <span>😐 {stat.outcome_neutral_pct ?? 0}%</span>
                          <span>👎 {stat.outcome_avoid_pct ?? 0}%</span>
                        </div>
                      </div>
                    )}

                    {/* Last updated */}
                    <p className="text-[10px] text-muted-foreground/60">
                      Updated {format(new Date(stat.last_updated), "MMM d, yyyy")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
