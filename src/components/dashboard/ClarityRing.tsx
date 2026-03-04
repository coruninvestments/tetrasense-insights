import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ClarityRingProps {
  score: number;
  prevScore?: number;
  size?: "sm" | "md";
}

/* ── helpers ─────────────────────────────────────────────────────── */

const SIZES = {
  sm: { px: 80, stroke: 6, fontSize: "text-xl", dotR: 1.6 },
  md: { px: 100, stroke: 7, fontSize: "text-2xl", dotR: 2 },
} as const;

const NODE_COUNT = 8;

function nodePositions(cx: number, cy: number, r: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

/* ── sparkle ─────────────────────────────────────────────────────── */

interface Sparkle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  delay: number;
}

let sparkleId = 0;

function makeSparkles(cx: number, cy: number, r: number): Sparkle[] {
  const count = 3 + Math.floor(Math.random() * 3); // 3–5
  return Array.from({ length: count }, () => {
    const angle = Math.random() * 2 * Math.PI;
    const dist = r * (0.55 + Math.random() * 0.35);
    return {
      id: sparkleId++,
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      dx: (Math.random() - 0.5) * 8,
      dy: (Math.random() - 0.5) * 8,
      delay: Math.random() * 0.15,
    };
  });
}

/* ── component ───────────────────────────────────────────────────── */

export function ClarityRing({ score, prevScore, size = "md" }: ClarityRingProps) {
  const prefersReduced = useReducedMotion();
  const cfg = SIZES[size];
  const half = cfg.px / 2;
  const radius = (cfg.px - cfg.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const hasData = score > 0;
  const direction = prevScore != null && prevScore !== score
    ? score > prevScore ? "up" : "down"
    : null;

  /* sparkles */
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const prevDir = useRef<string | null>(null);

  useEffect(() => {
    if (direction === "up" && prevDir.current !== "up" && !prefersReduced) {
      setSparkles(makeSparkles(half, half, radius));
      const t = setTimeout(() => setSparkles([]), 1200);
      prevDir.current = direction;
      return () => clearTimeout(t);
    }
    prevDir.current = direction;
  }, [direction, half, radius, prefersReduced]);

  /* signal nodes */
  const nodes = useMemo(() => nodePositions(half, half, radius + cfg.stroke / 2 + 3, NODE_COUNT), [half, radius, cfg.stroke]);

  /* node brightness based on direction */
  const nodeOpacity = direction === "up" ? 0.7 : direction === "down" ? 0.12 : 0.25;

  return (
    <div className="relative" style={{ width: cfg.px, height: cfg.px }}>
      {/* Sparkles layer */}
      {!prefersReduced && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
          <AnimatePresence>
            {sparkles.map((s) => (
              <motion.div
                key={s.id}
                className="absolute rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  left: s.x - 1.5,
                  top: s.y - 1.5,
                  background: "hsl(var(--accent))",
                  willChange: "transform, opacity",
                }}
                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.2, 0.6], x: s.dx, y: s.dy }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 + Math.random() * 0.2, ease: "easeOut", delay: s.delay }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* SVG ring + nodes + tick */}
      <svg
        width={cfg.px}
        height={cfg.px}
        className="-rotate-90 relative z-10"
        style={{ overflow: "visible" }}
      >
        {/* Background track */}
        <circle
          cx={half}
          cy={half}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={cfg.stroke}
        />

        {/* Progress arc */}
        {prefersReduced ? (
          <circle
            cx={half}
            cy={half}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        ) : (
          <motion.circle
            cx={half}
            cy={half}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
          />
        )}

        {/* Signal nodes */}
        {nodes.map((n, i) => (
          prefersReduced ? (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={cfg.dotR}
              fill="hsl(var(--primary))"
              opacity={0.25}
            />
          ) : (
            <motion.circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={cfg.dotR}
              fill="hsl(var(--primary))"
              initial={{ opacity: 0.25 }}
              animate={{ opacity: nodeOpacity }}
              transition={{ duration: 0.8, ease: "easeInOut", delay: i * 0.04 }}
            />
          )
        ))}
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        {prefersReduced ? (
          <span className={`${cfg.fontSize} font-serif font-medium text-foreground leading-none`}>
            {hasData ? `${score}%` : "—"}
          </span>
        ) : (
          <motion.span
            className={`${cfg.fontSize} font-serif font-medium text-foreground leading-none`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {hasData ? `${score}%` : "—"}
          </motion.span>
        )}
      </div>

      {/* Directional tick */}
      {!prefersReduced && direction && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {direction === "up" ? (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: -2 }}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: [0, 0.8, 0], y: [2, 0, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <ChevronUp className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            </motion.div>
          ) : (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: -2 }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.6, 0], y: [0, 2, 2] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
