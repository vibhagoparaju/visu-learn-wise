import { motion } from "framer-motion";
import { Upload, MessageSquare, Zap, CheckCircle2, Circle, LogOut, BookOpen, Rocket, RefreshCw, Layers, ArrowRight } from "lucide-react";
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
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.2, duration: 0.5 } },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [taskList, setTaskList] = useState<StudyTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [totalTopics, setTotalTopics] = useState(0);
  const [completedTopics, setCompletedTopics] = useState(0);
  const [dueCardCount, setDueCardCount] = useState(0);
  const [lastStudiedTopic, setLastStudiedTopic] = useState<string | null>(null);
  const [memoryScore, setMemoryScore] = useState(0);
  const [weakCount, setWeakCount] = useState(0);
  const [strongCount, setStrongCount] = useState(0);

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
      const [planRes, docCountRes, progressRes, dueCardsRes, lastStudiedRes] = await Promise.all([
        supabase.from("study_plans").select("tasks").eq("user_id", user.id).eq("plan_date", today).maybeSingle(),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("study_progress").select("id, mastery_pct").eq("user_id", user.id),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review_at", new Date().toISOString()),
        supabase.from("study_progress").select("topic").eq("user_id", user.id).order("last_studied_at", { ascending: false }).limit(1),
      ]);

      if (planRes.data?.tasks && Array.isArray(planRes.data.tasks)) {
        setTaskList(planRes.data.tasks as unknown as StudyTask[]);
      }

      setHasDocuments((docCountRes.count || 0) > 0);
      setDueCardCount(dueCardsRes.count || 0);

      const progressData = progressRes.data || [];
      const total = progressData.length;
      const completed = progressData.filter((p) => (p.mastery_pct || 0) >= 75).length;
      const weak = progressData.filter((p) => (p.mastery_pct || 0) < 40 && (p.mastery_pct || 0) > 0).length;
      const strong = progressData.filter((p) => (p.mastery_pct || 0) >= 75).length;
      const avgMastery = total > 0 ? Math.round(progressData.reduce((a, p) => a + (p.mastery_pct || 0), 0) / total) : 0;

      setTotalTopics(total);
      setCompletedTopics(completed);
      setMemoryScore(avgMastery);
      setWeakCount(weak);
      setStrongCount(strong);

      if (lastStudiedRes.data?.[0]) {
        setLastStudiedTopic(lastStudiedRes.data[0].topic);
      }

      setLoadingTasks(false);
    };
    fetchData();
  }, [user]);

  const completedCount = taskList.filter((t) => t.done).length;
  const hasAnyData = hasDocuments || totalTopics > 0 || taskList.length > 0;

  const toggleTask = async (index: number) => {
    const updated = taskList.map((t, i) => (i === index ? { ...t, done: !t.done } : t));
    setTaskList(updated);
    if (user) await saveDailyPlan(user.id, updated as any);
  };

  const handleGeneratePlan = async () => {
    if (!user) return;
    setGeneratingPlan(true);
    try {
      const tasks = await generateDailyPlan(user.id);
      setTaskList(tasks);
      await saveDailyPlan(user.id, tasks);
    } catch { /* silent */ }
    setGeneratingPlan(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-24 md:pb-8">
      {/* Greeting */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="text-2xl font-bold text-foreground font-display mt-0.5">{displayName}</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl h-9 w-9 text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats — compact single card */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="grid grid-cols-4 gap-4 text-center">
          {[
            { value: String(streakDays), label: "Streak", suffix: "d" },
            { value: String(xp), label: "XP", suffix: "" },
            { value: `${memoryScore}`, label: "Mastery", suffix: "%" },
            { value: String(dueCardCount), label: "Due Cards", suffix: "" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold text-foreground">{s.value}{s.suffix}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Continue Study / Quick Revision */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lastStudiedTopic && (
          <button
            onClick={() => navigate(`/study/${encodeURIComponent(lastStudiedTopic)}`)}
            className="bg-card rounded-2xl p-5 shadow-card text-left hover:shadow-elevated transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Continue Studying</p>
                <p className="text-xs text-muted-foreground truncate">{lastStudiedTopic}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        )}
        {dueCardCount > 0 && (
          <button
            onClick={() => navigate("/flashcards")}
            className="bg-card rounded-2xl p-5 shadow-card text-left hover:shadow-elevated transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-success flex items-center justify-center flex-shrink-0">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Quick Revision</p>
                <p className="text-xs text-muted-foreground">{dueCardCount} cards due</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        )}
      </motion.div>

      {/* Memory Health (only if topics exist) */}
      {totalTopics > 0 && (
        <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-semibold text-foreground mb-3">Memory Health</h2>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${memoryScore}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{strongCount} strong</span>
            <span>{weakCount} need review</span>
            <span>{completedTopics}/{totalTopics} mastered</span>
          </div>
        </motion.div>
      )}

      {/* Today's Plan */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Today's Plan</h2>
          <div className="flex items-center gap-2">
            {taskList.length > 0 && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {completedCount}/{taskList.length}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generatingPlan ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {taskList.length > 0 ? (
          <div className="space-y-2.5">
            {taskList.map((task, i) => (
              <button key={i} onClick={() => toggleTask(i)} className="flex items-center gap-3 w-full text-left group">
                {task.done ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 transition-colors" />
                )}
                <span className={`text-sm transition-colors ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {task.text}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">No plan for today</p>
            <Button variant="outline" size="sm" className="rounded-full px-5" onClick={handleGeneratePlan} disabled={generatingPlan}>
              {generatingPlan ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</> : "Generate Plan"}
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
            title="Welcome to VISU"
            description="Upload study material or ask the AI tutor anything to begin."
            actions={[
              { label: "Upload Material", onClick: () => navigate("/upload") },
              { label: "Ask AI", onClick: () => navigate("/study"), variant: "outline" },
            ]}
          />
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="flex gap-3">
          {[
            { icon: MessageSquare, label: "Ask AI", to: "/study", gradient: "gradient-primary" },
            { icon: Upload, label: "Upload", to: "/upload", gradient: "gradient-success" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              className="flex-1 bg-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-all flex items-center gap-3"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${a.gradient}`}>
                <a.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
