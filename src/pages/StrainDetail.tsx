import { motion } from "framer-motion";
import { ArrowLeft, Users, Shield, TrendingUp } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { useStrain, formatPotencyRange } from "@/hooks/useStrains";
import { useStrainCommunityStats, hasEnoughData, hasAggregateData, MIN_SESSIONS_FOR_DISPLAY } from "@/hooks/useStrainCommunityStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const typeColors = {
  Indica: "bg-purple-100 text-purple-700",
  Sativa: "bg-amber-100 text-amber-700",
  Hybrid: "bg-emerald-100 text-emerald-700",
};

const effectLabels = {
  sleepiness: "Sleepiness",
  relaxation: "Relaxation",
  anxiety: "Anxiety",
  focus: "Focus",
  pain_relief: "Pain Relief",
  euphoria: "Euphoria",
};

const effectColors = {
  sleepiness: "bg-indigo-500",
  relaxation: "bg-emerald-500",
  anxiety: "bg-rose-500",
  focus: "bg-amber-500",
  pain_relief: "bg-blue-500",
  euphoria: "bg-pink-500",
};

export default function StrainDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: strain, isLoading: strainLoading } = useStrain(id || "");
  const { data: communityStats, isLoading: statsLoading } = useStrainCommunityStats(id || "");

  if (strainLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background px-5 pt-12 safe-top">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-32 rounded-xl mb-4" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!strain) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
          <h2 className="font-serif text-xl text-foreground mb-4">Strain not found</h2>
          <Button onClick={() => navigate("/strains")} variant="outline">
            Back to Library
          </Button>
        </div>
      </AppLayout>
    );
  }

  const showCommunityStats = hasEnoughData(communityStats);

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-4 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => navigate("/strains")}
              className="flex items-center gap-2 text-muted-foreground mb-4 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Library</span>
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-2xl font-medium text-foreground">
                  {strain.name}
                </h1>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    typeColors[strain.type as keyof typeof typeColors]
                  }`}
                >
                  {strain.type}
                </span>
              </div>
            </div>
          </motion.div>
        </header>

        <div className="px-5 pb-8 space-y-4">
          {/* Potency Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4">
              <h3 className="font-medium text-foreground mb-3">Potency</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">THC</span>
                  <p className="text-lg font-medium text-foreground">
                    {formatPotencyRange(strain.thc_min, strain.thc_max) || "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">CBD</span>
                  <p className="text-lg font-medium text-foreground">
                    {formatPotencyRange(strain.cbd_min, strain.cbd_max) || "Unknown"}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Description */}
          {strain.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-4">
                <h3 className="font-medium text-foreground mb-2">About</h3>
                <p className="text-muted-foreground">{strain.description}</p>
              </Card>
            </motion.div>
          )}

          {/* Common Effects */}
          {strain.common_effects && strain.common_effects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4">
                <h3 className="font-medium text-foreground mb-3">Common Effects</h3>
                <div className="flex flex-wrap gap-2">
                  {strain.common_effects.map((effect) => (
                    <span
                      key={effect}
                      className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {effect}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Community Patterns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">Community Patterns</h3>
              </div>

              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : showCommunityStats && communityStats ? (
                <div className="space-y-4">
                  {/* Session Count & Positive Outcome */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Based on {communityStats.total_sessions} sessions
                    </span>
                    {communityStats.percent_positive_outcome !== null && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">
                          {communityStats.percent_positive_outcome}% positive
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Average Effect Scores */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-medium">
                      Average Effect Ratings (0-10)
                    </p>
                    {Object.entries(effectLabels).map(([key, label]) => {
                      const value = communityStats[`avg_${key}` as keyof typeof communityStats] as number | null;
                      if (value === null) return null;
                      
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium text-foreground">{value}</span>
                          </div>
                          <Progress 
                            value={value * 10} 
                            className={`h-2 ${effectColors[key as keyof typeof effectColors]}`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Privacy Note */}
                  <div className="flex items-start gap-2 pt-3 border-t border-border">
                    <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Aggregated and anonymous. Based on your community's data, no personal information is shared.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    Not enough data yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Community patterns appear after {MIN_SESSIONS_FOR_DISPLAY}+ sessions are logged for this strain.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Log Session CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to={`/log?strain=${encodeURIComponent(strain.name)}`}>
              <Button className="w-full" size="lg">
                Log a Session with {strain.name}
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
