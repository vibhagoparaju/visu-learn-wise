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

  // Eye blink for idle
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

  // Colors matching beige/coffee theme
  const bodyColor = "hsl(25, 35%, 60%)";
  const bodyDark = "hsl(25, 30%, 45%)";
  const bellyColor = "hsl(30, 30%, 85%)";
  const noseColor = "hsl(25, 20%, 25%)";
  const cheekColor = "hsl(15, 40%, 75%)";

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <motion.svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        animate={bodyBounce}
        transition={bodyTransition}
      >
        {/* Left ear */}
        <motion.ellipse
          cx="28" cy="22" rx="12" ry="18"
          fill={bodyDark}
          animate={earWag}
          transition={earTransition}
          style={{ transformOrigin: "28px 36px" }}
        />
        {/* Right ear */}
        <motion.ellipse
          cx="72" cy="22" rx="12" ry="18"
          fill={bodyDark}
          animate={earWag}
          transition={{ ...earTransition, delay: 0.1 }}
          style={{ transformOrigin: "72px 36px" }}
        />

        {/* Head */}
        <ellipse cx="50" cy="45" rx="30" ry="28" fill={bodyColor} />

        {/* Face patch */}
        <ellipse cx="50" cy="52" rx="20" ry="16" fill={bellyColor} />

        {/* Left eye */}
        <motion.ellipse
          cx="39" cy="40" rx="4" ry="4.5"
          fill={noseColor}
          animate={eyeScale}
          transition={eyeTransition}
          style={{ transformOrigin: "39px 40px" }}
        />
        {/* Right eye */}
        <motion.ellipse
          cx="61" cy="40" rx="4" ry="4.5"
          fill={noseColor}
          animate={eyeScale}
          transition={{ ...eyeTransition, delay: 0.05 }}
          style={{ transformOrigin: "61px 40px" }}
        />

        {/* Eye shine */}
        <circle cx="41" cy="38" r="1.5" fill="white" opacity="0.8" />
        <circle cx="63" cy="38" r="1.5" fill="white" opacity="0.8" />

        {/* Nose */}
        <ellipse cx="50" cy="49" rx="4" ry="3" fill={noseColor} />

        {/* Mouth */}
        {mood === "happy" ? (
          <path d="M44 54 Q50 60 56 54" stroke={noseColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : mood === "encouraging" ? (
          <>
            <path d="M44 55 Q50 58 56 55" stroke={noseColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : mood === "relaxing" ? (
          <path d="M46 55 Q50 57 54 55" stroke={noseColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M46 54 L54 54" stroke={noseColor} strokeWidth="1.2" strokeLinecap="round" />
        )}

        {/* Cheeks */}
        <circle cx="32" cy="50" r="4" fill={cheekColor} opacity="0.4" />
        <circle cx="68" cy="50" r="4" fill={cheekColor} opacity="0.4" />

        {/* Body */}
        <ellipse cx="50" cy="78" rx="22" ry="16" fill={bodyColor} />
        <ellipse cx="50" cy="82" rx="16" ry="10" fill={bellyColor} />

        {/* Paws */}
        <ellipse cx="35" cy="92" rx="7" ry="4" fill={bodyDark} />
        <ellipse cx="65" cy="92" rx="7" ry="4" fill={bodyDark} />

        {/* Tail */}
        <motion.path
          d="M74 75 Q85 65 82 55"
          stroke={bodyDark}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          animate={tailWag}
          transition={tailTransition}
          style={{ transformOrigin: "74px 75px" }}
        />

        {/* Thinking dots */}
        {mood === "thinking" && (
          <>
            <motion.circle
              cx="78" cy="28" r="2.5"
              fill="hsl(25, 20%, 70%)"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.circle
              cx="85" cy="20" r="3.5"
              fill="hsl(25, 20%, 70%)"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
            />
            <motion.circle
              cx="90" cy="12" r="2"
              fill="hsl(25, 20%, 70%)"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
            />
          </>
        )}

        {/* Zzz for relaxing */}
        {mood === "relaxing" && (
          <motion.text
            x="75" y="25"
            fontSize="10"
            fill="hsl(25, 20%, 60%)"
            fontWeight="bold"
            animate={{ opacity: [0, 1, 0], y: [25, 18] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            z
          </motion.text>
        )}

        {/* Sparkle for encouraging */}
        {mood === "encouraging" && (
          <motion.text
            x="76" y="30"
            fontSize="14"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transformOrigin: "80px 26px" }}
          >
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
