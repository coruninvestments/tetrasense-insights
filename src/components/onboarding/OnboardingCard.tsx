import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface OnboardingCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
  helper?: string;
}

export function OnboardingCard({ icon: Icon, title, body, helper }: OnboardingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm text-center space-y-6"
    >
      <div className="relative mx-auto w-20 h-20">
        <div className="absolute inset-0 rounded-3xl bg-primary/10 blur-xl" aria-hidden />
        <div className="relative w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-9 h-9 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl font-medium text-foreground leading-tight">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed px-2">
          {body}
        </p>
        {helper && (
          <p className="text-xs text-primary/80 italic pt-1">
            {helper}
          </p>
        )}
      </div>
    </motion.div>
  );
}
