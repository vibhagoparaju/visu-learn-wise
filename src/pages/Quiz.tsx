import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/services/ai";
import { useAuth } from "@/hooks/useAuth";
import { usePuppy } from "@/hooks/usePuppy";
import { awardQuizXP, trackQuizProgress } from "@/services/xpService";
import { toast } from "sonner";
import { sanitizeTopicInput, checkRateLimit } from "@/lib/security";
import { Helmet } from "react-helmet-async";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const Quiz = () => {
  const { profile, user } = useAuth();
  const { showMessage: showPuppy } = usePuppy();
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizDone, setQuizDone] = useState(false);

  const generateQuiz = async () => {
    const sanitizedTopic = sanitizeTopicInput(topic);
    if (!sanitizedTopic) return;

    if (!checkRateLimit("quiz", 5, 60000)) {
      toast.error("Too many quiz requests. Please wait a moment.");
      return;
    }

    setLoading(true);
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setQuizDone(false);
    setSelected(null);
    setShowResult(false);

    let content = "";
    await streamChat({
      messages: [
        {
          role: "user",
          content: `Generate exactly 5 MCQ questions about "${topic}". Return ONLY a JSON array. Each object must have: "question" (string), "options" (array of 4 strings), "correct" (index 0-3 of the correct answer), "explanation" (short explanation). No markdown, no code blocks, just the raw JSON array.`,
        },
      ],
      mode: "quiz",
      difficulty: profile?.difficulty_level || "beginner",
      onDelta: (d) => (content += d),
      onDone: () => {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (!jsonMatch) throw new Error("No JSON");
          const parsed = JSON.parse(jsonMatch[0]) as QuizQuestion[];
          setQuestions(parsed);
        } catch {
          toast.error("Failed to generate quiz. Try again.");
        }
        setLoading(false);
      },
      onError: (e) => {
        toast.error(e);
        setLoading(false);
      },
    });
  };

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === questions[currentQ].correct) {
      setScore((s) => s + 1);
      showPuppy("Correct! You're amazing! 🎉", "happy", 3000);
    } else {
      showPuppy("Don't worry, you'll get it next time! 💪", "encouraging", 3000);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setQuizDone(true);
      // Award XP and track progress on quiz completion
      if (user) {
        awardQuizXP(user.id, score, questions.length).catch(console.error);
        trackQuizProgress(user.id, topic, score, questions.length).catch(console.error);
      }
    }
  };

  const q = questions[currentQ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-8">
      <Helmet><title>Quiz · VISU</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quiz Mode</h1>
        <p className="text-sm text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes 🎯</p>
      </div>

      {/* Topic Input */}
      {questions.length === 0 && !loading && (
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Choose a topic</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
              placeholder="e.g., Photosynthesis, Newton's Laws..."
              className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button variant="gradient" onClick={generateQuiz} className="rounded-xl px-6">
              Start Quiz
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-card rounded-2xl p-10 shadow-card flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Generating quiz questions...</p>
        </div>
      )}

      {/* Quiz Card */}
      {q && !quizDone && !loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card rounded-2xl p-6 shadow-card space-y-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary bg-accent px-2.5 py-1 rounded-full">
                Question {currentQ + 1}/{questions.length}
              </span>
              <span className="text-xs text-muted-foreground">Score: {score}/{currentQ + (showResult ? 1 : 0)}</span>
            </div>

            <p className="text-base font-semibold text-foreground leading-relaxed">{q.question}</p>

            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                let style = "border-border bg-muted/50 hover:border-primary/30 hover:bg-accent";
                if (showResult) {
                  if (i === q.correct) style = "border-green-300 bg-green-50 dark:bg-green-950/30";
                  else if (i === selected && i !== q.correct) style = "border-red-300 bg-red-50 dark:bg-red-950/30";
                  else style = "border-border bg-muted/30 opacity-50";
                }
                return (
                  <motion.button
                    key={i}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(i)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${style}`}
                  >
                    <span className="h-7 w-7 rounded-lg bg-background flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 border border-border">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm text-foreground flex-1">{opt}</span>
                    {showResult && i === q.correct && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                    {showResult && i === selected && i !== q.correct && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                  </motion.button>
                );
              })}
            </div>

            {showResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className={`rounded-xl p-3 text-sm ${selected === q.correct ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"}`}>
                  {selected === q.correct ? "✅ Correct!" : "❌ Not quite."} {q.explanation}
                </div>
                <Button variant="gradient" className="w-full rounded-xl" onClick={nextQuestion}>
                  {currentQ < questions.length - 1 ? (
                    <>Next Question <ArrowRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    "See Results"
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Results */}
      {quizDone && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-8 shadow-elevated text-center space-y-4">
          <div className="text-5xl">{score >= 4 ? "🏆" : score >= 3 ? "🎯" : "📚"}</div>
          <h2 className="text-2xl font-bold text-foreground">
            {score}/{questions.length}
          </h2>
          <p className="text-sm text-muted-foreground">
            {score === questions.length
              ? "Perfect score! You're a master! 🔥"
              : score >= 3
              ? "Great job! Keep practicing! 💪"
              : "Keep studying, you'll get there! 📖"}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="gradient" className="rounded-full px-6" onClick={() => { setQuestions([]); setTopic(""); }}>
              New Quiz
            </Button>
            <Button variant="outline" className="rounded-full px-6" onClick={() => { setCurrentQ(0); setSelected(null); setShowResult(false); setScore(0); setQuizDone(false); }}>
              Retry
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Quiz;
