import { motion } from "framer-motion";
import { BookOpen, Upload, MessageSquare, Flame, Target, Clock, Zap, Moon, CheckCircle2, Circle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const quickActions = [
  { icon: MessageSquare, label: "Ask AI", to: "/study", gradient: "gradient-primary", shadow: "shadow-glow" },
  { icon: Upload, label: "Upload Notes", to: "/upload", gradient: "gradient-success", shadow: "shadow-glow-cyan" },
  { icon: BookOpen, label: "Continue Study", to: "/study", gradient: "gradient-warm", shadow: "" },
];

const defaultTasks = [
  { text: "Review Chapter 3 – Cell Biology", done: true },
  { text: "Practice MCQs on Genetics", done: false },
  { text: "Revise key formulas", done: false },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.25, duration: 0.6 } },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [taskList, setTaskList] = useState(defaultTasks);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const completedCount = taskList.filter((t) => t.done).length;
  const displayName = profile?.display_name || "Student";
  const streakDays = profile?.streak_days || 0;
  const xp = profile?.xp || 0;

  const toggleTask = (index: number) => {
    setTaskList((prev) => prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t)));
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      {/* Hero Greeting */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8 text-primary-foreground">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-4 text-6xl opacity-20 select-none">📚</div>
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80">{greeting} 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold font-display mt-1">
            Hey, {displayName}!
          </h1>
          <p className="text-sm opacity-75 mt-2 max-w-md">
            {streakDays > 0
              ? `You're on a ${streakDays}-day streak! Let's keep it going.`
              : "Ready to start your learning journey? Let's go!"}
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full px-5 font-semibold"
              onClick={() => navigate("/study")}
            >
              <Zap className="h-4 w-4 mr-1" /> Start Studying
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full px-3 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { emoji: "🔥", value: String(streakDays), label: "Day Streak" },
          { emoji: "⚡", value: String(xp), label: "XP Points" },
          { emoji: "📊", value: `Lv.${profile?.level || 1}`, label: "Level" },
        ].map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="bg-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-shadow text-center cursor-default"
          >
            <span className="text-2xl">{s.emoji}</span>
            <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Today's Plan */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Today's Plan</h2>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {completedCount}/{taskList.length}
          </span>
        </div>
        <div className="space-y-3">
          {taskList.map((task, i) => (
            <motion.button key={i} whileTap={{ scale: 0.98 }} onClick={() => toggleTask(i)} className="flex items-center gap-3 w-full text-left group">
              {task.done ? (
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 transition-colors" />
              )}
              <span className={`text-sm transition-colors ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {task.text}
              </span>
            </motion.button>
          ))}
        </div>
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / taskList.length) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <motion.button
              key={a.label}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(a.to)}
              className="bg-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-all flex flex-col items-center gap-3"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${a.gradient} ${a.shadow}`}>
                <a.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold text-foreground">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* AI Suggestion */}
      <motion.div variants={item}>
        <motion.div whileHover={{ scale: 1.01 }} className="relative overflow-hidden bg-card rounded-2xl p-5 shadow-card border border-primary/10">
          <div className="absolute top-0 right-0 w-24 h-24 gradient-primary rounded-full blur-3xl opacity-20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center">
                <Zap className="h-3 w-3 text-primary-foreground" />
              </div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">{profile?.tutor_name || "VISU"} suggests</p>
            </div>
            <p className="text-sm font-medium text-foreground">
              Ready for a quick study session? Ask me anything or upload your notes to get started!
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="gradient" size="sm" className="rounded-full px-4 text-xs" onClick={() => navigate("/study")}>
                Start Chat
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full px-4 text-xs text-muted-foreground" onClick={() => navigate("/upload")}>
                <Moon className="h-3 w-3 mr-1" /> Upload Notes
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
