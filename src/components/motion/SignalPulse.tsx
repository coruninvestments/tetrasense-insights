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

const GRADIENT =
  "radial-gradient(circle, hsl(var(--accent) / 0.35) 0%, hsl(var(--accent) / 0.15) 35%, hsl(var(--accent) / 0.05) 55%, transparent 70%)";

export function SignalPulse({ active = false, intensity = "low", children }: SignalPulseProps) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef);

  // After active pulses finish, return to idle
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    if (active) {
      setIsActive(true);
      // 2 pulses × 1.8s + small buffer
      const timer = setTimeout(() => setIsActive(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (prefersReduced) {
    return (
      <div ref={containerRef} className="relative">
        <div
          className="absolute inset-0 z-0 pointer-events-none rounded-full"
          style={{ background: GRADIENT, filter: "blur(22px)", opacity: 0.08 }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  const shouldAnimate = inView;

  // Idle: calm breathing
  const idleOpacity = intensity === "med" ? 0.14 : 0.12;
  const idleScale = intensity === "med" ? 1.06 : 1.05;

  // Active: slightly stronger
  const activeOpacity = intensity === "med" ? 0.20 : 0.18;
  const activeScale = intensity === "med" ? 1.10 : 1.08;

  return (
    <div ref={containerRef} className="relative">
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none rounded-full"
        style={{
          background: GRADIENT,
          filter: "blur(22px)",
          willChange: shouldAnimate ? "transform, opacity" : "auto",
        }}
        animate={
          !shouldAnimate
            ? { opacity: 0, scale: 1 }
            : isActive
              ? { opacity: [0, activeOpacity, 0], scale: [1, activeScale, 1] }
              : { opacity: [0, idleOpacity, 0], scale: [1, idleScale, 1] }
        }
        transition={
          !shouldAnimate
            ? { duration: 0 }
            : isActive
              ? { duration: 1.8, ease: "easeOut", repeat: 1, repeatDelay: 0.3 }
              : { duration: 4.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }
        }
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
