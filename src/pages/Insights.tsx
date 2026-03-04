import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSessionLogs } from "@/hooks/useSessionLogs";
import { RecommendationSection } from "@/components/insights/RecommendationSection";
import { DecisionInsightsSection } from "@/components/insights/DecisionInsightsSection";
import { EffectDriversSection } from "@/components/insights/EffectDriversSection";
import { ContextCorrelationsSection } from "@/components/insights/ContextCorrelationsSection";
import { DoseInsightsSection } from "@/components/insights/DoseInsightsSection";
import { logEvent } from "@/lib/analytics";
import { tryUnlock } from "@/lib/achievements";
import { AchievementUnlockedModal } from "@/components/achievements/AchievementUnlockedModal";
import type { AchievementKey } from "@/lib/achievements";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf } from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Insights() {
  const { data: sessions } = useSessionLogs();
  const queryClient = useQueryClient();
  const [unlockedAchievement, setUnlockedAchievement] = useState<AchievementKey | null>(null);

  useEffect(() => {
    logEvent("viewed_insights");
    tryUnlock("first_insight_view").then((key) => {
      if (key) {
        queryClient.invalidateQueries({ queryKey: ["achievements"] });
        setUnlockedAchievement(key);
      }
    });
  }, []);

  const sessionCount = sessions?.length ?? 0;

  return (
    <>
      <AppLayout>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="px-5 pt-12 pb-4 safe-top">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-medium text-foreground">
                  Insights
                </h1>
                <p className="text-sm text-muted-foreground">
                  {sessionCount > 0
                    ? `Based on ${sessionCount} session${sessionCount !== 1 ? "s" : ""}`
                    : "Log sessions to unlock insights"}
                </p>
              </div>
            </motion.div>
          </header>

          <div className="px-5 pb-28 space-y-5">
            {/* Section 1 — Recommendation */}
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.05 }}
            >
              <SectionHeader number={1} title="Your Recommendation" />
              <RecommendationSection />
            </motion.section>

            {/* Section 2 — Best Matches + Section 3 — Avoid List */}
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <SectionHeader number={2} title="Best Matches & Avoid List" />
              <DecisionInsightsSection />
            </motion.section>

            {/* Section 4 — Dose Insights */}
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.15 }}
            >
              <SectionHeader number={4} title="Dose Insights" />
              <DoseInsightsSection />
            </motion.section>

            {/* Section 5 — Effect Drivers */}
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <SectionHeader number={5} title="Effect Drivers" />
              <EffectDriversSection />
            </motion.section>

            {/* Section 6 — Context Risks */}
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.25 }}
            >
              <SectionHeader number={6} title="Context Risks" />
              <ContextCorrelationsSection />
            </motion.section>

            {/* Disclaimer */}
            <p className="text-[11px] text-muted-foreground text-center pt-2 px-4">
              All insights are based on your personal session data. These are observations, not medical advice.
            </p>
          </div>
        </div>
      </AppLayout>
      <AchievementUnlockedModal
        achievementKey={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />
    </>
  );
}

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-medium flex items-center justify-center shrink-0">
        {number}
      </span>
      <h2 className="font-serif text-base font-medium text-foreground">{title}</h2>
    </div>
  );
}
