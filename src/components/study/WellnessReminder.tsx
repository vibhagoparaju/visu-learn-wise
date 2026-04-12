import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const reminders = [
  { emoji: "🌿", text: "You've been studying a while — take a short break!" },
  { emoji: "💧", text: "Stay hydrated! Grab a glass of water." },
  { emoji: "👁️", text: "Rest your eyes — look away from the screen for 20 seconds." },
  { emoji: "🧘", text: "Take 3 deep breaths to reset your focus." },
];

const WellnessReminder = ({ sessionMinutes }: { sessionMinutes: number }) => {
  const [visible, setVisible] = useState(false);
  const [reminder, setReminder] = useState(reminders[0]);

  useEffect(() => {
    // Show reminder every 25 minutes
    if (sessionMinutes > 0 && sessionMinutes % 25 === 0) {
      setReminder(reminders[Math.floor(Math.random() * reminders.length)]);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [sessionMinutes]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-card shadow-elevated rounded-2xl px-5 py-3 flex items-center gap-3 border border-border max-w-sm"
        >
          <span className="text-2xl">{reminder.emoji}</span>
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
