import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, TrendingUp, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

const cardGradients = [
  "from-amber-100 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20",
  "from-emerald-100 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20",
  "from-sky-100 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/20",
  "from-violet-100 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/20",
  "from-rose-100 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/20",
  "from-lime-100 to-green-50 dark:from-lime-950/40 dark:to-green-950/20",
];

const TopicCards = ({ topics, documents, onStudyTopic }: Props) => {
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
        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No topics to display</h3>
        <p className="text-sm text-muted-foreground">Start studying or upload notes to see visual topic cards</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {allTopics.map((t, i) => (
        <motion.button
          key={t.topic}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          onClick={() => onStudyTopic(t.topic)}
          className={`group text-left p-5 rounded-2xl bg-gradient-to-br ${
            cardGradients[i % cardGradients.length]
          } border border-border/50 hover:shadow-lg transition-all hover:-translate-y-0.5`}
        >
          {/* Topic icon */}
          <div className="h-10 w-10 rounded-xl bg-background/60 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          {/* Topic name */}
          <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2">{t.topic}</h3>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {t.mastery_pct != null && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {t.mastery_pct}% mastery
              </span>
            )}
            {t.last_studied_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(t.last_studied_at), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Mastery bar */}
          <div className="mt-3 h-1.5 bg-background/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/70 transition-all"
              style={{ width: `${t.mastery_pct ?? 0}%` }}
            />
          </div>

          {/* CTA */}
          <div className="mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Study this topic →
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default TopicCards;
