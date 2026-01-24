import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BarChart3, AlertCircle, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type DataQuality = "insufficient" | "early" | "good" | "strong";

interface DataQualityIndicatorProps {
  totalSessions: number;
}

const tierOrder: DataQuality[] = ["insufficient", "early", "good", "strong"];
const tierLabels: Record<DataQuality, string> = {
  insufficient: "Not enough data",
  early: "Early",
  good: "Good",
  strong: "Strong",
};

export function getDataQuality(totalSessions: number): DataQuality {
  if (totalSessions < 3) return "insufficient";
  if (totalSessions <= 6) return "early";
  if (totalSessions <= 14) return "good";
  return "strong";
}

// Tier thresholds for progress calculation
const tierThresholds: Record<DataQuality, { start: number; target: number }> = {
  insufficient: { start: 0, target: 3 },
  early: { start: 3, target: 7 },
  good: { start: 7, target: 15 },
  strong: { start: 15, target: 15 }, // Max tier
};

function getProgressInfo(totalSessions: number, quality: DataQuality) {
  if (quality === "strong") {
    return { sessionsRemaining: 0, progressPercent: 100, isMaxTier: true };
  }

  const { start, target } = tierThresholds[quality];
  const sessionsRemaining = Math.max(0, target - totalSessions);
  const rangeSize = target - start;
  const progressInRange = totalSessions - start;
  const progressPercent = Math.min(100, Math.max(0, (progressInRange / rangeSize) * 100));

  return { sessionsRemaining, progressPercent, isMaxTier: false };
}

const qualityConfig: Record<DataQuality, {
  label: string;
  description: string;
  Icon: typeof BarChart3;
  colorClass: string;
  bgClass: string;
}> = {
  insufficient: {
    label: "Not enough data",
    description: "Log at least 3 sessions to see patterns",
    Icon: AlertCircle,
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/50",
  },
  early: {
    label: "Early data",
    description: "Patterns may change as you log more",
    Icon: BarChart3,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500/10",
  },
  good: {
    label: "Good",
    description: "Reliable patterns emerging",
    Icon: TrendingUp,
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  strong: {
    label: "Strong",
    description: "High-confidence insights available",
    Icon: Sparkles,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500/10",
  },
};

export function DataQualityIndicator({ totalSessions }: DataQualityIndicatorProps) {
  const quality = getDataQuality(totalSessions);
  const config = qualityConfig[quality];
  const { Icon, label, description, colorClass, bgClass } = config;
  const { sessionsRemaining, progressPercent, isMaxTier } = getProgressInfo(totalSessions, quality);
  
  // Track previous tier for celebration effect
  const prevTierRef = useRef<DataQuality | null>(null);
  
  useEffect(() => {
    if (prevTierRef.current === null) {
      // First render: initialize without celebrating
      prevTierRef.current = quality;
      return;
    }
    
    const prevIndex = tierOrder.indexOf(prevTierRef.current);
    const currentIndex = tierOrder.indexOf(quality);
    
    // Only celebrate if tier increased (not decreased)
    if (currentIndex > prevIndex) {
      toast({
        title: `Tier Up: ${tierLabels[quality]} 🎉`,
        description: qualityConfig[quality].description,
        duration: 2500,
      });
    }
    
    prevTierRef.current = quality;
  }, [quality]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bgClass}`}
      role="status"
      aria-label={`Data quality: ${label}. ${description}. ${isMaxTier ? "Max tier reached" : `${sessionsRemaining} session${sessionsRemaining !== 1 ? "s" : ""} to next tier`}`}
    >
      <div className="w-8 h-8 rounded-lg bg-background/60 backdrop-blur-sm border border-border/40 shadow-sm flex items-center justify-center">
        <Icon className={`w-4 h-4 ${colorClass}`} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${colorClass}`}>
            Data Quality: {label}
          </span>
          <span className="text-xs text-muted-foreground">
            ({totalSessions} session{totalSessions !== 1 ? "s" : ""})
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        
        {/* Progress to next tier */}
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            {isMaxTier 
              ? "Max tier reached" 
              : `Next tier in ${sessionsRemaining} session${sessionsRemaining !== 1 ? "s" : ""}`
            }
          </p>
          <div 
            className="h-1 w-full rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress to next tier: ${Math.round(progressPercent)}%`}
          >
            <motion.div
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${isMaxTier ? "bg-emerald-500" : "bg-primary"}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
