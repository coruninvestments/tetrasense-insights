import { Home, BookOpen, FlaskConical, User, Plus, Compass, Leaf } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Leaf, label: "Library", path: "/library" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.slice(0, 2).map((item) => (
          <NavItem
            key={item.path}
            {...item}
            isActive={location.pathname === item.path}
          />
        ))}

        {/* Center Log Button */}
        <Link
          to="/log"
          className="relative -mt-6 flex flex-col items-center"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="gradient-primary w-14 h-14 rounded-full flex items-center justify-center shadow-glow"
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">
            Log
          </span>
        </Link>

        {navItems.slice(2).map((item) => (
          <NavItem
            key={item.path}
            {...item}
            isActive={location.pathname === item.path}
          />
        ))}
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
      <motion.div
        whileTap={{ scale: 0.9 }}
        className="relative"
      >
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
