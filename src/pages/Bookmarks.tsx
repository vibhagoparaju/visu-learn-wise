import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, StickyNote, ArrowRight, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import EmptyState from "@/components/study/EmptyState";
import { toast } from "sonner";

interface BookmarkItem {
  id: string;
  topic: string;
  note: string | null;
  created_at: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Bookmarks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setBookmarks((data as BookmarkItem[]) || []);
    setLoading(false);
  };

  const addBookmark = async () => {
    if (!newTopic.trim() || !user) return;
    const { error } = await supabase
      .from("bookmarks")
      .insert({ user_id: user.id, topic: newTopic.trim() });
    if (error) {
      toast.error("Failed to add bookmark");
    } else {
      toast.success("Bookmarked!");
      setNewTopic("");
      setShowAdd(false);
      fetchBookmarks();
    }
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    toast.success("Bookmark removed");
  };

  const saveNote = async (id: string) => {
    await supabase.from("bookmarks").update({ note: noteText }).eq("id", id);
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, note: noteText } : b))
    );
    setAddingNote(null);
    setNoteText("");
    toast.success("Note saved!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bookmarks</h1>
          <p className="text-sm text-muted-foreground mt-1">Saved topics & personal notes 📌</p>
        </div>
        <Button
          variant="gradient"
          size="sm"
          className="rounded-full px-4"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl p-4 shadow-card"
          >
            <div className="flex gap-2">
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBookmark()}
                placeholder="Topic to bookmark..."
                className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button variant="gradient" size="sm" onClick={addBookmark} className="rounded-xl">
                Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          emoji="📌"
          title="No bookmarks yet"
          description="Save important topics for quick access and add personal notes."
          actions={[{ label: "Browse Topics", onClick: () => navigate("/progress") }]}
        />
      ) : (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <motion.div
              key={b.id}
              variants={item}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <Bookmark className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{b.topic}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/study/${encodeURIComponent(b.topic)}`)}
                        className="text-xs text-primary hover:underline flex items-center gap-0.5"
                      >
                        Study <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteBookmark(b.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {b.note && addingNote !== b.id && (
                    <p className="text-xs text-muted-foreground mt-1.5 bg-accent/50 rounded-lg px-3 py-2">{b.note}</p>
                  )}

                  {addingNote === b.id ? (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note..."
                        className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <Button size="sm" variant="ghost" onClick={() => saveNote(b.id)} className="text-xs h-7">
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingNote(null)} className="text-xs h-7">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingNote(b.id);
                        setNoteText(b.note || "");
                      }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary mt-1.5 transition-colors"
                    >
                      <StickyNote className="h-3 w-3" />
                      {b.note ? "Edit note" : "Add note"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Bookmarks;
