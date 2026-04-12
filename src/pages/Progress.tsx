import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Brain, Target, Clock, ChevronRight, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/study/EmptyState";

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
  subtopics: { name: string; status: "done" | "weak" | "not-started"; mastery: number }[];
}

const strengthConfig = {
  strong: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  moderate: { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-500" },
  weak: { color: "text-red-500", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  "not-started": { color: "text-muted-foreground", bg: "bg-muted", border: "border-border", dot: "bg-muted-foreground" },
};

const subtopicStatusConfig = {
  done: { label: "✅" },
  weak: { label: "⚠️" },
  "not-started": { label: "⬜" },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Progress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [topics, setTopics] = useState<GroupedTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("study_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("topic");

      if (data && data.length > 0) {
        // Group by topic
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

          const subtopics = rows
            .filter((r) => r.subtopic)
            .map((r) => ({
              name: r.subtopic!,
              status: (r.mastery_pct >= 75 ? "done" : r.mastery_pct >= 30 ? "weak" : "not-started") as "done" | "weak" | "not-started",
              mastery: r.mastery_pct,
            }));

          return { name, progress: avgMastery, strength, subtopics };
        });
        setTopics(grouped);
      } else {
        setTopics([]);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const overallProgress = topics.length > 0
    ? Math.round(topics.reduce((acc, t) => acc + t.progress, 0) / topics.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your learning journey</p>
        </motion.div>
        <EmptyState
          icon={BarChart3}
          emoji="📊"
          title="No progress yet"
          description="Start learning to track your growth. Upload content or chat with your AI tutor to begin."
          actions={[
            { label: "Upload Material", onClick: () => navigate("/upload") },
            { label: "Ask AI", onClick: () => navigate("/study"), variant: "outline" },
          ]}
        />
      </motion.div>
    );
  }

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
          { icon: TrendingUp, label: "Strong", value: `${topics.filter((t) => t.strength === "strong").length}`, gradient: "gradient-warm" },
          { icon: Clock, label: "Weak", value: `${topics.filter((t) => t.strength === "weak").length}`, gradient: "gradient-primary" },
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

      {/* Study Map */}
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
                {isExpanded && t.subtopics.length > 0 && (
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
                            <span className="text-sm text-foreground flex-1">{sub.name}</span>
                            <span className="text-[10px] text-muted-foreground">{sub.mastery}%</span>
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
