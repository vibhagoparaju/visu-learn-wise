import { motion } from "framer-motion";
import { Flame, Star, Zap, Award } from "lucide-react";

const badges = [
  { icon: Flame, label: "3-Day Streak", earned: true },
  { icon: Star, label: "First Quiz", earned: true },
  { icon: Zap, label: "Speed Learner", earned: false },
  { icon: Award, label: "Topic Master", earned: false },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const Rewards = () => (
  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
    <motion.div variants={item}>
      <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
      <p className="text-sm text-muted-foreground mt-1">Keep learning to earn XP and badges!</p>
    </motion.div>

    <motion.div variants={item} className="gradient-primary rounded-xl p-6 text-center text-primary-foreground">
      <p className="text-4xl font-bold">240 XP</p>
      <p className="text-sm opacity-80 mt-1">Level 3 – Rising Star ⭐</p>
      <div className="h-2 bg-primary-foreground/20 rounded-full mt-4 overflow-hidden">
        <motion.div
          className="h-full bg-primary-foreground/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "60%" }}
          transition={{ duration: 1 }}
        />
      </div>
      <p className="text-xs mt-1 opacity-70">160 XP to Level 4</p>
    </motion.div>

    <motion.div variants={item}>
      <h2 className="text-lg font-semibold text-foreground mb-3">Badges</h2>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((b) => (
          <div
            key={b.label}
            className={`bg-card rounded-xl p-4 shadow-card text-center ${
              !b.earned ? "opacity-40" : ""
            }`}
          >
            <b.icon className={`h-8 w-8 mx-auto ${b.earned ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium text-foreground mt-2">{b.label}</p>
            <p className="text-[10px] text-muted-foreground">{b.earned ? "Earned ✅" : "Locked"}</p>
          </div>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

export default Rewards;
