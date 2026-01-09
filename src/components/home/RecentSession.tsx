import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface RecentSessionProps {
  intent: string;
  strain: string;
  outcome: "positive" | "neutral" | "negative";
  timeAgo: string;
  delay?: number;
}

const outcomeColors = {
  positive: "bg-success/10 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/10 text-destructive",
};

const outcomeLabels = {
  positive: "Good",
  neutral: "Okay",
  negative: "Poor",
};

export function RecentSession({ intent, strain, outcome, timeAgo, delay = 0 }: RecentSessionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        to="/insights"
        className="flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-secondary/50 transition-colors group"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground capitalize">
              {intent}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground truncate">
              {strain}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${outcomeColors[outcome]}`}
          >
            {outcomeLabels[outcome]}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}
