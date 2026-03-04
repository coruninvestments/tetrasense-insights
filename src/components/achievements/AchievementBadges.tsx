import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useAchievements } from "@/hooks/useAchievements";
import { ACHIEVEMENT_DEFS, getAchievementDef } from "@/lib/achievements";
import { toast } from "sonner";

export function AchievementBadges() {
  const { data: achievements, isLoading } = useAchievements();
  const unlockedKeys = new Set(achievements?.map((a) => a.key) ?? []);

  const handleShare = (key: string) => {
    const def = getAchievementDef(key);
    if (!def) return;
    const text = `I earned "${def.title}" on Signal Leaf! ${def.description}`;
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

  const foundingDef = ACHIEVEMENT_DEFS.find((d) => d.featured);
  const regularDefs = ACHIEVEMENT_DEFS.filter((d) => !d.featured);
  const foundingUnlocked = foundingDef ? unlockedKeys.has(foundingDef.key) : false;
  const foundingRecord = foundingDef ? achievements?.find((a) => a.key === foundingDef.key) : null;

  return (
    <TooltipProvider>
      <section>
        <h2 className="font-serif text-lg font-medium text-foreground mb-4">Achievements</h2>

        {foundingDef && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Card
                  className={`relative overflow-hidden p-5 ${
                    foundingUnlocked
                      ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background to-amber-600/5"
                      : "opacity-40 grayscale"
                  }`}
                >
                  {foundingUnlocked && (
                    <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[radial-gradient(ellipse_at_top_left,_hsl(45_100%_60%),_transparent_60%)]" />
                  )}
                  <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      {(() => { const Icon = foundingDef.icon; return <Icon className="h-6 w-6 text-amber-500" strokeWidth={2} />; })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${foundingUnlocked ? "text-amber-500" : "text-foreground"}`}>
                        {foundingDef.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{foundingDef.description}</p>
                      {foundingUnlocked && foundingRecord && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Since {new Date(foundingRecord.unlocked_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {foundingUnlocked && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleShare(foundingDef.key)}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-center">
                <p className="text-xs">{foundingDef.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {regularDefs.map((def, i) => {
            const unlocked = unlockedKeys.has(def.key);
            const record = achievements?.find((a) => a.key === def.key);
            const Icon = def.icon;

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
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                  </div>
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
    </TooltipProvider>
  );
}
