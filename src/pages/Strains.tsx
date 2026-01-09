import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";

const strains = [
  {
    id: "1",
    name: "Blue Dream",
    type: "Hybrid",
    effects: ["Relaxed", "Creative", "Euphoric"],
    thc: "17-24%",
    description: "A balanced hybrid known for gentle cerebral invigoration",
  },
  {
    id: "2",
    name: "Granddaddy Purple",
    type: "Indica",
    effects: ["Sleepy", "Relaxed", "Hungry"],
    thc: "17-27%",
    description: "A famous indica with potent physical relaxation effects",
  },
  {
    id: "3",
    name: "Jack Herer",
    type: "Sativa",
    effects: ["Focused", "Creative", "Euphoric"],
    thc: "15-24%",
    description: "A clear-headed, creative sativa named after the cannabis activist",
  },
  {
    id: "4",
    name: "OG Kush",
    type: "Hybrid",
    effects: ["Relaxed", "Euphoric", "Sleepy"],
    thc: "19-26%",
    description: "A legendary strain with stress-relieving and mood-enhancing effects",
  },
  {
    id: "5",
    name: "Girl Scout Cookies",
    type: "Hybrid",
    effects: ["Euphoric", "Relaxed", "Creative"],
    thc: "25-28%",
    description: "A potent hybrid with full-body relaxation and cerebral euphoria",
  },
  {
    id: "6",
    name: "Northern Lights",
    type: "Indica",
    effects: ["Sleepy", "Relaxed", "Happy"],
    thc: "16-21%",
    description: "A classic indica known for dreamy, peaceful relaxation",
  },
];

const typeColors = {
  Indica: "bg-purple-100 text-purple-700",
  Sativa: "bg-amber-100 text-amber-700",
  Hybrid: "bg-emerald-100 text-emerald-700",
};

export default function Strains() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredStrains = strains.filter((strain) => {
    const matchesSearch = strain.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !selectedType || strain.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <header className="px-5 pt-12 pb-4 safe-top">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-serif text-2xl font-medium text-foreground mb-4">
              Strain Library
            </h1>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search strains..."
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Type Filters */}
            <div className="flex gap-2 mt-4">
              {["Indica", "Sativa", "Hybrid"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </motion.div>
        </header>

        <div className="px-5 pb-8 space-y-3">
          {filteredStrains.map((strain, index) => (
            <motion.div
              key={strain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/strains/${strain.id}`}>
                <Card variant="interactive" className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground">
                        {strain.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          typeColors[strain.type as keyof typeof typeColors]
                        }`}
                      >
                        {strain.type}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      THC {strain.thc}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {strain.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {strain.effects.map((effect) => (
                      <span
                        key={effect}
                        className="px-2 py-1 rounded-md bg-secondary text-xs text-secondary-foreground"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
