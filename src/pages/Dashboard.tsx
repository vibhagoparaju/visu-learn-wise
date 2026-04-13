import { motion } from "framer-motion";
import { Upload, MessageSquare, Zap, CheckCircle2, Circle, LogOut, BookOpen, Rocket, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/study/EmptyState";
import { generateDailyPlan, saveDailyPlan } from "@/services/studyPlanner";

interface StudyTask {
  text: string;
  done: boolean;
  topicId?: string;
  type?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.25, duration: 0.6 } },
};

const quickActions = [
  { icon: MessageSquare, label: "Ask AI", to: "/study", gradient: "gradient-primary", shadow: "shadow-glow" },
  { icon: Upload, label: "Upload Notes", to: "/upload", gradient: "gradient-success", shadow: "shadow-glow-cyan" },
  { icon: BookOpen, label: "Continue Study", to: "/progress", gradient: "gradient-warm", shadow: "" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [taskList, setTaskList] = useState<StudyTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [totalTopics, setTotalTopics] = useState(0);
  const [completedTopics, setCompletedTopics] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = profile?.display_name || "Student";
  const streakDays = profile?.streak_days || 0;
  const xp = profile?.xp || 0;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadingTasks(true);

      const today = new Date().toISOString().split("T")[0];
      const { data: plan } = await supabase
        .from("study_plans")
        .select("tasks")
        .eq("user_id", user.id)
        .eq("plan_date", today)
        .maybeSingle();

      if (plan?.tasks && Array.isArray(plan.tasks)) {
        setTaskList(plan.tasks as unknown as StudyTask[]);
      } else {
        setTaskList([]);
      }

      const { count: docCount } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setHasDocuments((docCount || 0) > 0);

      const { data: progressData } = await supabase
        .from("study_progress")
        .select("id, mastery_pct")
        .eq("user_id", user.id);

      const total = progressData?.length || 0;
      const completed = progressData?.filter((p) => p.mastery_pct >= 75).length || 0;
      setTotalTopics(total);
      setCompletedTopics(completed);
      setProgressCount(total);

      setLoadingTasks(false);
    };
    fetchData();
  }, [user]);

  const completedCount = taskList.filter((t) => t.done).length;
  const hasAnyData = hasDocuments || progressCount > 0 || taskList.length > 0;
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const toggleTask = async (index: number) => {
    const updated = taskList.map((t, i) => (i === index ? { ...t, done: !t.done } : t));
    setTaskList(updated);
    if (user) {
      await saveDailyPlan(user.id, updated);
    }
  };

  const handleGeneratePlan = async () => {
    if (!user) return;
    setGeneratingPlan(true);
    try {
      const tasks = await generateDailyPlan(user.id);
      setTaskList(tasks);
      await saveDailyPlan(user.id, tasks);
    } catch {
      // silent
    }
    setGeneratingPlan(false);
  };

  const nudge = !hasDocuments
    ? "Upload your first study material to get started! 📄"
    : progressCount > 0
    ? "Ready to continue? Let's revise your weak topics 💪"
    : `You're on a ${streakDays > 0 ? `${streakDays}-day streak! Let's keep it going.` : "great path! Let's start learning."}`;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      {/* Hero Greeting */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl gradient-primary p-6 md:p-8 text-primary-foreground">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 right-4 text-6xl opacity-20 select-none">📚</div>
        <div className="relative z-10">
          <p className="text-sm font-medium opacity-80">{greeting} 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold font-display mt-1">Hey, {displayName}!</h1>
          <p className="text-sm opacity-75 mt-2 max-w-md">{nudge}</p>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" size="sm" className="rounded-full px-5 font-semibold" onClick={() => navigate("/study")}>
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
          { emoji: "📊", value: `${overallProgress}%`, label: "Mastery" },
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

      {/* Overall Progress Bar */}
      {totalTopics > 0 && (
        <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Learning Progress</h2>
            <span className="text-xs font-medium text-muted-foreground">{completedTopics}/{totalTopics} topics mastered</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Today's Plan */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Today's Plan</h2>
          <div className="flex items-center gap-2">
            {taskList.length > 0 && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                {completedCount}/{taskList.length}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              title="Generate smart plan"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generatingPlan ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {taskList.length > 0 ? (
          <>
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
                  animate={{ width: `${taskList.length > 0 ? (completedCount / taskList.length) * 100 : 0}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">No plan for today yet</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-5"
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
            >
              {generatingPlan ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Smart Plan ✨"
              )}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Empty state for new users */}
      {!loadingTasks && !hasAnyData && (
        <motion.div variants={item}>
          <EmptyState
            icon={Rocket}
            emoji="🚀"
            title="Welcome! Let's start your learning journey"
            description="Upload study material or ask the AI tutor anything to get started."
            actions={[
              { label: "Upload Material", onClick: () => navigate("/upload") },
              { label: "Ask AI", onClick: () => navigate("/study"), variant: "outline" },
            ]}
          />
        </motion.div>
      )}

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
              {!hasDocuments
                ? "Upload your notes or textbook and I'll create a study plan for you! 📖"
                : "Ready for a quick study session? Let's review what you've learned! 🎯"}
            </p>
            <div className="flex gap-2 mt-3">
              <Button variant="gradient" size="sm" className="rounded-full px-4 text-xs" onClick={() => navigate("/study")}>
                Start Chat
              </Button>
              {!hasDocuments && (
                <Button variant="ghost" size="sm" className="rounded-full px-4 text-xs text-muted-foreground" onClick={() => navigate("/upload")}>
                  Upload Notes
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
