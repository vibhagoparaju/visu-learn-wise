import { motion } from "framer-motion";
import { Flame, Star, Zap, Award, BookOpen, Brain, Target, Trophy } from "lucide-react";

const badges = [
  { icon: Flame, label: "3-Day Streak", desc: "Study 3 days in a row", earned: true, color: "text-orange-500" },
  { icon: Star, label: "First Quiz", desc: "Complete your first quiz", earned: true, color: "text-yellow-500" },
  { icon: Zap, label: "Speed Learner", desc: "Finish a lesson in under 5 min", earned: false, color: "text-primary" },
  { icon: Award, label: "Topic Master", desc: "Master any topic to 100%", earned: false, color: "text-secondary" },
  { icon: BookOpen, label: "Bookworm", desc: "Upload 10 documents", earned: false, color: "text-green-500" },
  { icon: Brain, label: "Big Brain", desc: "Score 100% on 5 quizzes", earned: false, color: "text-purple-500" },
];

const streakDays = [
  { day: "Mon", active: true },
  { day: "Tue", active: true },
  { day: "Wed", active: true },
  { day: "Thu", active: false },
  { day: "Fri", active: false },
  { day: "Sat", active: false },
  { day: "Sun", active: false },
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
  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
    <motion.div variants={item}>
      <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
      <p className="text-sm text-muted-foreground mt-1">Keep learning to earn XP and unlock badges! 🏆</p>
    </motion.div>

    {/* XP Card */}
    <motion.div variants={item} className="relative overflow-hidden gradient-primary rounded-2xl p-6 text-primary-foreground">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-2 right-4 text-5xl opacity-20">🏆</div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-5 w-5" />
          <span className="text-sm font-medium opacity-80">Your Level</span>
        </div>
        <p className="text-4xl font-bold">240 XP</p>
        <p className="text-sm opacity-80 mt-0.5">Level 3 – Rising Star ⭐</p>
        <div className="h-2.5 bg-primary-foreground/20 rounded-full mt-4 overflow-hidden">
          <motion.div
            className="h-full bg-primary-foreground/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: "60%" }}
            transition={{ duration: 1 }}
          />
        </div>
        <p className="text-xs mt-1.5 opacity-60">160 XP to Level 4</p>
      </div>
    </motion.div>

    {/* Streak Tracker */}
    <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Weekly Streak</h2>
        <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
          <Flame className="h-4 w-4" /> 3 days
        </span>
      </div>
      <div className="flex justify-between">
        {streakDays.map((d) => (
          <div key={d.day} className="flex flex-col items-center gap-1.5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.4, delay: 0.3 }}
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg ${
                d.active ? "gradient-warm shadow-sm" : "bg-muted"
              }`}
            >
              {d.active ? "🔥" : ""}
            </motion.div>
            <span className={`text-[10px] font-medium ${d.active ? "text-foreground" : "text-muted-foreground"}`}>
              {d.day}
            </span>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Badges */}
    <motion.div variants={item}>
      <h2 className="text-base font-semibold text-foreground mb-3">Badges</h2>
      <div className="grid grid-cols-2 gap-3">
        {badges.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i }}
            className={`bg-card rounded-2xl p-4 shadow-card text-center relative overflow-hidden ${
              !b.earned ? "opacity-50" : ""
            }`}
          >
            {b.earned && (
              <div className="absolute top-2 right-2 text-xs">✅</div>
            )}
            <motion.div
              whileHover={b.earned ? { rotate: [0, -10, 10, 0], scale: 1.1 } : {}}
            >
              <b.icon className={`h-8 w-8 mx-auto ${b.earned ? b.color : "text-muted-foreground"}`} />
            </motion.div>
            <p className="text-sm font-semibold text-foreground mt-2">{b.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </motion.div>
);

export default Rewards;
