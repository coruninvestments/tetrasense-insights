import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { getAchievementDef, type AchievementKey } from "@/lib/achievements";

interface Props {
  achievementKey: AchievementKey | null;
  onClose: () => void;
}

export function AchievementUnlockedModal({ achievementKey, onClose }: Props) {
  const def = achievementKey ? getAchievementDef(achievementKey) : null;

  const handleShare = () => {
    const text = `🏆 I just unlocked "${def?.title}" on TetraSense! ${def?.description}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <Dialog open={!!achievementKey} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xs text-center p-6">
        <AnimatePresence>
          {def && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="flex flex-col items-center gap-3"
            >
              <span className="text-5xl">{def.emoji}</span>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Achievement Unlocked
              </p>
              <h2 className="font-serif text-xl font-medium text-foreground">
                {def.title}
              </h2>
              <p className="text-sm text-muted-foreground">{def.description}</p>

              <div className="flex gap-2 mt-2 w-full">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button size="sm" className="flex-1" onClick={onClose}>
                  Nice!
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
