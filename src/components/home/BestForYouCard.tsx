import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Trophy, AlertTriangle, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeStrainRankings } from "@/lib/bestForYou";
import { computeConfidence } from "@/lib/confidenceEngine";

export function BestForYouCard() {
  const { data: sessions, isLoading } = useSessionLogs();

  const top3 = useMemo(() => {
    if (!sessions || sessions.length < 2) return [];
    return computeStrainRankings(sessions, null, null, 1).slice(0, 3);
  }, [sessions]);

  const confidence = useMemo(() => computeConfidence(sessions ?? []), [sessions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-sm font-medium text-foreground">Best for you</h3>
                <p className="text-[11px] text-muted-foreground">Based on your sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {top3.length > 0 && (
                <Badge className={`text-[9px] font-medium border-0 px-1.5 py-0 ${
                  confidence.level === "High" ? "bg-primary/15 text-primary" :
                  confidence.level === "Medium" ? "bg-accent/20 text-accent-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <Shield className="w-2.5 h-2.5 mr-0.5" strokeWidth={2} />
                  {confidence.level}
                </Badge>
              )}
              <Link
                to="/best"
                className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
              >
                View all
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Low confidence note */}
          {confidence.level === "Low" && top3.length > 0 && (
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Early signal — log a few more sessions for stronger recommendations.
            </p>
          )}

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : top3.length > 0 ? (
            <div className="space-y-2">
              {top3.map((strain, i) => {
                const typeLower = (strain.strainType ?? "hybrid").toLowerCase();
                const typeStyle =
                  typeLower === "indica"
                    ? "bg-accent/20 text-accent-foreground"
                    : typeLower === "sativa"
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-secondary-foreground";

                return (
                  <Link to="/best" key={strain.strainName}>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {strain.strainName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge className={`text-[9px] font-medium border-0 px-1.5 py-0 ${typeStyle}`}>
                            {strain.strainType ?? "Hybrid"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {strain.sessionsCount} session{strain.sessionsCount !== 1 ? "s" : ""} · {Math.round(strain.positiveRate * 100)}% positive
                          </span>
                          {strain.hasAnxietyRisk && (
                            <span className="text-[10px] text-destructive flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Anxiety risk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              <Link
                to="/best"
                className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5" />
                View full ranking
              </Link>
            </div>
          ) : (
            <EmptyState
              title="Not enough data yet"
              description="Log a few sessions to see your personalized strain rankings."
              actionLabel="Log a session"
              actionTo="/log"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
