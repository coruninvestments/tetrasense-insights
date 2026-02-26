import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAchievements } from "@/hooks/useAchievements";
import { ACHIEVEMENT_DEFS, getAchievementDef } from "@/lib/achievements";
import { toast } from "sonner";

export function AchievementBadges() {
  const { data: achievements, isLoading } = useAchievements();
  const unlockedKeys = new Set(achievements?.map((a) => a.key) ?? []);

  const handleShare = (key: string) => {
    const def = getAchievementDef(key);
    if (!def) return;
    const text = `🏆 I earned "${def.title}" on TetraSense! ${def.description}`;
    navigator.clipboard?.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) {
    return (
      <section>
        <h2 className="font-serif text-lg font-medium text-foreground mb-4">Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-serif text-lg font-medium text-foreground mb-4">Achievements</h2>
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENT_DEFS.map((def, i) => {
          const unlocked = unlockedKeys.has(def.key);
          const record = achievements?.find((a) => a.key === def.key);

          return (
            <motion.div
              key={def.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                variant="glass"
                className={`p-4 text-center relative ${
                  unlocked ? "" : "opacity-40 grayscale"
                }`}
              >
                <span className="text-3xl">{def.emoji}</span>
                <p className="text-sm font-medium text-foreground mt-2">{def.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{def.description}</p>
                {unlocked && record && (
                  <>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(record.unlocked_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleShare(def.key)}
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
