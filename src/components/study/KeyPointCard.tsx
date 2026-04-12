import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

const KeyPointCard = ({ title, points }: { title: string; points: string[] }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-accent/50 border border-primary/10 rounded-xl p-4 my-2"
  >
    <div className="flex items-center gap-2 mb-2">
      <Lightbulb className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold text-primary uppercase tracking-wider">{title}</span>
    </div>
    <ul className="space-y-1">
      {points.map((p, i) => (
        <li key={i} className="text-sm text-foreground flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          {p}
        </li>
      ))}
    </ul>
  </motion.div>
);

export default KeyPointCard;
