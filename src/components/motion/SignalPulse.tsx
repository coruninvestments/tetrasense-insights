import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function useInView(ref: React.RefObject<Element | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

interface SignalPulseProps {
  active?: boolean;
  intensity?: "low" | "med";
  children: React.ReactNode;
}

export function SignalPulse({ active = false, intensity = "low", children }: SignalPulseProps) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  if (prefersReduced) {
    return <div ref={containerRef} className="relative">{children}</div>;
  }

  const shouldAnimate = inView;
  const idleOpacity = intensity === "med" ? 0.12 : 0.08;
  const idleScale = intensity === "med" ? 1.08 : 1.06;
  const activeOpacity = intensity === "med" ? 0.22 : 0.18;
  const activeScale = intensity === "med" ? 1.14 : 1.10;

  return (
    <div ref={containerRef} className="relative">
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.35) 0%, transparent 70%)",
          filter: "blur(24px)",
          willChange: shouldAnimate ? "transform, opacity" : "auto",
        }}
        animate={
          !shouldAnimate
            ? { opacity: 0, scale: 1 }
            : active
              ? { opacity: [0, activeOpacity, 0], scale: [1, activeScale, 1] }
              : { opacity: [0, idleOpacity, 0], scale: [1, idleScale, 1] }
        }
        transition={
          !shouldAnimate
            ? { duration: 0 }
            : active
              ? { duration: 0.9, ease: "easeInOut", repeat: 1, repeatDelay: 0.2 }
              : { duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 6 }
        }
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
