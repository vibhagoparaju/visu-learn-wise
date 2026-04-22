import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coffee, Clock } from "lucide-react";
import { useWellness, useWellnessTimer } from "@/hooks/useWellness";
import { useAnimations } from "@/hooks/useAnimations";
import puppyImage from "@/assets/puppy-mascot.png";

const messages = [
  "Take a short break 🌿",
  "Relax your mind for a minute",
  "Have some water and stretch",
  "Rest your eyes — look 20 ft away for 20 seconds",
  "Take 3 deep breaths to reset your focus",
];

interface Props {
  /** Pause timer accumulation (e.g. while AI is streaming). */
  paused?: boolean;
}

const WellnessReminder = ({ paused }: Props) => {
  const { enabled, setEnabled } = useWellness();
  const { shouldAnimate } = useAnimations();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(messages[0]);

  const trigger = useCallback(() => {
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
    setVisible(true);
  }, []);

  const { snooze, skip } = useWellnessTimer(trigger, { paused });

  if (!enabled) return null;

  const handleSnooze = () => { snooze(5); setVisible(false); };
  const handleSkip = () => { skip(); setVisible(false); };
  const handleDisable = () => { setEnabled(false); setVisible(false); };

  // Gentle puppy "stretch / yawn" animation — calm sway + subtle breathing scale
  const puppyAnim = shouldAnimate
    ? { rotate: [0, 4, 0, -4, 0], scale: [1, 1.04, 1] }
    : undefined;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-card/95 backdrop-blur shadow-elevated rounded-2xl border border-border max-w-sm w-[calc(100%-2rem)]"
        >
          <div className="flex items-start gap-3 p-4">
            <motion.img
              src={puppyImage}
              alt=""
              width={44}
              height={44}
              className="drop-shadow-sm flex-shrink-0 mt-0.5"
              animate={puppyAnim}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              draggable={false}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">A short pause keeps your focus sharp.</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleSnooze}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Clock className="h-3 w-3" />
                  Snooze 5m
                </button>
                <button
                  onClick={handleSkip}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleDisable}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-auto"
                  title="Turn off wellness reminders"
                >
                  Turn off
                </button>
              </div>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WellnessReminder;
