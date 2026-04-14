import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Brain, Target, Clock, ChevronRight, Flame, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ProgressTopic {
  id: string;
  topic: string;
  subtopic: string | null;
  mastery_pct: number;
  strength: string;
  questions_attempted: number;
  questions_correct: number;
}

interface GroupedTopic {
  name: string;
  progress: number;
  strength: "strong" | "moderate" | "weak" | "not-started";
  questionsAttempted: number;
  questionsCorrect: number;
  subtopics: { name: string; status: "done" | "weak" | "not-started"; mastery: number }[];
}

const strengthConfig = {
  strong: { color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/30", dot: "bg-green-500" },
  moderate: { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-950/30", dot: "bg-yellow-500" },
  weak: { color: "text-red-500 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", dot: "bg-red-500" },
  "not-started": { color: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground" },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Progress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [topics, setTopics] = useState<GroupedTopic[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [progressRes, profileRes] = await Promise.all([
        supabase.from("study_progress").select("*").eq("user_id", user.id).order("topic"),
        supabase.from("profiles").select("streak_days").eq("id", user.id).single(),
      ]);

      setStreakDays(profileRes.data?.streak_days || 0);

      const data = progressRes.data;
      if (data && data.length > 0) {
        const map = new Map<string, ProgressTopic[]>();
        (data as ProgressTopic[]).forEach((r) => {
          const existing = map.get(r.topic) || [];
          existing.push(r);
          map.set(r.topic, existing);
        });

        const grouped: GroupedTopic[] = Array.from(map.entries()).map(([name, rows]) => {
          const avgMastery = Math.round(rows.reduce((a, r) => a + (r.mastery_pct || 0), 0) / rows.length);
          const strength: GroupedTopic["strength"] =
            avgMastery >= 75 ? "strong" : avgMastery >= 40 ? "moderate" : avgMastery > 0 ? "weak" : "not-started";
          const questionsAttempted = rows.reduce((a, r) => a + (r.questions_attempted || 0), 0);
          const questionsCorrect = rows.reduce((a, r) => a + (r.questions_correct || 0), 0);

          const subtopics = rows
            .filter((r) => r.subtopic)
            .map((r) => ({
              name: r.subtopic!,
              status: (r.mastery_pct >= 75 ? "done" : r.mastery_pct >= 30 ? "weak" : "not-started") as "done" | "weak" | "not-started",
              mastery: r.mastery_pct,
            }));

          return { name, progress: avgMastery, strength, subtopics, questionsAttempted, questionsCorrect };
        });
        setTopics(grouped);
      } else {
        setTopics([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const overallProgress = topics.length > 0
    ? Math.round(topics.reduce((acc, t) => acc + t.progress, 0) / topics.length)
    : 0;

  const totalAttempted = topics.reduce((a, t) => a + t.questionsAttempted, 0);
  const totalCorrect = topics.reduce((a, t) => a + t.questionsCorrect, 0);
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const strongCount = topics.filter((t) => t.strength === "strong").length;
  const weakCount = topics.filter((t) => t.strength === "weak").length;
  const notStartedCount = topics.filter((t) => t.strength === "not-started").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Learning analytics & insights</p>
      </motion.div>

      {topics.length === 0 ? (
        /* Empty state — NO navigation, just info */
        <motion.div variants={item} className="bg-card rounded-2xl p-8 shadow-card text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <BarChart3 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">No progress data yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your learning analytics will appear here once you start studying topics, taking quizzes, or reviewing flashcards.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Stat Cards */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Brain, label: "Mastery", value: `${overallProgress}%`, gradient: "gradient-primary" },
              { icon: Target, label: "Topics", value: `${topics.length}`, gradient: "gradient-success" },
              { icon: TrendingUp, label: "Strong", value: `${strongCount}`, gradient: "gradient-warm" },
              { icon: Clock, label: "Weak", value: `${weakCount}`, gradient: "gradient-primary" },
              { icon: Flame, label: "Streak", value: `${streakDays}d`, gradient: "gradient-warm" },
              { icon: CheckCircle2, label: "Accuracy", value: totalAttempted > 0 ? `${accuracy}%` : "—", gradient: "gradient-success" },
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

          {/* Quiz / Flashcard Accuracy */}
          {totalAttempted > 0 && (
            <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
              <h2 className="text-sm font-semibold text-foreground mb-3">Quiz & Flashcard Accuracy</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-foreground">{totalCorrect} correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-foreground">{totalAttempted - totalCorrect} incorrect</span>
                </div>
                <span className="ml-auto text-sm font-bold text-primary">{accuracy}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
                <motion.div
                  className="h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${accuracy}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </motion.div>
          )}

          {/* Topic Breakdown */}
          <motion.div variants={item} className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Topic Breakdown</h2>
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
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-4 pt-3 space-y-2">
                          {t.subtopics.length > 0 ? (
                            t.subtopics.map((sub) => (
                              <div key={sub.name} className="flex items-center gap-3 pl-6">
                                <span className="text-sm">{sub.status === "done" ? "✅" : sub.status === "weak" ? "⚠️" : "⬜"}</span>
                                <span className="text-sm text-foreground flex-1">{sub.name}</span>
                                <span className="text-[10px] text-muted-foreground">{sub.mastery}%</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground pl-6">No subtopics tracked yet</p>
                          )}
                          {/* Optional: user-initiated navigation */}
                          <button
                            onClick={() => navigate(`/study/${encodeURIComponent(t.name)}`)}
                            className="text-xs text-primary hover:underline mt-2 pl-6"
                          >
                            Study this topic →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Progress;
