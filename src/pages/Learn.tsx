import { motion } from "framer-motion";
import { Book, Clock, ChevronRight, Dna, BarChart3, Moon, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import type { LucideIcon } from "lucide-react";

const quickReads = [
  {
    id: "1",
    title: "CBD vs. THC: What's the Difference?",
    readTime: "2 min",
    category: "Cannabinoids",
  },
  {
    id: "2",
    title: "Understanding Tolerance Breaks",
    readTime: "3 min",
    category: "Health",
  },
  {
    id: "3",
    title: "The Role of Terpenes",
    readTime: "2 min",
    category: "Science",
  },
];

const deepGuides: { id: string; title: string; description: string; readTime: string; icon: LucideIcon }[] = [
  {
    id: "1",
    title: "Complete Guide to Cannabinoids",
    description: "Everything you need to know about THC, CBD, CBN, and more",
    readTime: "12 min",
    icon: Dna,
  },
  {
    id: "2",
    title: "Dosing for Beginners",
    description: "How to find your optimal dose and avoid overconsumption",
    readTime: "8 min",
    icon: BarChart3,
  },
  {
    id: "3",
    title: "Cannabis & Sleep",
    description: "How cannabis affects sleep quality and what strains work best",
    readTime: "10 min",
    icon: Moon,
  },
  {
    id: "4",
    title: "Methods of Consumption",
    description: "Pros and cons of smoking, vaping, edibles, and more",
    readTime: "7 min",
    icon: Wind,
  },
];

export default function Learn() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-6 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-2xl font-medium text-foreground">
              Knowledge Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Learn the science behind cannabis
            </p>
          </motion.div>
        </header>

        <div className="px-5 pb-8 space-y-8">
          {/* Quick Reads */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-medium text-foreground">
                Quick Reads
              </h2>
              <Link
                to="/learn/all"
                className="text-sm text-primary font-medium hover:underline"
              >
                See all
              </Link>
            </div>

            <div className="space-y-2">
              {quickReads.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/learn/${article.id}`}>
                    <Card
                      variant="interactive"
                      className="p-4 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Book className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {article.category}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Deep Guides */}
          <section>
            <h2 className="font-serif text-lg font-medium text-foreground mb-4">
              Deep Guides
            </h2>

            <div className="grid gap-4">
              {deepGuides.map((guide, index) => {
                const Icon = guide.icon;
                return (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Link to={`/learn/guide/${guide.id}`}>
                      <Card variant="elevated" className="overflow-hidden">
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-6 w-6 text-primary" strokeWidth={2} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                                {guide.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {guide.description}
                              </p>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {guide.readTime} read
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
