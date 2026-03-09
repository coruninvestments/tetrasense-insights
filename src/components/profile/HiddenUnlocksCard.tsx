import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getUnlockedEggs, getUnlockedEggDefs, type EasterEggKey } from "@/lib/easterEggs";
import { useAchievements } from "@/hooks/useAchievements";

export function HiddenUnlocksCard() {
  const { data: achievements } = useAchievements();
  const achievementKeys = (achievements ?? []).map((a) => a.key);
  const eggDefs = getUnlockedEggDefs(achievementKeys);

  if (eggDefs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary/60 text-sm">✦</span>
        <h2 className="font-serif text-lg font-medium text-foreground">Hidden Discoveries</h2>
      </div>
      <div className="space-y-2">
        {eggDefs.map((egg, i) => (
          <motion.div
            key={egg.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
          >
            <Card className="p-4 relative overflow-hidden group">
              {/* Subtle stardust */}
              <div className="absolute top-2 right-4 w-0.5 h-0.5 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />
              <div className="absolute bottom-3 right-8 w-0.5 h-0.5 rounded-full bg-primary/15 group-hover:bg-primary/30 transition-colors" />

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-lg text-primary/70">{egg.glyph}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{egg.title}</p>
                  <p className="text-xs text-muted-foreground">{egg.subtitle}</p>
                </div>
              </div>

              {/* Halo */}
              <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/3 via-transparent to-transparent pointer-events-none" />
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
