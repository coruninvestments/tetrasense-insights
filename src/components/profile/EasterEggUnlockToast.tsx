import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getEggDef, type EasterEggKey } from "@/lib/easterEggs";

interface Props {
  eggKey: EasterEggKey | null;
  onClose: () => void;
}

export function EasterEggUnlockToast({ eggKey, onClose }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (eggKey) {
      timerRef.current = setTimeout(onClose, 6000);
      return () => clearTimeout(timerRef.current);
    }
  }, [eggKey, onClose]);

  const egg = eggKey ? getEggDef(eggKey) : null;

  return (
    <AnimatePresence>
      {egg && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          onClick={onClose}
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl px-6 py-5 min-w-[280px] max-w-[340px] cursor-pointer">
            {/* Stardust accent */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 right-6 w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
              <div className="absolute top-5 right-12 w-0.5 h-0.5 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="absolute bottom-3 left-8 w-0.5 h-0.5 rounded-full bg-primary/25 animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="flex items-center gap-4">
              {/* Glyph */}
              <motion.div
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"
              >
                <span className="text-xl text-primary font-light">{egg.glyph}</span>
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] uppercase tracking-widest text-primary/70 mb-0.5"
                >
                  Hidden Unlock
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm font-serif font-medium text-foreground leading-tight"
                >
                  {egg.title}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-muted-foreground mt-0.5 leading-snug"
                >
                  {egg.subtitle}
                </motion.p>
              </div>
            </div>

            {/* Halo gradient behind */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
