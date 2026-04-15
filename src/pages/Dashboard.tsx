import { motion } from "framer-motion";
import { Upload, MessageSquare, CheckCircle2, Circle, LogOut, BookOpen, Rocket, RefreshCw, Layers, ArrowRight, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/study/EmptyState";
import OnboardingWalkthrough from "@/components/onboarding/OnboardingWalkthrough";
import { generateDailyPlan, saveDailyPlan } from "@/services/studyPlanner";

interface StudyTask {
  text: string;
  done: boolean;
  topicId?: string;
  type?: string;
}

interface RecentDoc {
  id: string;
  file_name: string;
  topics: string[];
  created_at: string;
}

interface WeakTopic {
  topic: string;
  mastery_pct: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.15, duration: 0.6 } },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const [taskList, setTaskList] = useState<StudyTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [totalTopics, setTotalTopics] = useState(0);
  const [dueCardCount, setDueCardCount] = useState(0);
  const [lastStudiedTopic, setLastStudiedTopic] = useState<string | null>(null);
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = profile?.display_name || "Student";
  const streakDays = profile?.streak_days || 0;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadingTasks(true);

      const today = new Date().toISOString().split("T")[0];
      const [planRes, docCountRes, progressRes, dueCardsRes, lastStudiedRes, recentDocsRes] = await Promise.all([
        supabase.from("study_plans").select("tasks").eq("user_id", user.id).eq("plan_date", today).maybeSingle(),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("study_progress").select("topic, mastery_pct").eq("user_id", user.id),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review_at", new Date().toISOString()),
        supabase.from("study_progress").select("topic").eq("user_id", user.id).order("last_studied_at", { ascending: false }).limit(1),
        supabase.from("documents").select("id, file_name, topics, created_at").eq("user_id", user.id).eq("status", "done").order("created_at", { ascending: false }).limit(4),
      ]);

      if (planRes.data?.tasks && Array.isArray(planRes.data.tasks)) {
        setTaskList(planRes.data.tasks as unknown as StudyTask[]);
      }

      setHasDocuments((docCountRes.count || 0) > 0);
      setDueCardCount(dueCardsRes.count || 0);

      const progressData = progressRes.data || [];
      setTotalTopics(progressData.length);

      // Weak topics
      const weak = progressData
        .filter((p) => (p.mastery_pct || 0) < 50 && (p.mastery_pct || 0) > 0)
        .sort((a, b) => (a.mastery_pct || 0) - (b.mastery_pct || 0))
        .slice(0, 4) as WeakTopic[];
      setWeakTopics(weak);

      if (lastStudiedRes.data?.[0]) {
        setLastStudiedTopic(lastStudiedRes.data[0].topic);
      }

      if (recentDocsRes.data) {
        setRecentDocs(recentDocsRes.data.map((d) => ({
          ...d,
          topics: (d.topics as string[]) || [],
        })));
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
      <OnboardingWalkthrough />
      {/* Greeting */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting}</p>
            <h1 className="text-2xl font-bold text-foreground font-display mt-1">{displayName}</h1>
            {streakDays > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{streakDays} day streak</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl h-9 w-9 text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Continue Study + Quick Revision */}
      <motion.div variants={item} className="space-y-3">
        {lastStudiedTopic && (
          <button
            onClick={() => navigate(`/study/${encodeURIComponent(lastStudiedTopic)}`)}
            className="w-full bg-card rounded-2xl p-5 shadow-card text-left hover:shadow-elevated transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Continue Studying</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{lastStudiedTopic}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        )}
        {dueCardCount > 0 && (
          <button
            onClick={() => navigate("/flashcards")}
            className="w-full bg-card rounded-2xl p-5 shadow-card text-left hover:shadow-elevated transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Quick Revision</p>
                <p className="text-xs text-muted-foreground mt-0.5">{dueCardCount} card{dueCardCount !== 1 ? "s" : ""} due for review</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        )}
      </motion.div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Needs Review</h2>
          </div>
          <div className="space-y-3">
            {weakTopics.map((t) => (
              <button
                key={t.topic}
                onClick={() => navigate(`/study/${encodeURIComponent(t.topic)}`)}
                className="w-full flex items-center gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground truncate">{t.topic}</span>
                    <span className="text-xs text-muted-foreground ml-2">{t.mastery_pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-warm rounded-full transition-all"
                      style={{ width: `${t.mastery_pct}%` }}
                    />
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      {recentDocs.length > 0 && (
        <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentDocs.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{doc.file_name}</p>
                  {doc.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {doc.topics.slice(0, 3).map((t) => (
                        <button
                          key={t}
                          onClick={() => navigate(`/study/${encodeURIComponent(t)}`)}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Today's Plan — only show if tasks exist or user has data */}
      {hasAnyData && (
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
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 flex-shrink-0 transition-colors" />
                  )}
                  <span className={`text-sm transition-colors ${task.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {task.text}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">No plan yet</p>
              <Button variant="outline" size="sm" className="rounded-full px-5" onClick={handleGeneratePlan} disabled={generatingPlan}>
                {generatingPlan ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</> : "Generate Plan"}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state for new users */}
      {!loadingTasks && !hasAnyData && (
        <motion.div variants={item}>
          <EmptyState
            icon={Rocket}
            emoji="📖"
            title="Welcome to VISU"
            description="Upload study material or ask the AI tutor anything to begin your learning journey."
            actions={[
              { label: "Upload Material", onClick: () => navigate("/upload") },
              { label: "Ask AI", onClick: () => navigate("/study"), variant: "outline" },
            ]}
          />
        </motion.div>
      )}

      {/* Quick Actions — minimal */}
      {hasAnyData && (
        <motion.div variants={item} className="flex gap-3">
          <button
            onClick={() => navigate("/study")}
            className="flex-1 bg-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-all flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Ask AI</span>
          </button>
          <button
            onClick={() => navigate("/upload")}
            className="flex-1 bg-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-all flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl gradient-success flex items-center justify-center">
              <Upload className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Upload</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
