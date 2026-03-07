import { motion } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, Share2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeConnoisseurProfile, type ConnoisseurConfidence } from "@/lib/connoisseurProfile";
import { useMemo } from "react";
import { toast } from "sonner";

const CONFIDENCE_CONFIG: Record<ConnoisseurConfidence, { label: string; className: string }> = {
  forming: {
    label: "Forming",
    className: "bg-muted text-muted-foreground",
  },
  low: {
    label: "Early Signal",
    className: "bg-warning/15 text-warning",
  },
  medium: {
    label: "Growing",
    className: "bg-info/15 text-info",
  },
  high: {
    label: "Strong Signal",
    className: "bg-success/15 text-success",
  },
};

export function ConnoisseurProfileCard() {
  const { data: sessions, isLoading } = useSessionLogs();

  const profile = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;
    return computeConnoisseurProfile(sessions);
  }, [sessions]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const conf = CONFIDENCE_CONFIG[profile.confidence];
  const isForming = profile.confidence === "forming";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card variant="glass">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-lg font-medium text-foreground truncate">
                  {profile.profileName}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {profile.subtitle}
                </p>
              </div>
            </div>
            <Badge className={`shrink-0 text-[10px] font-medium border-0 ${conf.className}`}>
              {conf.label}
            </Badge>
          </div>

          {/* Forming state — progress bar */}
          {isForming && (
            <div className="space-y-2">
              <Progress
                value={(profile.sessionCount / 3) * 100}
                className="h-1.5"
              />
              <p className="text-xs text-muted-foreground">
                Log {3 - profile.sessionCount} more session{3 - profile.sessionCount !== 1 ? "s" : ""} to unlock your profile
              </p>
            </div>
          )}

          {/* Strengths */}
          {!isForming && profile.strengths.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Strengths
              </p>
              <ul className="space-y-1.5">
                {profile.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                    <TrendingUp className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Likely avoids */}
          {!isForming && profile.likelyAvoids.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                Watch Patterns
              </p>
              <ul className="space-y-1.5">
                {profile.likelyAvoids.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Share placeholder */}
          {!isForming && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => toast.info("Profile sharing coming soon")}
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Share Profile
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
