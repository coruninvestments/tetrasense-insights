import { motion } from "framer-motion";
import { BarChart3, AlertCircle, TrendingUp, Sparkles } from "lucide-react";

type DataQuality = "insufficient" | "early" | "good" | "strong";

interface DataQualityIndicatorProps {
  totalSessions: number;
}

function getDataQuality(totalSessions: number): DataQuality {
  if (totalSessions < 3) return "insufficient";
  if (totalSessions <= 6) return "early";
  if (totalSessions <= 14) return "good";
  return "strong";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl ${bgClass}`}
      role="status"
      aria-label={`Data quality: ${label}. ${description}`}
    >
      <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center`}>
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
      </div>
    </motion.div>
  );
}
