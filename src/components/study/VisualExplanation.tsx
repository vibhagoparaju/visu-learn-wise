import { motion } from "framer-motion";
import { ArrowDown, Lightbulb, Zap, BookOpen } from "lucide-react";

interface VisualStep {
  title: string;
  content: string;
  type: "concept" | "step" | "highlight";
}

function parseContentToSteps(content: string): VisualStep[] {
  const steps: VisualStep[] = [];
  
  // Split by markdown headers, bullet points, or numbered items
  const lines = content.split("\n").filter((l) => l.trim());
  let currentTitle = "";
  let currentContent = "";
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect headers
    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)/);
    if (headerMatch) {
      if (currentTitle || currentContent) {
        steps.push({
          title: currentTitle || "Key Point",
          content: currentContent.trim(),
          type: steps.length === 0 ? "concept" : "step",
        });
      }
      currentTitle = headerMatch[1].replace(/\*\*/g, "");
      currentContent = "";
      continue;
    }
    
    // Detect bold text as mini-headers
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*[:\s]*(.*)/);
    if (boldMatch && currentContent.length > 30) {
      if (currentTitle || currentContent) {
        steps.push({
          title: currentTitle || "Key Point",
          content: currentContent.trim(),
          type: "step",
        });
      }
      currentTitle = boldMatch[1];
      currentContent = boldMatch[2] || "";
      continue;
    }
    
    // Clean markdown formatting for display
    const cleaned = trimmed
      .replace(/^\*\*(.+?)\*\*/, "$1")
      .replace(/^[-*•]\s*/, "")
      .replace(/^\d+\.\s*/, "");
    
    currentContent += (currentContent ? "\n" : "") + cleaned;
  }
  
  if (currentTitle || currentContent) {
    steps.push({
      title: currentTitle || "Summary",
      content: currentContent.trim(),
      type: "highlight",
    });
  }
  
  // If we got too few steps, chunk the content
  if (steps.length <= 1 && content.length > 100) {
    const sentences = content
      .replace(/\*\*/g, "")
      .replace(/#{1,3}\s*/g, "")
      .split(/[.!?]\s+/)
      .filter((s) => s.trim().length > 10);
    
    const chunked: VisualStep[] = [];
    const chunkSize = Math.ceil(sentences.length / Math.min(4, Math.max(2, Math.ceil(sentences.length / 3))));
    
    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join(". ").trim();
      if (chunk) {
        chunked.push({
          title: i === 0 ? "What is it?" : i < sentences.length / 2 ? "How it works" : "Key takeaway",
          content: chunk + (chunk.endsWith(".") ? "" : "."),
          type: i === 0 ? "concept" : i === sentences.length - chunkSize ? "highlight" : "step",
        });
      }
    }
    if (chunked.length > 1) return chunked;
  }
  
  return steps.length > 0 ? steps : [{ title: "Overview", content: content.replace(/[#*_]/g, "").trim(), type: "concept" }];
}

const stepIcons = {
  concept: BookOpen,
  step: Zap,
  highlight: Lightbulb,
};

const stepColors = {
  concept: "bg-primary/10 border-primary/20 text-primary",
  step: "bg-accent border-border text-accent-foreground",
  highlight: "bg-success/10 border-success/20 text-success",
};

const VisualExplanation = ({ content }: { content: string }) => {
  const steps = parseContentToSteps(content);

  return (
    <div className="space-y-3 py-2">
      {steps.map((step, i) => {
        const Icon = stepIcons[step.type];
        const colorClass = stepColors[step.type];

        return (
          <div key={i} className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, type: "spring", bounce: 0.25 }}
              className={`w-full rounded-xl border p-4 ${colorClass}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-lg bg-background/60 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {step.title}
                </span>
                <span className="ml-auto text-[10px] font-medium opacity-50">
                  {i + 1}/{steps.length}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {step.content}
              </p>
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.12 + 0.06 }}
                className="my-1"
              >
                <ArrowDown className="h-4 w-4 text-muted-foreground/40" />
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VisualExplanation;
