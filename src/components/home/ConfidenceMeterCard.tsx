import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, ChevronRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { computeConfidence, type ConfidenceLevel } from "@/lib/confidenceEngine";
import { logEvent } from "@/lib/analytics";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect } from "react";

const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-accent/20 text-accent-foreground",
  High: "bg-primary/15 text-primary",
};

export function ConfidenceMeterCard() {
  const { data: sessions, isLoading } = useSessionLogs();

  const result = useMemo(
    () => computeConfidence(sessions ?? []),
    [sessions]
  );

  useEffect(() => {
    logEvent("viewed_confidence_meter");
  }, []);

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card><CardContent className="p-5"><Skeleton className="h-24 rounded-xl" /></CardContent></Card>
      </motion.div>
    );
  }

  const { confidenceScore, level, reasons, nextSteps } = result;
  const isHighConfidence = level === "High";

  const handleCtaTap = () => {
    logEvent("tapped_confidence_cta");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <Card>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" strokeWidth={2} />
              <h3 className="text-sm font-medium text-foreground">Pattern Confidence</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-3 h-3" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs">
                  <p>Measures the reliability of your personal patterns based on session volume, consistency, and recency.</p>
                  <p className="mt-1 text-muted-foreground text-[10px]">This is not a medical assessment.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Badge className={`text-[10px] font-medium border-0 px-2 py-0.5 ${LEVEL_STYLES[level]}`}>
              {level}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${confidenceScore}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                {confidenceScore}% confidence
              </p>
            </div>
          </div>

          {/* Reasons */}
          {reasons.length > 0 && (
            <div className="mt-2.5 space-y-0.5">
              {reasons.slice(0, 2).map((r, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">{r}</p>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-3">
            {isHighConfidence ? (
              <Link
                to="/insights"
                onClick={handleCtaTap}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
              >
                View your strongest patterns
                <ChevronRight className="w-3 h-3" />
              </Link>
            ) : (
              <Link
                to="/log"
                onClick={handleCtaTap}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
              >
                Log a session to improve confidence
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
