import { motion } from "framer-motion";
import { Leaf, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title = "Nothing here yet",
  description = "No sessions logged yet. Start your first session to unlock insights about your experience.",
  actionLabel = "Log your first session",
  actionTo = "/log",
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"
      >
        {icon ?? <Leaf className="w-6 h-6 text-muted-foreground" />}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="font-serif text-base font-medium text-foreground mb-1.5"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-sm text-muted-foreground max-w-[260px] leading-relaxed mb-5"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {onAction ? (
          <Button variant="soft" size="sm" onClick={onAction}>
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        ) : actionTo ? (
          <Link to={actionTo}>
            <Button variant="soft" size="sm">
              <Plus className="w-4 h-4" />
              {actionLabel}
            </Button>
          </Link>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
