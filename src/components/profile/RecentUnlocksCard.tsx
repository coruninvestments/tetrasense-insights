import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConnoisseurPoints } from "@/hooks/useConnoisseurPoints";
import { getCPAchievementDef } from "@/lib/connoisseurPoints";

export function RecentUnlocksCard() {
  const { data: cp, isLoading } = useConnoisseurPoints();

  if (isLoading) return <Skeleton className="h-24 rounded-xl" />;
  if (!cp || cp.recentUnlocks.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card variant="glass">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-foreground mb-3">Recent Unlocks</p>
          <div className="flex flex-wrap gap-2">
            {cp.recentUnlocks.map((unlock) => {
              const def = getCPAchievementDef(unlock.key);
              const Icon = def?.icon;
              return (
                <Badge
                  key={unlock.key}
                  variant="secondary"
                  className="gap-1.5 py-1 px-2.5 text-xs"
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {unlock.title}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
