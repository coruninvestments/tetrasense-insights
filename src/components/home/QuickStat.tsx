import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface QuickStatProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export function QuickStat({ icon: Icon, label, value, trend = "neutral", delay = 0 }: QuickStatProps) {
  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card variant="interactive" className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
            <Icon className="w-4 h-4 text-secondary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className={`text-lg font-serif font-medium ${trendColors[trend]}`}>
              {value}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
