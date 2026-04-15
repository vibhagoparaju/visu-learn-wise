import { motion } from "framer-motion";
import { FileText, CheckCircle2, Sparkles, BookOpen, FlaskConical, X, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedItem {
  name: string;
  size: string;
  status: "uploading" | "processing" | "done" | "error";
  topics?: string[];
  summary?: string;
  key_points?: string[];
  formulas?: string[];
  error?: string;
}

interface Props {
  item: UploadedItem;
  onRemove: (name: string) => void;
  onStudyTopic: (topic: string) => void;
}

const UploadResultCard = ({ item: f, onRemove, onStudyTopic }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 12, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-card rounded-2xl p-5 shadow-card space-y-4"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{f.name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{f.size}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {f.status === "uploading" && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
          </span>
        )}
        {f.status === "processing" && (
          <span className="flex items-center gap-1 text-xs text-primary font-medium">
            <Sparkles className="h-3 w-3 animate-spin" /> Analyzing with AI...
          </span>
        )}
        {f.status === "done" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {f.status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
        <button onClick={() => onRemove(f.name)} className="text-muted-foreground hover:text-foreground p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>

    {(f.status === "uploading" || f.status === "processing") && (
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full gradient-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: f.status === "uploading" ? "30%" : "70%" }}
          transition={{ duration: 1.5 }}
        />
      </div>
    )}

    {f.status === "error" && (
      <p className="text-sm text-destructive">{f.error || "Failed to process"}</p>
    )}

    {f.status === "done" && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-3 border-t border-border">
        {f.topics && f.topics.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Topics</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {f.topics.map((t) => (
                <button
                  key={t}
                  onClick={() => onStudyTopic(t)}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-accent text-accent-foreground border border-primary/10 hover:bg-primary hover:text-primary-foreground transition-colors group"
                >
                  {t}
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {f.summary && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed bg-accent/50 rounded-xl p-3">{f.summary}</p>
          </div>
        )}

        {f.key_points && f.key_points.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Points</p>
            </div>
            <ul className="space-y-1.5">
              {f.key_points.map((kp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary mt-0.5">•</span>
                  {kp}
                </li>
              ))}
            </ul>
          </div>
        )}

        {f.formulas && f.formulas.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FlaskConical className="h-3.5 w-3.5 text-secondary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Formulas</p>
            </div>
            <div className="space-y-1.5">
              {f.formulas.map((formula) => (
                <div key={formula} className="text-xs font-mono px-3 py-2 rounded-lg bg-muted text-foreground">{formula}</div>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="gradient"
          size="sm"
          className="rounded-full px-5 w-full"
          onClick={() => f.topics?.[0] && onStudyTopic(f.topics[0])}
        >
          Start Studying These Topics
        </Button>
      </motion.div>
    )}
  </motion.div>
);

export default UploadResultCard;
