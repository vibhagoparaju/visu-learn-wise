import { motion } from "framer-motion";

const topics = [
  { name: "Cell Biology", progress: 85, strength: "strong" },
  { name: "Genetics", progress: 45, strength: "weak" },
  { name: "Ecology", progress: 70, strength: "moderate" },
  { name: "Human Physiology", progress: 30, strength: "weak" },
  { name: "Evolution", progress: 90, strength: "strong" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const strengthColor = {
  strong: "text-green-600 bg-green-50",
  moderate: "text-yellow-600 bg-yellow-50",
  weak: "text-red-500 bg-red-50",
};

const Progress = () => (
  <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
    <motion.div variants={item}>
      <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
      <p className="text-sm text-muted-foreground mt-1">Track your learning journey</p>
    </motion.div>

    <motion.div variants={item} className="grid grid-cols-2 gap-3">
      <div className="bg-card rounded-xl p-4 shadow-card text-center">
        <p className="text-2xl font-bold text-foreground">12</p>
        <p className="text-xs text-muted-foreground">Topics Covered</p>
      </div>
      <div className="bg-card rounded-xl p-4 shadow-card text-center">
        <p className="text-2xl font-bold text-foreground">64%</p>
        <p className="text-xs text-muted-foreground">Overall Mastery</p>
      </div>
    </motion.div>

    <motion.div variants={item} className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Topic Breakdown</h2>
      {topics.map((t) => (
        <div key={t.name} className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">{t.name}</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                strengthColor[t.strength as keyof typeof strengthColor]
              }`}
            >
              {t.strength}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${t.progress}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t.progress}% mastered</p>
        </div>
      ))}
    </motion.div>
  </motion.div>
);

export default Progress;
