import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Brain, Target, Clock, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Topic {
  name: string;
  progress: number;
  strength: "strong" | "moderate" | "weak";
  subtopics?: { name: string; status: "done" | "weak" | "not-started" }[];
}

const topics: Topic[] = [
  {
    name: "Cell Biology",
    progress: 85,
    strength: "strong",
    subtopics: [
      { name: "Cell Structure", status: "done" },
      { name: "Cell Membrane", status: "done" },
      { name: "Organelles", status: "weak" },
    ],
  },
  {
    name: "Genetics",
    progress: 45,
    strength: "weak",
    subtopics: [
      { name: "Mendel's Laws", status: "done" },
      { name: "DNA Replication", status: "weak" },
      { name: "Gene Expression", status: "not-started" },
    ],
  },
  {
    name: "Ecology",
    progress: 70,
    strength: "moderate",
    subtopics: [
      { name: "Ecosystems", status: "done" },
      { name: "Food Chains", status: "done" },
      { name: "Biodiversity", status: "weak" },
    ],
  },
  {
    name: "Human Physiology",
    progress: 30,
    strength: "weak",
    subtopics: [
      { name: "Circulatory System", status: "weak" },
      { name: "Nervous System", status: "not-started" },
      { name: "Respiratory System", status: "not-started" },
    ],
  },
  {
    name: "Evolution",
    progress: 90,
    strength: "strong",
    subtopics: [
      { name: "Natural Selection", status: "done" },
      { name: "Speciation", status: "done" },
      { name: "Evidence of Evolution", status: "done" },
    ],
  },
];

const strengthConfig = {
  strong: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  moderate: { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500" },
  weak: { color: "text-red-500", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
};

const subtopicStatusConfig = {
  done: { color: "text-green-600", bg: "bg-green-100", label: "✅" },
  weak: { color: "text-yellow-600", bg: "bg-yellow-100", label: "⚠️" },
  "not-started": { color: "text-muted-foreground", bg: "bg-muted", label: "⬜" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const overallProgress = Math.round(topics.reduce((acc, t) => acc + t.progress, 0) / topics.length);

const Progress = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your learning journey</p>
      </motion.div>

      {/* Overview Cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Brain, label: "Mastery", value: `${overallProgress}%`, gradient: "gradient-primary" },
          { icon: Target, label: "Topics", value: `${topics.length}`, gradient: "gradient-success" },
          { icon: TrendingUp, label: "This Week", value: "+12%", gradient: "gradient-warm" },
          { icon: Clock, label: "Avg Session", value: "25m", gradient: "gradient-primary" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-2xl p-4 shadow-card">
            <div className={`h-8 w-8 rounded-lg ${stat.gradient} flex items-center justify-center mb-2`}>
              <stat.icon className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Overall Progress Bar */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Overall Mastery</h2>
          <span className="text-sm font-bold text-primary">{overallProgress}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Topic Breakdown - Tree View */}
      <motion.div variants={item} className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Study Map</h2>
        {topics.map((t) => {
          const config = strengthConfig[t.strength];
          const isExpanded = expanded === t.name;
          return (
            <motion.div key={t.name} layout className="bg-card rounded-2xl shadow-card overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : t.name)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className={`h-3 w-3 rounded-full ${config.dot} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-foreground">{t.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${config.color} ${config.bg}`}>
                      {t.strength}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full gradient-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${t.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{t.progress}% mastered</p>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {isExpanded && t.subtopics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 pt-3 space-y-2">
                      {t.subtopics.map((sub) => {
                        const subConfig = subtopicStatusConfig[sub.status];
                        return (
                          <div key={sub.name} className="flex items-center gap-3 pl-6">
                            <span className="text-sm">{subConfig.label}</span>
                            <span className="text-sm text-foreground">{sub.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default Progress;
