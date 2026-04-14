import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RetainPanelProps {
  content: string;
  onRetain: (content: string) => Promise<void>;
}

function extractKeyPoints(content: string): string[] {
  const clean = content.replace(/#{1,3}\s*/g, "").replace(/\*\*/g, "");
  
  // Try bullet points first
  const bullets = clean.match(/^[-*•]\s+.+/gm);
  if (bullets && bullets.length >= 2) {
    return bullets.slice(0, 6).map((b) => b.replace(/^[-*•]\s+/, "").trim());
  }
  
  // Try numbered items
  const numbered = clean.match(/^\d+\.\s+.+/gm);
  if (numbered && numbered.length >= 2) {
    return numbered.slice(0, 6).map((n) => n.replace(/^\d+\.\s+/, "").trim());
  }
  
  // Fall back to sentences
  const sentences = clean
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 200);
  
  return sentences.slice(0, 5);
}

const RetainPanel = ({ content, onRetain }: RetainPanelProps) => {
  const [isRetaining, setIsRetaining] = useState(false);
  const [retained, setRetained] = useState(false);
  const keyPoints = extractKeyPoints(content);

  const handleRetain = async () => {
    setIsRetaining(true);
    try {
      await onRetain(content);
      setRetained(true);
    } catch {
      // error handled upstream
    } finally {
      setIsRetaining(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Key concepts to retain
        </span>
      </div>

      <ul className="space-y-1.5">
        {keyPoints.map((point, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-2 text-sm text-foreground/85"
          >
            <Sparkles className="h-3 w-3 text-primary/60 mt-1 flex-shrink-0" />
            <span>{point}</span>
          </motion.li>
        ))}
      </ul>

      <Button
        onClick={handleRetain}
        disabled={isRetaining || retained}
        size="sm"
        className="w-full rounded-lg"
        variant={retained ? "outline" : "default"}
      >
        {retained ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Flashcards saved
          </>
        ) : isRetaining ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Creating flashcards...
          </>
        ) : (
          <>
            <Brain className="h-3.5 w-3.5 mr-1.5" />
            Retain as flashcards
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default RetainPanel;
