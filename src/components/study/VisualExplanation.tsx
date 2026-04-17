import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateVisual } from "@/services/ai";
import DOMPurify from "dompurify";

interface VisualExplanationProps {
  content: string;
  topic?: string;
}

const VisualExplanation = ({ content, topic }: VisualExplanationProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [svgCode, setSvgCode] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  const extractTopic = (text: string): string => {
    if (topic) return topic;
    const headerMatch = text.match(/^#{1,3}\s+(.+)/m);
    if (headerMatch) return headerMatch[1].replace(/\*\*/g, "").trim();
    const firstSentence = text.split(/[.!?]/)[0]?.trim();
    return firstSentence?.slice(0, 100) || "this concept";
  };

  const fetchVisual = async () => {
    setLoading(true); setError(null); setHasRequested(true);
    setImageUrl(null); setSvgCode(null);
    try {
      const data = await generateVisual(extractTopic(content), content.replace(/[#*_]/g, "").slice(0, 600));
      if (data.imageUrl) setImageUrl(data.imageUrl);
      else if (data.svgCode) setSvgCode(data.svgCode);
      setDescription(data.description || "");
    } catch (e: any) {
      setError(e.message || "Failed to generate visual");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasRequested && !imageUrl && !svgCode) fetchVisual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasRequested || loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Generating visual explanation…</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-6 gap-3">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchVisual} className="rounded-lg">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Try again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {imageUrl && (
        <div className="rounded-xl overflow-hidden border border-border bg-background">
          <img src={imageUrl} alt={`Visual explanation of ${extractTopic(content)}`} className="w-full h-auto" loading="lazy" decoding="async" />
        </div>
      )}
      {svgCode && (
        <div
          className="rounded-xl overflow-hidden border border-border bg-background p-4 flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgCode, { USE_PROFILES: { svg: true, svgFilters: true } }) }}
        />
      )}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed px-1">{description}</p>
      )}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={fetchVisual} disabled={loading} className="text-xs rounded-lg">
          <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
        </Button>
      </div>
    </motion.div>
  );
};

export default VisualExplanation;
