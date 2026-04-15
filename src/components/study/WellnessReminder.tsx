import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { usePuppy } from "@/hooks/usePuppy";
import puppyImage from "@/assets/puppy-mascot.png";

const reminders = [
  { text: "You've been studying a while — take a short break!" },
  { text: "Stay hydrated! Grab a glass of water." },
  { text: "Rest your eyes — look away from the screen for 20 seconds." },
  { text: "Take 3 deep breaths to reset your focus." },
];

const WellnessReminder = ({ sessionMinutes }: { sessionMinutes: number }) => {
  const [visible, setVisible] = useState(false);
  const [reminder, setReminder] = useState(reminders[0]);
  const { showMessage } = usePuppy();

  useEffect(() => {
    if (sessionMinutes > 0 && sessionMinutes % 25 === 0) {
      const r = reminders[Math.floor(Math.random() * reminders.length)];
      setReminder(r);
      setVisible(true);
      showMessage("Take a break! 🐾", "relaxing", 8000);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [sessionMinutes, showMessage]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-card shadow-elevated rounded-2xl px-4 py-3 flex items-center gap-3 border border-border max-w-sm"
        >
          <motion.img
            src={puppyImage}
            alt="Study buddy"
            width={36}
            height={36}
            className="drop-shadow-sm flex-shrink-0"
            animate={{ rotate: [0, 3, 0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            draggable={false}
          />
          <p className="text-sm text-foreground font-medium flex-1">{reminder.text}</p>
          <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WellnessReminder;
