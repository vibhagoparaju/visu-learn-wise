import { motion, AnimatePresence } from "framer-motion";
import puppyImage from "@/assets/puppy-mascot.png";

export type PuppyMood = "happy" | "thinking" | "idle" | "encouraging" | "relaxing";

interface PuppyMascotProps {
  mood?: PuppyMood;
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

const sizeMap = { sm: 56, md: 80, lg: 110 };

const getMoodAnimation = (mood: PuppyMood) => {
  switch (mood) {
    case "happy": return { y: [0, -6, 0], rotate: [0, -3, 0, 3, 0] };
    case "thinking": return { y: [0, -2, 0], scale: [1, 1.02, 1] };
    case "encouraging": return { y: [0, -3, 0], scale: [1, 1.05, 1] };
    case "relaxing": return { rotate: [0, 2, 0, -2, 0] };
    default: return { y: [0, -4, 0] };
  }
};

const getMoodTransition = (mood: PuppyMood) => {
  switch (mood) {
    case "happy": return { duration: 0.6, repeat: Infinity };
    case "thinking": return { duration: 1.8, repeat: Infinity, ease: "easeInOut" as const };
    case "encouraging": return { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const };
    case "relaxing": return { duration: 3, repeat: Infinity, ease: "easeInOut" as const };
    default: return { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const };
  }
};

const PuppyMascot = ({ mood = "idle", size = "md", className = "", message }: PuppyMascotProps) => {
  const s = sizeMap[size];

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <motion.div
        animate={getMoodAnimation(mood)}
        transition={getMoodTransition(mood)}
        className="relative"
      >
        <img
          src={puppyImage}
          alt="VISU study buddy"
          width={s}
          height={s}
          className="drop-shadow-md"
          draggable={false}
        />

        {/* Mood indicators */}
        {mood === "thinking" && (
          <div className="absolute -top-2 -right-2 flex flex-col items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block rounded-full bg-muted-foreground/30"
                style={{ width: 6 - i, height: 6 - i }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
              />
            ))}
          </div>
        )}

        {mood === "relaxing" && (
          <motion.span
            className="absolute -top-1 -right-1 text-sm text-muted-foreground/60 font-bold"
            animate={{ opacity: [0, 1, 0], y: [0, -6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            z
          </motion.span>
        )}

        {mood === "encouraging" && (
          <motion.span
            className="absolute -top-1 -right-1 text-sm"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
        )}

        {mood === "happy" && (
          <motion.span
            className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs"
            animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🎉
          </motion.span>
        )}
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
