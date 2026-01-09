import { motion } from "framer-motion";
import { Lock, ChevronRight, TrendingUp, Moon, Brain, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";

const insights = [
  {
    id: "1",
    icon: Moon,
    title: "Sleep Quality Correlation",
    description: "Lower doses before 9 PM correlate with 23% better sleep quality for you.",
    isPremium: false,
  },
  {
    id: "2",
    icon: Brain,
    title: "Best Strains for Focus",
    description: "Jack Herer and Green Crack show the highest focus ratings in your logs.",
    isPremium: true,
  },
  {
    id: "3",
    icon: AlertCircle,
    title: "Anxiety Warning",
    description: "High doses of sativas tend to increase your anxiety by 40%.",
    isPremium: true,
  },
  {
    id: "4",
    icon: TrendingUp,
    title: "Weekly Pattern",
    description: "Your consumption is highest on Fridays and Saturdays.",
    isPremium: false,
  },
];

export default function Insights() {
  const isPremium = false; // Simulated subscription status

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-2xl font-medium text-foreground">
              Personal Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              Patterns from your session data
            </p>
          </motion.div>
        </header>

        <div className="px-5 pb-8 space-y-6">
          {/* Premium Banner (if not subscribed) */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="gradient-primary border-0 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg font-medium text-primary-foreground mb-1">
                        Unlock All Insights
                      </h3>
                      <p className="text-sm text-primary-foreground/80 mb-4">
                        Get personalized patterns, trend analysis, and predictive insights.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      >
                        Upgrade for $4.99/mo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Overview */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Your Stats
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Card variant="glass" className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Total Sessions
                </p>
                <p className="text-2xl font-serif font-medium text-foreground">
                  47
                </p>
              </Card>
              <Card variant="glass" className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Avg. Positive Rate
                </p>
                <p className="text-2xl font-serif font-medium text-success">
                  78%
                </p>
              </Card>
              <Card variant="glass" className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Top Intent
                </p>
                <p className="text-lg font-serif font-medium text-foreground">
                  Sleep
                </p>
              </Card>
              <Card variant="glass" className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Favorite Strain
                </p>
                <p className="text-lg font-serif font-medium text-foreground truncate">
                  Blue Dream
                </p>
              </Card>
            </div>
          </section>

          {/* Insights List */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Discovered Patterns
            </h2>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    variant={insight.isPremium && !isPremium ? "default" : "interactive"}
                    className={`p-4 ${insight.isPremium && !isPremium ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <insight.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-foreground">
                            {insight.title}
                          </h3>
                          {insight.isPremium && !isPremium && (
                            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.isPremium && !isPremium
                            ? "Upgrade to unlock this insight"
                            : insight.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
