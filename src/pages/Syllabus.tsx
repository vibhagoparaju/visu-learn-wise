import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subject {
  name: string;
  icon: string;
  topicCount: number;
}

interface Chapter {
  number: number;
  name: string;
  description: string;
  topicCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface Topic {
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const SYLLABUS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-syllabus`;

const boards = [
  { id: "cbse", name: "CBSE", desc: "Central Board of Secondary Education" },
  { id: "icse", name: "ICSE", desc: "Indian Certificate of Secondary Education" },
  { id: "state", name: "State Board", desc: "State-level education boards" },
  { id: "university", name: "University", desc: "Higher education syllabus" },
  { id: "classical", name: "Classical Learning", desc: "Traditional texts & wisdom", icon: "📜" },
];

const gradesByBoard: Record<string, string[]> = {
  cbse: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
  icse: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
  state: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
  university: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
  classical: ["Beginner", "Intermediate", "Advanced"],
};

const classicalSubjects: Subject[] = [
  { name: "Ramayan", icon: "🏹", topicCount: 7 },
  { name: "Mahabharat", icon: "⚔️", topicCount: 18 },
  { name: "Bhagavad Gita", icon: "🙏", topicCount: 18 },
  { name: "Vedic Mathematics", icon: "🔢", topicCount: 10 },
  { name: "Ancient Indian Science", icon: "🔬", topicCount: 8 },
  { name: "Sanskrit Literature", icon: "📖", topicCount: 6 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type Step = "board" | "grade" | "subject" | "chapter" | "topic";

const Syllabus = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>("board");
  const [selectedBoard, setSelectedBoard] = useState(profile?.selected_board || "");
  const [selectedGrade, setSelectedGrade] = useState(profile?.selected_grade || "");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (profile?.selected_board && profile?.selected_grade) {
      setSelectedBoard(profile.selected_board);
      setSelectedGrade(profile.selected_grade);
      setStep("subject");
      fetchSubjects(profile.selected_board, profile.selected_grade);
    }
  }, [profile?.selected_board, profile?.selected_grade]);

  const savePreference = async (board: string, grade: string) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ selected_board: board, selected_grade: grade })
      .eq("id", user.id);
    refreshProfile();
  };

  const fetchData = async (body: Record<string, string>) => {
    const resp = await fetch(SYLLABUS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error((await resp.json().catch(() => ({}))).error || "Failed");
    return resp.json();
  };

  const fetchSubjects = async (board: string, grade: string) => {
    if (board === "classical") {
      setSubjects(classicalSubjects);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchData({ board, grade });
      setSubjects(data.subjects || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (subject: string) => {
    setLoading(true);
    try {
      const data = await fetchData({ board: selectedBoard, grade: selectedGrade, subject });
      setChapters(data.chapters || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (chapter: string) => {
    setLoading(true);
    try {
      const data = await fetchData({ board: selectedBoard, grade: selectedGrade, subject: selectedSubject, chapter });
      setTopics(data.topics || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const selectBoard = (boardId: string) => {
    setSelectedBoard(boardId);
    setStep("grade");
  };

  const selectGrade = (grade: string) => {
    setSelectedGrade(grade);
    savePreference(selectedBoard, grade);
    setStep("subject");
    fetchSubjects(selectedBoard, grade);
  };

  const selectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setStep("chapter");
    fetchChapters(subject);
  };

  const selectChapter = (chapter: string) => {
    setSelectedChapter(chapter);
    setStep("topic");
    fetchTopics(chapter);
  };

  const studyTopic = (topicName: string) => {
    navigate(`/study/${encodeURIComponent(topicName)}`);
  };

  const goBack = () => {
    setSearchQuery("");
    if (step === "topic") { setStep("chapter"); setTopics([]); }
    else if (step === "chapter") { setStep("subject"); setChapters([]); }
    else if (step === "subject") { setStep("grade"); setSubjects([]); }
    else if (step === "grade") setStep("board");
  };

  const boardInfo = boards.find((b) => b.id === selectedBoard);

  const getTitle = () => {
    switch (step) {
      case "board": return "Choose Your Board";
      case "grade": return boardInfo?.name || "";
      case "subject": return `${boardInfo?.name} · ${selectedGrade}`;
      case "chapter": return selectedSubject;
      case "topic": return selectedChapter;
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "board": return "Select your education board or learning path";
      case "grade": return "Select your class or level";
      case "subject": return "Choose a subject to explore";
      case "chapter": return `${boardInfo?.name} · ${selectedGrade} · Chapters`;
      case "topic": return `${selectedSubject} · Subtopics`;
    }
  };

  const getLoadingText = () => {
    switch (step) {
      case "subject": return "Generating syllabus…";
      case "chapter": return "Loading chapters…";
      case "topic": return "Loading subtopics…";
      default: return "Loading…";
    }
  };

  // Filtering
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredChapters = chapters.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showSearch = ["subject", "chapter", "topic"].includes(step) && !loading;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5 pb-24 md:pb-8"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center gap-3">
        {step !== "board" && (
          <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{getSubtitle()}</p>
        </div>
      </motion.div>

      {/* Search */}
      {showSearch && (
        <motion.div variants={item} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${step === "subject" ? "subjects" : step === "chapter" ? "chapters" : "topics"}...`}
            className="w-full bg-card rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">{getLoadingText()}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Board Selection */}
        {step === "board" && (
          <motion.div key="board" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid gap-3">
            {boards.map((board) => (
              <motion.button
                key={board.id}
                variants={item}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectBoard(board.id)}
                className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-card border border-border hover:border-primary/30 transition-all text-left"
              >
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-2xl flex-shrink-0">
                  {board.icon || <GraduationCap className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{board.name}</p>
                  <p className="text-xs text-muted-foreground">{board.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Grade Selection */}
        {step === "grade" && (
          <motion.div key="grade" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(gradesByBoard[selectedBoard] || []).map((grade) => (
              <motion.button
                key={grade}
                variants={item}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectGrade(grade)}
                className="bg-card rounded-xl p-4 shadow-card border border-border hover:border-primary/30 transition-all text-center"
              >
                <p className="text-sm font-semibold text-foreground">{grade}</p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Subject Selection */}
        {step === "subject" && !loading && (
          <motion.div key="subject" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
            {filteredSubjects.map((subject) => (
              <motion.button
                key={subject.name}
                variants={item}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectSubject(subject.name)}
                className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 shadow-card border border-border hover:border-primary/30 transition-all"
              >
                <span className="text-3xl">{subject.icon}</span>
                <p className="text-sm font-semibold text-foreground text-center">{subject.name}</p>
                <p className="text-xs text-muted-foreground">{subject.topicCount} chapters</p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Chapter Selection */}
        {step === "chapter" && !loading && (
          <motion.div key="chapter" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-2">
            {filteredChapters.map((ch) => (
              <motion.button
                key={ch.name}
                variants={item}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectChapter(ch.name)}
                className="w-full flex items-center gap-3 bg-card rounded-xl p-3.5 shadow-card border border-border hover:border-primary/30 transition-all text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {ch.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{ch.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{ch.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${difficultyColors[ch.difficulty] || ""}`}>
                    {ch.difficulty}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{ch.topicCount} topics</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Topic Selection */}
        {step === "topic" && !loading && (
          <motion.div key="topic" variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }} className="space-y-2">
            {filteredTopics.map((topic, idx) => (
              <motion.button
                key={topic.name}
                variants={item}
                whileTap={{ scale: 0.98 }}
                onClick={() => studyTopic(topic.name)}
                className="w-full flex items-center gap-3 bg-card rounded-xl p-3.5 shadow-card border border-border hover:border-primary/30 transition-all text-left"
              >
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{topic.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{topic.description}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${difficultyColors[topic.difficulty] || ""}`}>
                  {topic.difficulty}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Board Button */}
      {step === "subject" && !loading && (
        <motion.div variants={item} className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStep("board"); setSubjects([]); setSearchQuery(""); }}
            className="text-xs text-muted-foreground"
          >
            <GraduationCap className="h-3 w-3 mr-1" />
            Change board / level
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Syllabus;
