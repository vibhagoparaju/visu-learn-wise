import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, MessageSquare, BookOpen, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  type: "topic" | "document" | "conversation";
  title: string;
  subtitle?: string;
  route: string;
}

const GlobalSearch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setActiveIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();
      const [docsRes, convosRes, progressRes] = await Promise.all([
        supabase.from("documents").select("id, file_name, topics").eq("user_id", user.id).eq("status", "done").limit(20),
        supabase.from("conversations").select("id, title").eq("user_id", user.id).limit(20),
        supabase.from("study_progress").select("topic, subtopic").eq("user_id", user.id).limit(50),
      ]);

      const r: SearchResult[] = [];

      progressRes.data?.forEach((p) => {
        if (p.topic.toLowerCase().includes(q) || p.subtopic?.toLowerCase().includes(q)) {
          r.push({ type: "topic", title: p.topic, subtitle: p.subtopic || undefined, route: `/study/${encodeURIComponent(p.topic)}` });
        }
      });

      docsRes.data?.forEach((d) => {
        if (d.file_name.toLowerCase().includes(q)) {
          r.push({ type: "document", title: d.file_name, route: "/history" });
        }
        const topics = (d.topics as string[]) || [];
        topics.forEach((t) => {
          if (t.toLowerCase().includes(q)) {
            r.push({ type: "topic", title: t, subtitle: `From: ${d.file_name}`, route: `/study/${encodeURIComponent(t)}` });
          }
        });
      });

      convosRes.data?.forEach((c) => {
        if (c.title?.toLowerCase().includes(q)) {
          r.push({ type: "conversation", title: c.title || "Chat Session", route: "/study" });
        }
      });

      const seen = new Set<string>();
      const deduped = r.filter((item) => {
        const key = `${item.type}:${item.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 10);

      setResults(deduped);
      setActiveIdx(0);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, user]);

  // Group results by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = { topic: "Topics", document: "Documents", conversation: "Conversations" };
  const iconMap = { topic: BookOpen, document: FileText, conversation: MessageSquare };

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.route);
    setOpen(false);
    setQuery("");
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      handleSelect(results[activeIdx]);
    }
  };

  let flatIdx = -1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden md:inline-flex text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh]"
              onClick={() => setOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg mx-4 bg-card rounded-2xl shadow-elevated border border-border overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search topics, documents, conversations..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button onClick={() => setOpen(false)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {loading && (
                    <div className="flex items-center justify-center py-6">
                      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  )}
                  {!loading && query && results.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
                  )}
                  {!loading && Object.entries(grouped).map(([type, items]) => (
                    <div key={type} className="mb-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">
                        {typeLabels[type] || type}
                      </p>
                      {items.map((r) => {
                        flatIdx++;
                        const idx = flatIdx;
                        const Icon = iconMap[r.type as keyof typeof iconMap];
                        return (
                          <button
                            key={`${r.type}-${r.title}-${idx}`}
                            onClick={() => handleSelect(r)}
                            className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                              activeIdx === idx ? "bg-accent" : "hover:bg-accent"
                            }`}
                          >
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                              {r.subtitle && <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {!query && (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Type to search across your knowledge base
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default GlobalSearch;
