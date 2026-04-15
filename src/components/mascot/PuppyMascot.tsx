import { motion, AnimatePresence } from "framer-motion";

export type PuppyMood = "happy" | "thinking" | "idle" | "encouraging" | "relaxing";

interface PuppyMascotProps {
  mood?: PuppyMood;
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

const sizeMap = { sm: 48, md: 72, lg: 96 };

const PuppyMascot = ({ mood = "idle", size = "md", className = "", message }: PuppyMascotProps) => {
  const s = sizeMap[size];

  const earWag = mood === "happy" ? { rotate: [0, -8, 0, 8, 0] } : {};
  const earTransition = mood === "happy" ? { duration: 0.6, repeat: Infinity, repeatDelay: 1 } : {};

  const tailWag = mood === "happy"
    ? { rotate: [-15, 15, -15] }
    : mood === "encouraging"
    ? { rotate: [-8, 8, -8] }
    : {};
  const tailTransition = (mood === "happy" || mood === "encouraging")
    ? { duration: 0.4, repeat: Infinity }
    : {};

  const bodyBounce = mood === "happy"
    ? { y: [0, -3, 0] }
    : mood === "thinking"
    ? { y: [0, -1, 0] }
    : mood === "relaxing"
    ? { rotate: [0, 2, 0, -2, 0] }
    : {};
  const bodyTransition = mood === "happy"
    ? { duration: 0.8, repeat: Infinity }
    : mood === "thinking"
    ? { duration: 1.5, repeat: Infinity }
    : mood === "relaxing"
    ? { duration: 3, repeat: Infinity }
    : {};

  const eyeScale = mood === "idle"
    ? { scaleY: [1, 1, 0.1, 1, 1] }
    : mood === "relaxing"
    ? { scaleY: [1, 0.3, 1] }
    : {};
  const eyeTransition = mood === "idle"
    ? { duration: 3, repeat: Infinity, repeatDelay: 2 }
    : mood === "relaxing"
    ? { duration: 2, repeat: Infinity, repeatDelay: 1 }
    : {};

  // White fluffy puppy palette
  const furWhite = "hsl(30, 20%, 97%)";
  const furLight = "hsl(30, 15%, 92%)";
  const furShadow = "hsl(25, 12%, 85%)";
  const earInner = "hsl(15, 35%, 85%)";
  const noseColor = "hsl(350, 20%, 30%)";
  const cheekColor = "hsl(5, 50%, 85%)";
  const eyeColor = "hsl(25, 30%, 18%)";
  const tongueColor = "hsl(350, 55%, 70%)";

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <motion.svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        animate={bodyBounce}
        transition={bodyTransition}
      >
        {/* Fur texture filter */}
        <defs>
          <filter id="fur-soft">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" />
          </filter>
          <radialGradient id="body-grad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor={furWhite} />
            <stop offset="70%" stopColor={furLight} />
            <stop offset="100%" stopColor={furShadow} />
          </radialGradient>
          <radialGradient id="head-grad" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor={furWhite} />
            <stop offset="80%" stopColor={furLight} />
            <stop offset="100%" stopColor={furShadow} />
          </radialGradient>
        </defs>

        {/* Left ear - floppy and fluffy */}
        <motion.g
          animate={earWag}
          transition={earTransition}
          style={{ transformOrigin: "30px 32px" }}
        >
          <ellipse cx="26" cy="20" rx="13" ry="20" fill={furLight} />
          <ellipse cx="26" cy="22" rx="9" ry="14" fill={earInner} opacity="0.5" />
          {/* Fur tufts on ear */}
          <circle cx="20" cy="12" r="3" fill={furWhite} />
          <circle cx="32" cy="10" r="2.5" fill={furWhite} />
          <circle cx="24" cy="8" r="2" fill={furWhite} />
        </motion.g>

        {/* Right ear */}
        <motion.g
          animate={earWag}
          transition={{ ...earTransition, delay: 0.1 }}
          style={{ transformOrigin: "70px 32px" }}
        >
          <ellipse cx="74" cy="20" rx="13" ry="20" fill={furLight} />
          <ellipse cx="74" cy="22" rx="9" ry="14" fill={earInner} opacity="0.5" />
          <circle cx="80" cy="12" r="3" fill={furWhite} />
          <circle cx="68" cy="10" r="2.5" fill={furWhite} />
          <circle cx="76" cy="8" r="2" fill={furWhite} />
        </motion.g>

        {/* Head - round and fluffy */}
        <ellipse cx="50" cy="44" rx="30" ry="28" fill="url(#head-grad)" />
        
        {/* Fluffy fur tufts around head */}
        <circle cx="22" cy="38" r="4" fill={furWhite} />
        <circle cx="78" cy="38" r="4" fill={furWhite} />
        <circle cx="50" cy="17" r="5" fill={furWhite} />
        <circle cx="40" cy="18" r="3.5" fill={furWhite} />
        <circle cx="60" cy="18" r="3.5" fill={furWhite} />
        <circle cx="32" cy="22" r="3" fill={furWhite} />
        <circle cx="68" cy="22" r="3" fill={furWhite} />

        {/* Face patch - lighter belly area */}
        <ellipse cx="50" cy="52" rx="18" ry="14" fill={furWhite} />

        {/* Left eye - big and cute */}
        <motion.g
          animate={eyeScale}
          transition={eyeTransition}
          style={{ transformOrigin: "40px 40px" }}
        >
          <ellipse cx="40" cy="40" rx="5.5" ry="6" fill={eyeColor} />
          <ellipse cx="40" cy="39" rx="4" ry="4.5" fill="hsl(25, 25%, 22%)" />
          {/* Big sparkle */}
          <circle cx="42.5" cy="37.5" r="2.2" fill="white" opacity="0.9" />
          <circle cx="38" cy="41" r="1" fill="white" opacity="0.5" />
        </motion.g>

        {/* Right eye */}
        <motion.g
          animate={eyeScale}
          transition={{ ...eyeTransition, delay: 0.05 }}
          style={{ transformOrigin: "60px 40px" }}
        >
          <ellipse cx="60" cy="40" rx="5.5" ry="6" fill={eyeColor} />
          <ellipse cx="60" cy="39" rx="4" ry="4.5" fill="hsl(25, 25%, 22%)" />
          <circle cx="62.5" cy="37.5" r="2.2" fill="white" opacity="0.9" />
          <circle cx="58" cy="41" r="1" fill="white" opacity="0.5" />
        </motion.g>

        {/* Tiny eyebrows */}
        <path d="M35 33 Q38 31 43 33" stroke={furShadow} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M57 33 Q62 31 65 33" stroke={furShadow} strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Nose - small round button */}
        <ellipse cx="50" cy="49" rx="3.5" ry="2.8" fill={noseColor} />
        <ellipse cx="49" cy="48" rx="1.2" ry="0.8" fill="hsl(350, 15%, 45%)" opacity="0.6" />

        {/* Mouth */}
        {mood === "happy" ? (
          <>
            <path d="M44 53 Q50 60 56 53" stroke={noseColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Tongue sticking out */}
            <ellipse cx="50" cy="58" rx="3.5" ry="4" fill={tongueColor} />
            <ellipse cx="50" cy="57" rx="2.5" ry="2.5" fill="hsl(350, 60%, 78%)" />
          </>
        ) : mood === "encouraging" ? (
          <path d="M44 54 Q50 58 56 54" stroke={noseColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : mood === "relaxing" ? (
          <path d="M46 54 Q50 56 54 54" stroke={noseColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <path d="M47 52 L50 54 L53 52" stroke={noseColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Rosy cheeks */}
        <circle cx="32" cy="49" r="4.5" fill={cheekColor} opacity="0.35" />
        <circle cx="68" cy="49" r="4.5" fill={cheekColor} opacity="0.35" />

        {/* Body - round and fluffy */}
        <ellipse cx="50" cy="78" rx="23" ry="17" fill="url(#body-grad)" />
        
        {/* Fluffy chest tuft */}
        <circle cx="50" cy="66" r="6" fill={furWhite} />
        <circle cx="44" cy="68" r="4" fill={furWhite} />
        <circle cx="56" cy="68" r="4" fill={furWhite} />

        {/* Belly */}
        <ellipse cx="50" cy="80" rx="14" ry="9" fill={furWhite} opacity="0.7" />

        {/* Paws - cute round */}
        <ellipse cx="34" cy="92" rx="8" ry="5" fill={furLight} />
        <ellipse cx="66" cy="92" rx="8" ry="5" fill={furLight} />
        {/* Paw pads */}
        <circle cx="31" cy="93" r="1.5" fill={earInner} opacity="0.4" />
        <circle cx="34" cy="94" r="1.5" fill={earInner} opacity="0.4" />
        <circle cx="37" cy="93" r="1.5" fill={earInner} opacity="0.4" />
        <circle cx="63" cy="93" r="1.5" fill={earInner} opacity="0.4" />
        <circle cx="66" cy="94" r="1.5" fill={earInner} opacity="0.4" />
        <circle cx="69" cy="93" r="1.5" fill={earInner} opacity="0.4" />

        {/* Fluffy tail */}
        <motion.g
          animate={tailWag}
          transition={tailTransition}
          style={{ transformOrigin: "74px 75px" }}
        >
          <circle cx="82" cy="65" r="6" fill={furLight} />
          <circle cx="85" cy="60" r="4" fill={furWhite} />
          <circle cx="80" cy="70" r="5" fill={furWhite} />
        </motion.g>

        {/* Thinking dots */}
        {mood === "thinking" && (
          <>
            <motion.circle cx="80" cy="26" r="2.5" fill="hsl(25, 15%, 80%)"
              animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
            <motion.circle cx="86" cy="18" r="3.5" fill="hsl(25, 15%, 80%)"
              animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
            <motion.circle cx="90" cy="10" r="2" fill="hsl(25, 15%, 80%)"
              animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
          </>
        )}

        {/* Zzz for relaxing */}
        {mood === "relaxing" && (
          <motion.text x="75" y="25" fontSize="10" fill="hsl(25, 15%, 70%)" fontWeight="bold"
            animate={{ opacity: [0, 1, 0], y: [25, 18] }} transition={{ duration: 2, repeat: Infinity }}>
            z
          </motion.text>
        )}

        {/* Sparkle for encouraging */}
        {mood === "encouraging" && (
          <motion.text x="76" y="30" fontSize="14"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transformOrigin: "80px 26px" }}>
            ✨
          </motion.text>
        )}
      </motion.svg>

      {/* Speech bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium shadow-card max-w-[180px] text-center"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PuppyMascot;
