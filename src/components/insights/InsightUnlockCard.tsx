import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface InsightUnlockCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  current?: number;
  target?: number;
  unit?: string;
}

export function InsightUnlockCard({
  icon: Icon,
  title,
  subtitle,
  current,
  target,
  unit = "sessions",
}: InsightUnlockCardProps) {
  const hasProgress = current != null && target != null && target > 0;
  const progress = hasProgress ? Math.min(current / target, 1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-foreground leading-snug">
            {title}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Progress bar */}
          {hasProgress && (
            <div className="w-full max-w-[200px] space-y-1.5 mt-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {current} of {target} {unit} logged
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
