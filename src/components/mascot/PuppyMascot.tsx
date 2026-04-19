import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import puppyImage from "@/assets/puppy-mascot.png";
import { useAnimations } from "@/hooks/useAnimations";

export type PuppyState =
  | "idle"
  | "thinking"
  | "correct"
  | "incorrect"
  | "studying"
  | "sleeping"
  | "celebrating";

// Legacy mood names — accepted via the `mood` prop for backwards compat.
export type PuppyMood = "happy" | "thinking" | "idle" | "encouraging" | "relaxing";

const moodToState = (m: PuppyMood): PuppyState => {
  switch (m) {
    case "happy": return "celebrating";
    case "thinking": return "thinking";
    case "encouraging": return "studying";
    case "relaxing": return "sleeping";
    default: return "idle";
  }
};

interface PuppyMascotProps {
  /** Rich state machine value. Takes priority over `mood`. */
  state?: PuppyState;
  /** Legacy mood — mapped to a state. */
  mood?: PuppyMood;
  size?: "sm" | "md" | "lg" | "small" | "medium" | "large";
  className?: string;
  /** Optional speech bubble. */
  message?: string;
  /** Show floating particles for correct/celebrating (default true). */
  showParticles?: boolean;
}

const sizeMap: Record<string, number> = {
  sm: 64, small: 64,
  md: 96, medium: 96,
  lg: 128, large: 128,
};

// Body animations per state
const getStateAnim = (s: PuppyState): { animate: any; transition: Transition } => {
  switch (s) {
    case "thinking":
      return {
        animate: { y: [0, -6, 0], rotate: [-3, 3, -3] },
        transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
      };
    case "correct":
      return {
        animate: { y: [0, -20, -4, 0], scale: [1, 1.1, 1.02, 1], rotate: [0, -4, 4, 0] },
        transition: { duration: 0.8, ease: "easeOut" },
      };
    case "incorrect":
      return {
        animate: { y: [0, 4, 0], scale: [1, 0.95, 1] },
        transition: { duration: 0.6, ease: "easeInOut" },
      };
    case "studying":
      return {
        animate: { y: [0, -3, 0], rotate: [-2, 2, -2] },
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
      };
    case "sleeping":
      return {
        animate: { y: [0, -1, 0], scale: [1, 1.03, 1] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      };
    case "celebrating":
      return {
        animate: { y: [0, -28, -14, -20, 0], scale: [1, 1.15, 1.05, 1.1, 1], rotate: [0, -6, 6, -3, 0] },
        transition: { duration: 1, ease: "easeOut" },
      };
    case "idle":
    default:
      return {
        animate: { y: [0, -2, 0], rotate: [-1, 1, -1] },
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      };
  }
};

// Eye blink
const Blink = ({ active }: { active: boolean }) => {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const next = 3000 + Math.random() * 3000; // 3–6s
      timer = setTimeout(() => {
        if (cancelled) return;
        setClosed(true);
        timer = setTimeout(() => {
          if (cancelled) return;
          setClosed(false);
          schedule();
        }, 80);
      }, next);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active]);

  // Eye lids positioned over the puppy's eye area (~37% from top, eyes at 37% and 63% from left)
  const lidStyle = "absolute rounded-full origin-center";
  return (
    <>
      <motion.span
        aria-hidden
        className={lidStyle}
        style={{
          left: "33%", top: "36%", width: "10%", height: "5%",
          background: "#4a3728",
          transformOrigin: "center",
        }}
        animate={{ scaleY: closed ? 1 : 0 }}
        transition={{ duration: 0.08, ease: "easeOut" }}
      />
      <motion.span
        aria-hidden
        className={lidStyle}
        style={{
          left: "57%", top: "36%", width: "10%", height: "5%",
          background: "#4a3728",
          transformOrigin: "center",
        }}
        animate={{ scaleY: closed ? 1 : 0 }}
        transition={{ duration: 0.08, ease: "easeOut" }}
      />
    </>
  );
};

// Tail wag — small curled shape behind the puppy at bottom right.
const Tail = ({ wag }: { wag: boolean }) => (
  <motion.span
    aria-hidden
    className="absolute rounded-full"
    style={{
      right: "8%",
      bottom: "20%",
      width: "12%",
      height: "12%",
      background: "#c8a882",
      border: "2px solid #a0785a",
      transformOrigin: "0% 100%",
      zIndex: -1,
    }}
    animate={wag ? { rotate: [-15, 15, -15] } : { rotate: 0 }}
    transition={wag ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
  />
);

// Floating particles (hearts / stars / sparkles) used for correct + celebrating.
const PARTICLE_EMOJIS = ["💛", "⭐", "✨"];

const FloatingParticles = ({ trigger, enabled }: { trigger: number; enabled: boolean }) => {
  const [bursts, setBursts] = useState<Array<{ id: number; emoji: string; x: number; delay: number }>>([]);

  useEffect(() => {
    if (!enabled || trigger === 0) return;
    const id = Date.now();
    const next = PARTICLE_EMOJIS.map((emoji, i) => ({
      id: id + i,
      emoji,
      x: -20 + i * 20,
      delay: i * 0.15,
    }));
    setBursts(next);
    const t = setTimeout(() => setBursts([]), 1400);
    return () => clearTimeout(t);
  }, [trigger, enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            className="absolute text-xl select-none"
            style={{ left: `calc(50% + ${b.x}px)`, top: 0 }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -50 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: b.delay, ease: "easeOut" }}
          >
            {b.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Sleep ZZZ — drifts up + fades.
const SleepZ = () => (
  <motion.span
    aria-hidden
    className="absolute text-base select-none pointer-events-none"
    style={{ left: "60%", top: "5%", color: "#a0785a" }}
    animate={{ opacity: [0, 1, 0], y: [0, -20] }}
    transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5, ease: "easeOut" }}
  >
    💤
  </motion.span>
);

// Detect low-power device once at module load
const isLowPower = (() => {
  if (typeof window === "undefined") return false;
  const cores = (navigator as any).hardwareConcurrency || 8;
  const narrow = window.innerWidth < 400;
  return cores <= 4 || narrow;
})();

const PuppyMascotInner = ({
  state: stateProp,
  mood,
  size = "md",
  className = "",
  message,
  showParticles = true,
}: PuppyMascotProps) => {
  const { shouldAnimate } = useAnimations();
  const state: PuppyState = stateProp ?? (mood ? moodToState(mood) : "idle");
  const s = sizeMap[size] ?? sizeMap.md;

  // Trigger counter for one-shot particle bursts
  const particleTrigger = useRef(0);
  const lastParticleState = useRef<PuppyState>("idle");
  if ((state === "correct" || state === "celebrating") && lastParticleState.current !== state) {
    particleTrigger.current += 1;
  }
  lastParticleState.current = state;

  const wagTail = state === "idle" || state === "studying" || state === "correct" || state === "celebrating";
  const headTilt = state === "thinking";
  const showSleepZ = state === "sleeping";
  const allowParticles = showParticles && shouldAnimate && !isLowPower;

  // Static fallback when animations disabled
  if (!shouldAnimate) {
    return (
      <div className={`relative inline-block ${className}`} style={{ width: s, height: s, zIndex: 10 }}>
        <img
          src={puppyImage}
          alt="VISU study buddy"
          width={s}
          height={s}
          loading="lazy"
          decoding="async"
          className="drop-shadow-md select-none"
          draggable={false}
        />
        {message && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium shadow-card max-w-[180px] text-center whitespace-nowrap">
            {message}
          </div>
        )}
      </div>
    );
  }

  const { animate, transition } = getStateAnim(state);

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: s, height: s, zIndex: 10 }}
    >
      <motion.div
        className="relative"
        style={{ width: s, height: s }}
        animate={animate}
        transition={transition}
        // Re-mount transient anims when state changes so one-shot plays again
        key={state === "correct" || state === "incorrect" || state === "celebrating" ? `${state}-${particleTrigger.current}` : state}
      >
        {/* Head-tilt overlay (top half) for thinking state */}
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{ height: "50%", transformOrigin: "50% 100%" }}
          animate={{ rotate: headTilt ? -8 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Empty — the rotation is purely visual via the body image stacking. */}
        </motion.div>

        <Tail wag={wagTail} />

        <img
          src={puppyImage}
          alt="VISU study buddy"
          width={s}
          height={s}
          loading="lazy"
          decoding="async"
          className="drop-shadow-md select-none relative"
          draggable={false}
          style={{ zIndex: 1 }}
        />

        <Blink active={state !== "sleeping"} />

        {showSleepZ && <SleepZ />}

        <FloatingParticles
          trigger={particleTrigger.current}
          enabled={allowParticles && (state === "correct" || state === "celebrating")}
        />
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            className="absolute left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium shadow-card max-w-[180px] text-center whitespace-nowrap"
            style={{ top: `calc(100% + 6px)` }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PuppyMascot = memo(PuppyMascotInner);
export default PuppyMascot;
