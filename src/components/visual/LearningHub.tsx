import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Play, BookOpen, ExternalLink, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

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

const LearningHub = ({ topics, documents, onStudyTopic }: Props) => {
  const navigate = useNavigate();

  const recentDocs = documents.slice(0, 6);
  const weakTopics = useMemo(
    () => topics.filter((t) => (t.mastery_pct ?? 0) < 50).sort((a, b) => (a.mastery_pct ?? 0) - (b.mastery_pct ?? 0)).slice(0, 6),
    [topics]
  );
  const recentlyStudied = useMemo(
    () => topics.filter((t) => t.last_studied_at).sort((a, b) => new Date(b.last_studied_at!).getTime() - new Date(a.last_studied_at!).getTime()).slice(0, 6),
    [topics]
  );

  return (
    <div className="space-y-8">
      {/* Recently Studied */}
      {recentlyStudied.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Recently Studied
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyStudied.map((t, i) => (
              <motion.button
                key={t.topic}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onStudyTopic(t.topic)}
                className="text-left p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.last_studied_at && formatDistanceToNow(new Date(t.last_studied_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Topics to Improve */}
      {weakTopics.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Topics to Improve
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weakTopics.map((t, i) => (
              <motion.button
                key={t.topic}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onStudyTopic(t.topic)}
                className="text-left p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">{t.topic}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{t.mastery_pct ?? 0}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${t.mastery_pct ?? 0}%` }} />
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Documents */}
      {recentDocs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Your Documents
            </h3>
            <button
              onClick={() => navigate("/upload")}
              className="text-xs text-primary font-medium hover:underline"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.created_at && formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {doc.topics && (doc.topics as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {(doc.topics as string[]).slice(0, 3).map((topic: string) => (
                      <button
                        key={topic}
                        onClick={() => onStudyTopic(topic)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {topics.length === 0 && documents.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Your Learning Hub is empty</h3>
          <p className="text-sm text-muted-foreground">Upload documents or start studying to populate your hub</p>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
