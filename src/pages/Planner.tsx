import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, Trash2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmptyState from "@/components/study/EmptyState";
import { Helmet } from "react-helmet-async";

interface ExamDeadline {
  id: string;
  title: string;
  subject: string | null;
  exam_date: string;
  notes: string | null;
  created_at: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const Planner = () => {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState<ExamDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchDeadlines();
  }, [user]);

  const fetchDeadlines = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exam_deadlines")
      .select("*")
      .eq("user_id", user!.id)
      .order("exam_date", { ascending: true });
    setDeadlines((data as ExamDeadline[]) || []);
    setLoading(false);
  };

  const addDeadline = async () => {
    if (!title.trim() || !examDate || !user) return;
    const { error } = await supabase.from("exam_deadlines").insert({
      user_id: user.id,
      title: title.trim(),
      subject: subject.trim() || null,
      exam_date: examDate,
      notes: notes.trim() || null,
    });
    if (error) {
      toast.error("Failed to add deadline");
    } else {
      toast.success("Deadline added");
      setTitle("");
      setSubject("");
      setExamDate("");
      setNotes("");
      setShowAdd(false);
      fetchDeadlines();
    }
  };

  const deleteDeadline = async (id: string) => {
    await supabase.from("exam_deadlines").delete().eq("id", id);
    setDeadlines((prev) => prev.filter((d) => d.id !== id));
    toast.success("Deadline removed");
  };

  const getDaysLeft = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    return diff;
  };

  const getUrgencyStyle = (days: number) => {
    if (days < 0) return "text-muted-foreground";
    if (days <= 3) return "text-destructive font-bold";
    if (days <= 7) return "text-warning font-semibold";
    return "text-muted-foreground";
  };

  // Group deadlines by week
  const upcoming = deadlines.filter((d) => getDaysLeft(d.exam_date) >= 0);
  const past = deadlines.filter((d) => getDaysLeft(d.exam_date) < 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
      <Helmet><title>Planner · VISU</title></Helmet>
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">Exam deadlines & schedule</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full px-4"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? <X className="h-4 w-4" /> : <><Plus className="h-4 w-4 mr-1" /> Add Exam</>}
        </Button>
      </motion.div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl p-5 shadow-card space-y-3"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Exam or deadline title..."
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (optional)"
                className="bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              variant="default"
              size="sm"
              className="rounded-xl w-full"
              onClick={addDeadline}
              disabled={!title.trim() || !examDate}
            >
              Save Deadline
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming */}
      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={Calendar}
          emoji="📅"
          title="No exams scheduled"
          description="Add your upcoming exams and deadlines to stay organized."
          actions={[{ label: "Add Exam", onClick: () => setShowAdd(true) }]}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <motion.div variants={item} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
              {upcoming.map((d) => {
                const days = getDaysLeft(d.exam_date);
                return (
                  <motion.div
                    key={d.id}
                    variants={item}
                    className="bg-card rounded-2xl p-4 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${days <= 3 ? "bg-destructive/10" : "bg-accent"}`}>
                        {days <= 3 ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Calendar className="h-5 w-5 text-accent-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">{d.title}</p>
                          <button
                            onClick={() => deleteDeadline(d.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {d.subject && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                              {d.subject}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(d.exam_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <p className={`text-xs mt-1.5 ${getUrgencyStyle(days)}`}>
                          {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `${days} days left`}
                        </p>
                        {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {past.length > 0 && (
            <motion.div variants={item} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Past</h2>
              {past.map((d) => (
                <motion.div
                  key={d.id}
                  variants={item}
                  className="bg-card rounded-2xl p-4 shadow-card opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground line-through">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.exam_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDeadline(d.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Planner;
