import { motion, AnimatePresence } from "framer-motion";
import { Clock, BookOpen, MessageSquare, ArrowRight, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/study/EmptyState";
import { Helmet } from "react-helmet-async";

interface HistoryDoc {
  id: string;
  file_name: string;
  topics: string[];
  summary: string | null;
  created_at: string;
}

interface HistoryConversation {
  id: string;
  title: string;
  created_at: string;
  lastMessage?: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const StudyHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"documents" | "conversations">("documents");
  const [docs, setDocs] = useState<HistoryDoc[]>([]);
  const [convos, setConvos] = useState<HistoryConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);
      const [docsRes, convosRes] = await Promise.all([
        supabase
          .from("documents")
          .select("id, file_name, topics, summary, created_at")
          .eq("user_id", user.id)
          .eq("status", "done")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("conversations")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (docsRes.data) {
        setDocs(docsRes.data.map((d) => ({
          ...d,
          topics: (d.topics as string[]) || [],
        })));
      }
      if (convosRes.data) setConvos(convosRes.data);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
      <Helmet><title>Study History · VISU</title></Helmet>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasData = docs.length > 0 || convos.length > 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Study History</h1>
        <p className="text-sm text-muted-foreground mt-1">Your past sessions and uploaded materials</p>
      </motion.div>

      {!hasData ? (
        <EmptyState
          icon={Clock}
          emoji="📜"
          title="No study history yet"
          description="Start studying or upload materials to build your history."
          actions={[
            { label: "Upload Material", onClick: () => navigate("/upload") },
            { label: "Ask AI", onClick: () => navigate("/study"), variant: "outline" },
          ]}
        />
      ) : (
        <>
          {/* Tabs */}
          <motion.div variants={item} className="flex gap-2 bg-muted rounded-xl p-1">
            {(["documents", "conversations"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-sm font-medium py-2 px-3 rounded-lg transition-all ${
                  tab === t ? "bg-card shadow-card text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "documents" ? "📄 Documents" : "💬 Conversations"}
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {tab === "documents" ? (
              <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {docs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet</p>
                ) : (
                  docs.map((doc) => (
                    <motion.div
                      key={doc.id}
                      variants={item}
                      className="bg-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground truncate">{doc.file_name}</p>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{formatDate(doc.created_at)}</span>
                          </div>
                          {doc.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.summary}</p>
                          )}
                          {doc.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {doc.topics.slice(0, 5).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => navigate(`/study/${encodeURIComponent(t)}`)}
                                  className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-accent text-accent-foreground border border-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                  {t}
                                  <ArrowRight className="h-2.5 w-2.5" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div key="convos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {convos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
                ) : (
                  convos.map((c) => (
                    <motion.div
                      key={c.id}
                      variants={item}
                      onClick={() => navigate("/study")}
                      className="bg-card rounded-2xl p-4 shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                          <MessageSquare className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{c.title || "Chat Session"}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

export default StudyHistory;
