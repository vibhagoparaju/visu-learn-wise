import { AnimatePresence, motion } from "framer-motion";
import PuppyMascot from "./PuppyMascot";
import { usePuppy } from "@/hooks/usePuppy";

const FloatingPuppy = () => {
  const { enabled, mood, message } = usePuppy();

  if (!enabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50"
      >
        <PuppyMascot mood={mood} size="md" message={message} />
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingPuppy;
