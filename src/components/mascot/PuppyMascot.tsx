import { motion, AnimatePresence } from "framer-motion";

export type PuppyMood = "happy" | "thinking" | "idle" | "encouraging" | "relaxing";

interface PuppyMascotProps {
  mood?: PuppyMood;
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

const sizeMap = { sm: 56, md: 80, lg: 110 };

const PuppyMascot = ({ mood = "idle", size = "md", className = "", message }: PuppyMascotProps) => {
  const s = sizeMap[size];

  const earWag = mood === "happy" ? { rotate: [0, -6, 0, 6, 0] } : {};
  const earTransition = mood === "happy" ? { duration: 0.7, repeat: Infinity, repeatDelay: 0.8 } : {};

  const tailWag = mood === "happy"
    ? { rotate: [-20, 20, -20] }
    : mood === "encouraging"
    ? { rotate: [-10, 10, -10] }
    : {};
  const tailTransition = (mood === "happy" || mood === "encouraging")
    ? { duration: 0.35, repeat: Infinity }
    : {};

  const bodyBounce = mood === "happy"
    ? { y: [0, -4, 0] }
    : mood === "thinking"
    ? { y: [0, -2, 0] }
    : mood === "relaxing"
    ? { rotate: [0, 1.5, 0, -1.5, 0] }
    : {};
  const bodyTransition = mood === "happy"
    ? { duration: 0.7, repeat: Infinity }
    : mood === "thinking"
    ? { duration: 1.5, repeat: Infinity }
    : mood === "relaxing"
    ? { duration: 3, repeat: Infinity }
    : {};

  // Idle floating
  const idleFloat = mood === "idle" ? { y: [0, -3, 0] } : {};
  const idleTransition = mood === "idle" ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : {};

  const eyeScale = mood === "idle"
    ? { scaleY: [1, 1, 0.08, 1, 1] }
    : mood === "relaxing"
    ? { scaleY: [0.6, 0.2, 0.6] }
    : mood === "happy"
    ? { scaleY: [1, 1, 0.15, 1, 1] }
    : {};
  const eyeTransition = mood === "idle"
    ? { duration: 3.5, repeat: Infinity, repeatDelay: 2.5 }
    : mood === "relaxing"
    ? { duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }
    : mood === "happy"
    ? { duration: 2, repeat: Infinity, repeatDelay: 3 }
    : {};

  // Cream/warm white palette matching the anime puppy
  const furCream = "hsl(38, 45%, 92%)";
  const furLight = "hsl(35, 40%, 88%)";
  const furMid = "hsl(30, 30%, 82%)";
  const furShadow = "hsl(28, 22%, 75%)";
  const earTan = "hsl(25, 35%, 72%)";
  const noseColor = "hsl(15, 25%, 32%)";
  const eyeBrown = "hsl(20, 40%, 22%)";
  const eyeIris = "hsl(20, 50%, 30%)";
  const cheekPink = "hsl(10, 45%, 82%)";
  const tongueColor = "hsl(5, 60%, 68%)";
  const tongueDark = "hsl(5, 50%, 55%)";
  const mouthDark = "hsl(15, 30%, 25%)";

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <motion.div
        animate={{ ...idleFloat, ...bodyBounce }}
        transition={mood === "idle" ? idleTransition : bodyTransition}
      >
        <svg width={s} height={s} viewBox="0 0 120 120">
          <defs>
            <radialGradient id="pup-head" cx="50%" cy="38%" r="55%">
              <stop offset="0%" stopColor={furCream} />
              <stop offset="60%" stopColor={furLight} />
              <stop offset="100%" stopColor={furMid} />
            </radialGradient>
            <radialGradient id="pup-body" cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor={furCream} />
              <stop offset="70%" stopColor={furLight} />
              <stop offset="100%" stopColor={furShadow} />
            </radialGradient>
          </defs>

          {/* ---- BODY ---- */}
          <ellipse cx="60" cy="90" rx="28" ry="22" fill="url(#pup-body)" />
          {/* Chest fluff - messy tufts */}
          <ellipse cx="60" cy="74" rx="18" ry="10" fill={furCream} />
          <circle cx="52" cy="72" r="5" fill={furCream} />
          <circle cx="68" cy="72" r="5" fill={furCream} />
          <circle cx="60" cy="70" r="4" fill={furCream} />

          {/* Belly lighter */}
          <ellipse cx="60" cy="92" rx="16" ry="12" fill={furCream} opacity="0.6" />

          {/* ---- PAWS ---- */}
          <ellipse cx="42" cy="108" rx="10" ry="5.5" fill={furLight} />
          <ellipse cx="78" cy="108" rx="10" ry="5.5" fill={furLight} />
          {/* Paw toe lines */}
          <line x1="38" y1="108" x2="38" y2="105" stroke={furShadow} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="42" y1="109" x2="42" y2="106" stroke={furShadow} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="46" y1="108" x2="46" y2="105" stroke={furShadow} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="74" y1="108" x2="74" y2="105" stroke={furShadow} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="78" y1="109" x2="78" y2="106" stroke={furShadow} strokeWidth="0.8" strokeLinecap="round" />
          <line x1="82" y1="108" x2="82" y2="105" stroke={furShadow} strokeWidth="0.8" strokeLinecap="round" />

          {/* ---- TAIL (fluffy pom) ---- */}
          <motion.g
            animate={tailWag}
            transition={tailTransition}
            style={{ transformOrigin: "88px 85px" }}
          >
            <circle cx="95" cy="78" r="7" fill={furLight} />
            <circle cx="99" cy="73" r="5" fill={furCream} />
            <circle cx="93" cy="82" r="5.5" fill={furCream} />
            <circle cx="98" cy="80" r="4" fill={furCream} />
          </motion.g>

          {/* ---- LEFT EAR (floppy) ---- */}
          <motion.g
            animate={earWag}
            transition={earTransition}
            style={{ transformOrigin: "34px 38px" }}
          >
            {/* Ear outline - floppy shape */}
            <path d="M34 38 Q20 28 16 42 Q12 56 24 55 Q30 54 34 48" fill={furMid} />
            <path d="M33 40 Q22 32 19 43 Q16 53 25 52 Q30 51 33 46" fill={earTan} opacity="0.6" />
            {/* Fur tufts at ear base */}
            <circle cx="30" cy="36" r="3" fill={furCream} />
            <circle cx="27" cy="34" r="2.5" fill={furCream} />
          </motion.g>

          {/* ---- RIGHT EAR (floppy) ---- */}
          <motion.g
            animate={earWag}
            transition={{ ...earTransition, delay: 0.12 }}
            style={{ transformOrigin: "86px 38px" }}
          >
            <path d="M86 38 Q100 28 104 42 Q108 56 96 55 Q90 54 86 48" fill={furMid} />
            <path d="M87 40 Q98 32 101 43 Q104 53 95 52 Q90 51 87 46" fill={earTan} opacity="0.6" />
            <circle cx="90" cy="36" r="3" fill={furCream} />
            <circle cx="93" cy="34" r="2.5" fill={furCream} />
          </motion.g>

          {/* ---- HEAD ---- */}
          <ellipse cx="60" cy="45" rx="32" ry="28" fill="url(#pup-head)" />

          {/* Messy fur tufts around head - spiky silhouette like the reference */}
          <circle cx="60" cy="17" r="5" fill={furCream} />
          <circle cx="50" cy="18" r="4.5" fill={furCream} />
          <circle cx="70" cy="18" r="4.5" fill={furCream} />
          <circle cx="42" cy="21" r="4" fill={furCream} />
          <circle cx="78" cy="21" r="4" fill={furCream} />
          <circle cx="35" cy="27" r="3.5" fill={furCream} />
          <circle cx="85" cy="27" r="3.5" fill={furCream} />
          <circle cx="30" cy="35" r="3" fill={furLight} />
          <circle cx="90" cy="35" r="3" fill={furLight} />
          {/* Top messy spikes */}
          <circle cx="55" cy="16" r="3" fill={furCream} />
          <circle cx="65" cy="15" r="3.5" fill={furCream} />
          <circle cx="46" cy="17" r="2.5" fill={furLight} />
          <circle cx="74" cy="17" r="2.5" fill={furLight} />
          {/* Side fluff */}
          <circle cx="28" cy="42" r="4" fill={furCream} />
          <circle cx="92" cy="42" r="4" fill={furCream} />
          <circle cx="29" cy="50" r="3.5" fill={furLight} />
          <circle cx="91" cy="50" r="3.5" fill={furLight} />

          {/* Face - lighter muzzle area */}
          <ellipse cx="60" cy="53" rx="18" ry="13" fill={furCream} />

          {/* ---- EYES (big, round, warm brown) ---- */}
          <motion.g
            animate={eyeScale}
            transition={eyeTransition}
            style={{ transformOrigin: "45px 42px" }}
          >
            {/* Left eye */}
            <circle cx="45" cy="42" r="7" fill={eyeBrown} />
            <circle cx="45" cy="41.5" r="5.5" fill={eyeIris} />
            {/* Big highlight */}
            <circle cx="47.5" cy="39.5" r="2.5" fill="white" opacity="0.9" />
            {/* Small highlight */}
            <circle cx="43" cy="44" r="1.2" fill="white" opacity="0.5" />
          </motion.g>

          <motion.g
            animate={eyeScale}
            transition={{ ...eyeTransition, delay: 0.05 }}
            style={{ transformOrigin: "75px 42px" }}
          >
            {/* Right eye */}
            <circle cx="75" cy="42" r="7" fill={eyeBrown} />
            <circle cx="75" cy="41.5" r="5.5" fill={eyeIris} />
            <circle cx="77.5" cy="39.5" r="2.5" fill="white" opacity="0.9" />
            <circle cx="73" cy="44" r="1.2" fill="white" opacity="0.5" />
          </motion.g>

          {/* ---- NOSE (dark, rounded) ---- */}
          <ellipse cx="60" cy="52" rx="4.5" ry="3.5" fill={noseColor} />
          <ellipse cx="58.5" cy="51" rx="1.5" ry="1" fill="hsl(15, 20%, 45%)" opacity="0.5" />

          {/* ---- MOUTH ---- */}
          {mood === "happy" || mood === "idle" ? (
            <>
              {/* Wide open happy mouth like the reference */}
              <path d="M48 56 Q54 54 60 56 Q66 54 72 56" stroke={mouthDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M48 56 Q60 70 72 56" fill={mouthDark} />
              {/* Tongue */}
              <ellipse cx="60" cy="64" rx="6" ry="7" fill={tongueColor} />
              <ellipse cx="60" cy="62" rx="4" ry="4" fill="hsl(5, 65%, 75%)" />
              {/* Tongue center line */}
              <line x1="60" y1="58" x2="60" y2="68" stroke={tongueDark} strokeWidth="0.8" opacity="0.3" />
            </>
          ) : mood === "encouraging" ? (
            <>
              <path d="M50 56 Q60 62 70 56" stroke={mouthDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M50 56 Q60 63 70 56" fill={mouthDark} opacity="0.6" />
              <ellipse cx="60" cy="60" rx="4" ry="3.5" fill={tongueColor} />
            </>
          ) : mood === "relaxing" ? (
            <path d="M54 56 Q60 59 66 56" stroke={mouthDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <path d="M52 55 Q60 60 68 55" stroke={mouthDark} strokeWidth="1.3" fill="none" strokeLinecap="round" />
              <path d="M52 55 Q60 61 68 55" fill={mouthDark} opacity="0.5" />
              <ellipse cx="60" cy="58.5" rx="3.5" ry="3" fill={tongueColor} />
            </>
          )}

          {/* Rosy cheeks */}
          <circle cx="36" cy="52" r="5" fill={cheekPink} opacity="0.3" />
          <circle cx="84" cy="52" r="5" fill={cheekPink} opacity="0.3" />

          {/* ---- MOOD INDICATORS ---- */}
          {mood === "thinking" && (
            <>
              <motion.circle cx="95" cy="25" r="3" fill="hsl(30, 20%, 80%)"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
              <motion.circle cx="102" cy="16" r="4" fill="hsl(30, 20%, 80%)"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.3 }} />
              <motion.circle cx="107" cy="8" r="2.5" fill="hsl(30, 20%, 80%)"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.6 }} />
            </>
          )}

          {mood === "relaxing" && (
            <>
              <motion.text x="88" y="28" fontSize="11" fill="hsl(25, 15%, 65%)" fontWeight="bold"
                animate={{ opacity: [0, 1, 0], y: [28, 20] }} transition={{ duration: 2.5, repeat: Infinity }}>z</motion.text>
              <motion.text x="96" y="20" fontSize="8" fill="hsl(25, 15%, 70%)" fontWeight="bold"
                animate={{ opacity: [0, 1, 0], y: [20, 14] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}>z</motion.text>
            </>
          )}

          {mood === "encouraging" && (
            <motion.text x="90" y="28" fontSize="16"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ transformOrigin: "96px 22px" }}>✨</motion.text>
          )}
        </svg>
      </motion.div>

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
