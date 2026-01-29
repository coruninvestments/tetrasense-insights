import { motion } from "framer-motion";
import { Heart, PieChart, Activity, TrendingUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRelationshipInsights, RelationshipInsight, DataQualityTier } from "@/hooks/useRelationshipInsights";

const iconMap = {
  "primary-intent": Heart,
  "outcome-balance": PieChart,
  "correlation": Activity,
  "stability": TrendingUp,
};

const tierBadgeConfig: Record<DataQualityTier, { label: string; className: string }> = {
  insufficient: { label: "Needs Data", className: "bg-muted text-muted-foreground" },
  early: { label: "Early", className: "bg-amber-500/10 text-amber-600" },
  good: { label: "Good", className: "bg-primary/10 text-primary" },
  strong: { label: "Strong", className: "bg-emerald-500/10 text-emerald-600" },
};

interface RelationshipCardProps {
  insight: RelationshipInsight;
}

function RelationshipCard({ insight }: RelationshipCardProps) {
  const Icon = iconMap[insight.type];
  const badge = tierBadgeConfig[insight.tier];

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-medium text-foreground">
                {insight.title}
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotEnoughDataCard({ sessionCount }: { sessionCount: number }) {
  const needed = 5 - sessionCount;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="glass" className="overflow-hidden">
        <CardContent className="p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            Building Your Profile
          </h3>
          <p className="text-sm text-muted-foreground">
            Log {needed} more session{needed !== 1 ? "s" : ""} to see insights about your cannabis relationship.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RelationshipInsightsSection() {
  const { data, isLoading } = useRelationshipInsights();

  if (isLoading) {
    return (
      <section>
        <h2 className="font-serif text-lg font-medium text-foreground mb-4">
          Your Cannabis Relationship
        </h2>
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section>
      <h2 className="font-serif text-lg font-medium text-foreground mb-4">
        Your Cannabis Relationship
      </h2>

      {!data.hasMinimumData ? (
        <NotEnoughDataCard sessionCount={data.sessionCount} />
      ) : data.insights.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card variant="glass" className="overflow-hidden">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">
                Continue logging to reveal more insights about your personal patterns.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {data.insights.map((insight) => (
            <motion.div
              key={insight.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <RelationshipCard insight={insight} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4 px-4">
        These insights reflect your logged data and personal patterns, not general advice.
      </p>
    </section>
  );
}
