import { useState } from "react";
import { motion } from "framer-motion";
import { FileImage, Loader2, Sparkles, BookOpen, Target, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/services/ai";
import ReactMarkdown from "react-markdown";

interface TopicData {
  topic: string;
  mastery_pct: number | null;
  strength: string | null;
}

interface Props {
  topics: TopicData[];
  onStudyTopic: (topic: string) => void;
}

interface InfographicData {
  topic: string;
  summary: string;
  keyPoints: string[];
  example: string;
  difficulty: string;
}

const InfographicLesson = ({ topics, onStudyTopic }: Props) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [infographic, setInfographic] = useState<InfographicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [rawContent, setRawContent] = useState("");

  const generateInfographic = async (topic: string) => {
    setSelectedTopic(topic);
    setLoading(true);
    setRawContent("");
    setInfographic(null);

    let result = "";
    await streamChat({
      messages: [
        {
          role: "user",
          content: `Create a visual-friendly infographic summary for the topic "${topic}". Return ONLY a JSON object with these keys:
- "summary": a 2-sentence overview
- "keyPoints": array of exactly 4 short bullet points (max 12 words each)
- "example": a real-world example in 1-2 sentences
- "difficulty": one of "Beginner", "Intermediate", "Advanced"

No markdown, no code blocks, just raw JSON.`,
        },
      ],
      mode: "chat",
      difficulty: "beginner",
      onDelta: (d) => {
        result += d;
        setRawContent(result);
      },
      onDone: () => {
        try {
          const match = result.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("No JSON");
          const parsed = JSON.parse(match[0]);
          setInfographic({ topic, ...parsed });
        } catch {
          setInfographic(null);
        }
        setLoading(false);
      },
      onError: () => setLoading(false),
    });
  };

  if (topics.length === 0) {
    return (
      <div className="text-center py-16">
        <FileImage className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No topics available</h3>
        <p className="text-sm text-muted-foreground">Study some topics first to generate infographics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topic selector */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Choose a topic to visualize</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t.topic}
              onClick={() => generateInfographic(t.topic)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedTopic === t.topic
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-accent"
              }`}
            >
              {t.topic}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Generating infographic...</p>
          </div>
        </div>
      )}

      {/* Infographic display */}
      {infographic && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-card to-accent/30 border border-border rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary/10 px-6 py-5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-foreground">{infographic.topic}</h2>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {infographic.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-4 border-b border-border/30">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{infographic.summary}</p>
            </div>
          </div>

          {/* Key Points */}
          <div className="px-6 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Key Points</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {infographic.keyPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 bg-background/50 rounded-lg p-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{point}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Example */}
          <div className="px-6 py-4 border-b border-border/30">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Real-World Example</h4>
                <p className="text-sm text-muted-foreground">{infographic.example}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 py-4">
            <Button
              onClick={() => onStudyTopic(infographic.topic)}
              className="w-full rounded-xl"
              variant="default"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Deep dive into {infographic.topic}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InfographicLesson;
