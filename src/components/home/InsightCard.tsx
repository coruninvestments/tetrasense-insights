import { motion } from "framer-motion";
import { TrendingUp, Moon, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface InsightCardProps {
  title: string;
  description: string;
  icon?: "trending" | "sleep" | "focus";
  stat?: string;
  statLabel?: string;
}

const iconMap = {
  trending: TrendingUp,
  sleep: Moon,
  focus: Brain,
};

export function InsightCard({
  title,
  description,
  icon = "trending",
  stat,
  statLabel,
}: InsightCardProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card variant="insight" className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {stat && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-serif font-medium text-primary">
                  {stat}
                </span>
                {statLabel && (
                  <span className="text-sm text-muted-foreground">
                    {statLabel}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
