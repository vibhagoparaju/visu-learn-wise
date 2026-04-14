import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileImage,
  Loader2,
  Sparkles,
  BookOpen,
  Target,
  Lightbulb,
  CheckCircle2,
  Image as ImageIcon,
  GitBranch,
  LayoutGrid,
  Paintbrush,
  ArrowLeftRight,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TopicData {
  topic: string;
  mastery_pct: number | null;
  strength: string | null;
}

interface Props {
  topics: TopicData[];
  onStudyTopic: (topic: string) => void;
}

type VisualStyle = "diagram" | "flowchart" | "mindmap" | "illustration" | "comparison";

const styleOptions: { id: VisualStyle; label: string; icon: any; desc: string }[] = [
  { id: "diagram", label: "Diagram", icon: Target, desc: "Labeled diagrams" },
  { id: "flowchart", label: "Flowchart", icon: GitBranch, desc: "Process flows" },
  { id: "mindmap", label: "Mind Map", icon: LayoutGrid, desc: "Branching concepts" },
  { id: "illustration", label: "Illustration", icon: Paintbrush, desc: "Visual explanation" },
  { id: "comparison", label: "Comparison", icon: ArrowLeftRight, desc: "Side-by-side" },
];

interface GeneratedVisual {
  topic: string;
  style: VisualStyle;
  imageUrl: string;
  description: string;
}

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-visual`;

const InfographicLesson = ({ topics, onStudyTopic }: Props) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<VisualStyle>("diagram");
  const [loading, setLoading] = useState(false);
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([]);
  const [activeVisual, setActiveVisual] = useState<GeneratedVisual | null>(null);

  const generateVisual = async (topic: string) => {
    setSelectedTopic(topic);
    setLoading(true);
    setActiveVisual(null);

    try {
      const resp = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic, style: selectedStyle }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      const visual: GeneratedVisual = {
        topic,
        style: selectedStyle,
        imageUrl: data.imageUrl,
        description: data.description,
      };
      setActiveVisual(visual);
      setVisuals((prev) => [visual, ...prev.filter((v) => !(v.topic === topic && v.style === selectedStyle))]);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate visual");
    } finally {
      setLoading(false);
    }
  };

  if (topics.length === 0) {
    return (
      <div className="text-center py-16">
        <FileImage className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-1">No topics available</h3>
        <p className="text-sm text-muted-foreground">Study some topics first to generate visual explanations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topic selector */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Choose a topic</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t.topic}
              onClick={() => setSelectedTopic(t.topic)}
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

      {/* Style selector */}
      {selectedTopic && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-semibold text-foreground mb-3">Visual style</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {styleOptions.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedStyle === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Generate button */}
          <Button
            onClick={() => generateVisual(selectedTopic)}
            disabled={loading}
            className="mt-4 rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Visual Explanation
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-8 text-center"
        >
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-2xl gradient-primary opacity-20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">Creating your visual explanation...</p>
          <p className="text-xs text-muted-foreground mt-1">AI is generating a {selectedStyle} for "{selectedTopic}"</p>
        </motion.div>
      )}

      {/* Active Visual */}
      {activeVisual && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{activeVisual.topic}</h3>
                <p className="text-xs text-muted-foreground capitalize">{activeVisual.style} view</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => generateVisual(activeVisual.topic)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="p-4">
            <img
              src={activeVisual.imageUrl}
              alt={`Visual explanation of ${activeVisual.topic}`}
              className="w-full rounded-xl border border-border/50 shadow-sm"
            />
          </div>

          {/* Description */}
          {activeVisual.description && (
            <div className="px-5 py-3 border-t border-border/30">
              <p className="text-sm text-muted-foreground leading-relaxed">{activeVisual.description}</p>
            </div>
          )}

          {/* CTA */}
          <div className="px-5 py-4 border-t border-border/30">
            <Button
              onClick={() => onStudyTopic(activeVisual.topic)}
              className="w-full rounded-xl"
              variant="default"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Study {activeVisual.topic} in depth
            </Button>
          </div>
        </motion.div>
      )}

      {/* History of generated visuals */}
      {visuals.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Previously Generated</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visuals.slice(1, 7).map((v, i) => (
              <motion.button
                key={`${v.topic}-${v.style}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveVisual(v)}
                className="text-left rounded-xl border border-border overflow-hidden hover:shadow-md transition-all bg-card group"
              >
                <img
                  src={v.imageUrl}
                  alt={v.topic}
                  className="w-full h-24 object-cover"
                />
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate">{v.topic}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{v.style}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfographicLesson;
