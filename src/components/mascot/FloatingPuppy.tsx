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
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50"
      >
        {/* Larger on mobile (lg), regular on desktop (md) */}
        <div className="block md:hidden">
          <PuppyMascot mood={mood} size="lg" message={message} />
        </div>
        <div className="hidden md:block">
          <PuppyMascot mood={mood} size="md" message={message} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingPuppy;
