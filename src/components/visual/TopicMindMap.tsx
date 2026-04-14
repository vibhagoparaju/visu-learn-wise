import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Zap } from "lucide-react";

interface TopicData {
  topic: string;
  mastery_pct: number | null;
  strength: string | null;
  last_studied_at: string | null;
}

interface Props {
  topics: TopicData[];
  documents: any[];
  onStudyTopic: (topic: string) => void;
}

const strengthColor = (strength: string | null, mastery: number | null) => {
  const pct = mastery ?? 0;
  if (pct >= 70) return "border-green-400 bg-green-50 dark:bg-green-950/30";
  if (pct >= 40) return "border-amber-400 bg-amber-50 dark:bg-amber-950/30";
  return "border-red-300 bg-red-50 dark:bg-red-950/30";
};

const strengthDot = (mastery: number | null) => {
  const pct = mastery ?? 0;
  if (pct >= 70) return "bg-green-400";
  if (pct >= 40) return "bg-amber-400";
  return "bg-red-400";
};

const TopicMindMap = ({ topics, documents, onStudyTopic }: Props) => {
  // Extract document topics too
  const allTopics = useMemo(() => {
    const topicSet = new Map<string, TopicData>();
    topics.forEach((t) => topicSet.set(t.topic, t));
    documents.forEach((doc) => {
      const docTopics = (doc.topics as string[]) || [];
      docTopics.forEach((dt) => {
        if (!topicSet.has(dt)) {
          topicSet.set(dt, { topic: dt, mastery_pct: null, strength: "not-started", last_studied_at: null });
        }
      });
    });
    return Array.from(topicSet.values());
  }, [topics, documents]);

  if (allTopics.length === 0) {
    return (
      <div className="text-center py-16">
        <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No topics yet</h3>
        <p className="text-sm text-muted-foreground">Upload documents or study to build your mind map</p>
      </div>
    );
  }

  // Group by mastery level
  const strong = allTopics.filter((t) => (t.mastery_pct ?? 0) >= 70);
  const learning = allTopics.filter((t) => (t.mastery_pct ?? 0) >= 20 && (t.mastery_pct ?? 0) < 70);
  const fresh = allTopics.filter((t) => (t.mastery_pct ?? 0) < 20);

  return (
    <div className="space-y-8">
      {/* Visual Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400" /> Strong</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Learning</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /> New / Weak</span>
      </div>

      {/* Central Node */}
      <div className="relative">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Brain className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>

        {/* Branches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Mastered", items: strong, accent: "green" },
            { label: "In Progress", items: learning, accent: "amber" },
            { label: "Explore", items: fresh, accent: "red" },
          ].map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full bg-${group.accent}-400`} />
                {group.label}
                <span className="text-muted-foreground font-normal">({group.items.length})</span>
              </h3>
              {group.items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-3">No topics here yet</p>
              ) : (
                <div className="space-y-2">
                  {group.items.map((t, i) => (
                    <motion.button
                      key={t.topic}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => onStudyTopic(t.topic)}
                      className={`w-full text-left p-3 rounded-xl border-2 ${strengthColor(t.strength, t.mastery_pct)} transition-all hover:shadow-md group`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${strengthDot(t.mastery_pct)}`} />
                          <span className="text-sm font-medium text-foreground truncate">{t.topic}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {t.mastery_pct != null && (
                            <span className="text-xs text-muted-foreground">{t.mastery_pct}%</span>
                          )}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (t.mastery_pct ?? 0) >= 70 ? "bg-green-400" : (t.mastery_pct ?? 0) >= 40 ? "bg-amber-400" : "bg-red-400"
                          }`}
                          style={{ width: `${t.mastery_pct ?? 0}%` }}
                        />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connection hints */}
      {allTopics.length >= 2 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Topic Connections</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            You have {allTopics.length} topics across {documents.length} documents.
            {strong.length > 0 && ` ${strong.length} topics mastered.`}
            {fresh.length > 0 && ` ${fresh.length} topics waiting to explore.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default TopicMindMap;
