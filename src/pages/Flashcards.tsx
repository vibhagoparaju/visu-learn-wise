import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ThumbsUp, ThumbsDown, Plus, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { streamChat } from "@/services/ai";
import { awardFlashcardXP } from "@/services/xpService";
import { toast } from "sonner";
import EmptyState from "@/components/study/EmptyState";
import { sanitizeTopicInput, checkRateLimit } from "@/lib/security";

interface Flashcard {
  id: string;
  topic: string;
  front: string;
  back: string;
  difficulty: number;
  next_review_at: string;
  review_count: number;
}

const Flashcards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchCards();
  }, [user]);

  const fetchCards = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user!.id)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at")
      .limit(50);
    setCards((data as Flashcard[]) || []);
    setCurrentIdx(0);
    setFlipped(false);
    setLoading(false);
  };

  const handleReview = async (correct: boolean) => {
    const card = cards[currentIdx];
    if (!card) return;

    const newDifficulty = correct
      ? Math.max(0, card.difficulty - 1)
      : Math.min(5, card.difficulty + 1);
    const intervalMinutes = correct
      ? Math.pow(2, 3 - newDifficulty) * 60 * 24
      : 10;
    const nextReview = new Date(Date.now() + intervalMinutes * 60000).toISOString();

    await supabase
      .from("flashcards")
      .update({
        difficulty: newDifficulty,
        next_review_at: nextReview,
        review_count: card.review_count + 1,
      })
      .eq("id", card.id);

    // Award XP for flashcard review
    if (user) {
      awardFlashcardXP(user.id).catch(console.error);
    }

    setFlipped(false);
    if (currentIdx < cards.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      toast.success("All cards reviewed! 🎉");
      fetchCards();
    }
  };

  const deleteCard = async (id: string) => {
    await supabase.from("flashcards").delete().eq("id", id);
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (currentIdx >= cards.length - 1) setCurrentIdx(Math.max(0, currentIdx - 1));
    setFlipped(false);
  };

  const generateCards = async () => {
    const sanitizedTopic = sanitizeTopicInput(genTopic);
    if (!sanitizedTopic || !user) return;

    if (!checkRateLimit("flashcard-gen", 5, 60000)) {
      toast.error("Too many requests. Please wait a moment.");
      return;
    }

    setGenerating(true);

    let content = "";
    await streamChat({
      messages: [
        {
          role: "user",
          content: `Generate exactly 5 flashcards about "${genTopic}". Return ONLY a JSON array with objects having "front" (question) and "back" (answer) keys. No markdown, no code blocks, just the raw JSON array.`,
        },
      ],
      mode: "chat",
      difficulty: "beginner",
      onDelta: (d) => (content += d),
      onDone: async () => {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (!jsonMatch) throw new Error("No JSON found");
          const parsed = JSON.parse(jsonMatch[0]) as { front: string; back: string }[];
          const inserts = parsed.map((c) => ({
            user_id: user.id,
            topic: genTopic.trim(),
            front: c.front,
            back: c.back,
          }));
          await supabase.from("flashcards").insert(inserts);
          toast.success(`${parsed.length} flashcards created!`);
          setGenTopic("");
          fetchCards();
        } catch {
          toast.error("Failed to parse AI response");
        }
        setGenerating(false);
      },
      onError: (e) => {
        toast.error(e);
        setGenerating(false);
      },
    });
  };

  const card = cards[currentIdx];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
        <p className="text-sm text-muted-foreground mt-1">Quick revision with spaced repetition 🧠</p>
      </div>

      {/* Generate Cards */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Generate AI Flashcards</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={genTopic}
            onChange={(e) => setGenTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateCards()}
            placeholder="Enter a topic..."
            className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="gradient"
            size="sm"
            onClick={generateCards}
            disabled={generating || !genTopic.trim()}
            className="rounded-xl px-4"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          emoji="🃏"
          title="No flashcards to review"
          description="Generate flashcards from any topic using AI, or come back when cards are due for review."
          actions={[]}
        />
      ) : (
        <>
          {/* Card Counter */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Card {currentIdx + 1} of {cards.length}
            </span>
            <span className="text-xs text-muted-foreground">{card?.topic}</span>
          </div>

          {/* Flashcard */}
          <div className="relative" style={{ perspective: "1000px" }}>
            <motion.div
              onClick={() => setFlipped(!flipped)}
              className="cursor-pointer"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className={`bg-card rounded-2xl shadow-elevated p-8 min-h-[250px] flex flex-col items-center justify-center text-center ${
                  flipped ? "invisible" : ""
                }`}
              >
                <span className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Question</span>
                <p className="text-lg font-semibold text-foreground leading-relaxed">{card?.front}</p>
                <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
              </div>

              <div
                className={`absolute inset-0 bg-card rounded-2xl shadow-elevated p-8 min-h-[250px] flex flex-col items-center justify-center text-center ${
                  !flipped ? "invisible" : ""
                }`}
                style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
              >
                <span className="text-xs font-medium text-green-600 uppercase tracking-wider mb-3">Answer</span>
                <p className="text-lg font-semibold text-foreground leading-relaxed">{card?.back}</p>
              </div>
            </motion.div>
          </div>

          {/* Review Buttons */}
          {flipped && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleReview(false)}
                className="flex-1 rounded-xl h-12 border-red-200 text-red-600 hover:bg-red-50"
              >
                <ThumbsDown className="h-4 w-4 mr-2" /> Didn't know
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReview(true)}
                className="flex-1 rounded-xl h-12 border-green-200 text-green-600 hover:bg-green-50"
              >
                <ThumbsUp className="h-4 w-4 mr-2" /> Got it!
              </Button>
            </motion.div>
          )}

          {/* Delete */}
          {card && (
            <button
              onClick={() => deleteCard(card.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors mx-auto"
            >
              <Trash2 className="h-3 w-3" /> Remove card
            </button>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Flashcards;
