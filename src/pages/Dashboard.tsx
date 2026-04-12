import { motion } from "framer-motion";
import { BookOpen, Upload, MessageSquare, Flame, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const quickActions = [
  { icon: MessageSquare, label: "Ask AI", to: "/study", color: "bg-primary/10 text-primary" },
  { icon: Upload, label: "Upload Notes", to: "/upload", color: "bg-secondary/10 text-secondary" },
  { icon: BookOpen, label: "Continue Study", to: "/study", color: "bg-accent text-accent-foreground" },
];

const stats = [
  { icon: Flame, label: "Day Streak", value: "3", color: "text-orange-500" },
  { icon: Target, label: "Topics Done", value: "12", color: "text-primary" },
  { icon: Clock, label: "Study Time", value: "4.5h", color: "text-secondary" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.3 } },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Greeting */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {greeting}, Student! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Ready to learn something new today? Let's make it count.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-4 shadow-card text-center">
            <s.icon className={`h-5 w-5 mx-auto ${s.color}`} />
            <p className="text-xl font-bold text-foreground mt-2">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Today's Plan */}
      <motion.div variants={item} className="bg-card rounded-xl p-5 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-3">Today's Plan</h2>
        <div className="space-y-3">
          {["Review Chapter 3 – Cell Biology", "Practice MCQs on Genetics", "Revise key formulas"].map(
            (task, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full gradient-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{task}</span>
              </div>
            )
          )}
        </div>
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: "33%" }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">1 of 3 tasks completed</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="bg-card rounded-xl p-4 shadow-card hover:shadow-elevated transition-shadow flex flex-col items-center gap-2"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${a.color}`}>
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI Suggestion */}
      <motion.div
        variants={item}
        className="gradient-primary rounded-xl p-5 text-primary-foreground"
      >
        <p className="text-sm font-medium opacity-90">💡 VISU suggests</p>
        <p className="text-base font-semibold mt-1">
          You haven't reviewed Genetics in 3 days. Want a quick 5-minute refresher?
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => navigate("/study")}
        >
          Start Quick Review
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
