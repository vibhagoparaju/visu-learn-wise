import { AnimatePresence, motion } from "framer-motion";
import PuppyMascot from "./PuppyMascot";
import { usePuppy } from "@/hooks/usePuppy";

const FloatingPuppy = () => {
  const { enabled, state, message } = usePuppy();

  if (!enabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 pointer-events-none"
        style={{ zIndex: 50 }}
      >
        <div className="block md:hidden">
          <PuppyMascot state={state} size="medium" message={message} />
        </div>
        <div className="hidden md:block">
          <PuppyMascot state={state} size="medium" message={message} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingPuppy;
