import { Home, User, Plus, Leaf, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const leftItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Leaf, label: "Library", path: "/library" },
];

const rightItems = [
  { icon: BarChart3, label: "Insights", path: "/insights" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="relative max-w-lg mx-auto px-2 py-2">
        <div className="flex items-end">
          {/* Left group */}
          <div className="flex-1 flex justify-around">
            {leftItems.map((item) => (
              <NavItem key={item.path} {...item} isActive={location.pathname === item.path} />
            ))}
          </div>

          {/* Center spacer for the FAB */}
          <div className="w-16 shrink-0" />

          {/* Right group */}
          <div className="flex-1 flex justify-around">
            {rightItems.map((item) => (
              <NavItem key={item.path} {...item} isActive={location.pathname === item.path} />
            ))}
          </div>
        </div>

        {/* Center Log FAB — absolutely centered */}
        <Link
          to="/log"
          className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="gradient-primary w-14 h-14 rounded-full flex items-center justify-center shadow-glow"
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">Log</span>
        </Link>
      </div>
    </nav>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
}

function NavItem({ icon: Icon, label, path, isActive }: NavItemProps) {
  return (
    <Link
      to={path}
      className={cn(
        "flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <motion.div whileTap={{ scale: 0.9 }} className="relative">
        <Icon className="w-5 h-5" />
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
          />
        )}
      </motion.div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
