import { motion } from "framer-motion";
import { Plus, Calendar, Flame, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { InsightCard } from "@/components/home/InsightCard";
import { QuickStat } from "@/components/home/QuickStat";
import { RecentSession } from "@/components/home/RecentSession";

const Index = () => {
  return (
    <AppLayout>
      <div className="gradient-hero min-h-screen">
        {/* Header */}
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-sm text-muted-foreground mb-1">Good evening</p>
            <h1 className="font-serif text-2xl font-medium text-foreground">
              Your Cannabis Journal
            </h1>
          </motion.div>
        </header>

        <div className="px-5 space-y-6">
          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Link to="/log">
              <Button variant="primary" size="xl" className="w-full">
                <Plus className="w-5 h-5" />
                Log a Session
              </Button>
            </Link>
          </motion.div>

          {/* Insight Card */}
          <InsightCard
            icon="sleep"
            title="Sleep Pattern Detected"
            description="Lower doses in the evening have correlated with better sleep quality for you over the past 2 weeks."
            stat="82%"
            statLabel="positive outcomes this week"
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <QuickStat
              icon={Calendar}
              label="This Week"
              value="4"
              trend="neutral"
              delay={0.2}
            />
            <QuickStat
              icon={Flame}
              label="Streak"
              value="12 days"
              trend="up"
              delay={0.25}
            />
            <QuickStat
              icon={Clock}
              label="Avg Time"
              value="8:30pm"
              trend="neutral"
              delay={0.3}
            />
          </div>

          {/* Recent Sessions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-medium text-foreground">
                Recent Sessions
              </h2>
              <Link
                to="/insights"
                className="text-sm text-primary font-medium hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-2">
              <RecentSession
                intent="Sleep"
                strain="Granddaddy Purple"
                outcome="positive"
                timeAgo="Yesterday, 9:45 PM"
                delay={0.35}
              />
              <RecentSession
                intent="Relaxation"
                strain="Blue Dream"
                outcome="positive"
                timeAgo="2 days ago"
                delay={0.4}
              />
              <RecentSession
                intent="Focus"
                strain="Jack Herer"
                outcome="neutral"
                timeAgo="3 days ago"
                delay={0.45}
              />
            </div>
          </section>

          {/* Education Teaser */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="pb-8"
          >
            <Link to="/learn">
              <div className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Featured Article
                </p>
                <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                  Understanding Terpenes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Learn how aromatic compounds influence your experience
                </p>
              </div>
            </Link>
          </motion.section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
