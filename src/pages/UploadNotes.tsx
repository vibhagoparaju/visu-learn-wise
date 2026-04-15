import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, Sparkles, BookOpen, FlaskConical, X, AlertCircle, ArrowRight, Loader2, Link2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { analyzeDocument, analyzeUrl } from "@/services/ai";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { validateFile, checkRateLimit } from "@/lib/security";
import UploadResultCard from "@/components/upload/UploadResultCard";

type InputMode = "file" | "url";

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

const UploadNotes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<InputMode>("file");
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);

  const processFile = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }
    if (!checkRateLimit("upload", 5, 60000)) {
      toast.error("Too many uploads. Please wait a moment.");
      return;
    }

    const name = file.name;
    const size = `${(file.size / 1024).toFixed(1)} KB`;
    setItems((prev) => [...prev, { name, size, status: "uploading" }]);

    try {
      const filePath = `${user!.id}/${Date.now()}_${name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({ user_id: user!.id, file_name: name, file_path: filePath, status: "processing" })
        .select()
        .single();
      if (docError) throw docError;

      setItems((prev) => prev.map((f) => (f.name === name ? { ...f, status: "processing" } : f)));

      const text = await file.text();
      const analysis = await analyzeDocument(text, name);

      await supabase.from("documents").update({
        status: "done",
        topics: analysis.topics || [],
        summary: analysis.summary || "",
        key_points: analysis.key_points || [],
        formulas: analysis.formulas || [],
      }).eq("id", doc.id);

      setItems((prev) => prev.map((f) =>
        f.name === name ? { ...f, status: "done", topics: analysis.topics, summary: analysis.summary, key_points: analysis.key_points, formulas: analysis.formulas } : f
      ));
      toast.success(`${name} analyzed successfully!`);
    } catch (err: any) {
      setItems((prev) => prev.map((f) => (f.name === name ? { ...f, status: "error", error: err.message } : f)));
      toast.error(`Failed to process ${name}`);
    }
  };

  const processUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;

    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    if (!checkRateLimit("url-extract", 5, 60000)) {
      toast.error("Too many requests. Please wait a moment.");
      return;
    }

    const displayName = new URL(url).hostname;
    setUrlLoading(true);
    setItems((prev) => [...prev, { name: displayName, size: url, status: "processing" }]);
    setUrlInput("");

    try {
      const analysis = await analyzeUrl(url);

      // Save to documents table
      await supabase.from("documents").insert({
        user_id: user!.id,
        file_name: analysis.title || displayName,
        file_path: url,
        status: "done",
        topics: analysis.topics || [],
        summary: analysis.summary || "",
        key_points: analysis.key_points || [],
        formulas: analysis.formulas || [],
      });

      setItems((prev) => prev.map((f) =>
        f.name === displayName ? { ...f, status: "done", topics: analysis.topics, summary: analysis.summary, key_points: analysis.key_points, formulas: analysis.formulas } : f
      ));
      toast.success("URL analyzed successfully!");
    } catch (err: any) {
      setItems((prev) => prev.map((f) => (f.name === displayName ? { ...f, status: "error", error: err.message } : f)));
      toast.error(err.message || "Failed to analyze URL");
    } finally {
      setUrlLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  }, [user]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(processFile);
  };

  const removeItem = (name: string) => {
    setItems((prev) => prev.filter((f) => f.name !== name));
  };

  const studyTopic = (topic: string) => {
    navigate(`/study/${encodeURIComponent(topic)}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload files or paste a URL — VISU will extract topics, summaries, and key points ✨
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 bg-muted rounded-full p-1 w-fit">
        <button
          onClick={() => setMode("file")}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all ${
            mode === "file" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" />
          File Upload
        </button>
        <button
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all ${
            mode === "url" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-4 w-4" />
          Paste URL
        </button>
      </div>

      {/* File Drop Zone */}
      <AnimatePresence mode="wait">
        {mode === "file" ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            whileHover={{ scale: 1.01 }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragActive ? "border-primary bg-accent shadow-glow" : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <div className="absolute inset-0 rounded-2xl gradient-primary opacity-[0.03]" />
            <div className="relative z-10">
              <div className="h-16 w-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center shadow-glow mb-4">
                <Upload className="h-7 w-7 text-primary-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">Drag & drop your files here</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — up to 20MB</p>
              <label>
                <Button variant="outline" size="sm" className="mt-4 cursor-pointer rounded-full px-5" asChild>
                  <span>Browse Files</span>
                </Button>
                <input type="file" multiple accept=".pdf,.docx,.txt" onChange={handleFileInput} className="hidden" />
              </label>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all border-border bg-card"
          >
            <div className="absolute inset-0 rounded-2xl gradient-primary opacity-[0.03]" />
            <div className="relative z-10 space-y-4">
              <div className="h-16 w-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center shadow-glow">
                <Globe className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Paste any webpage URL</p>
                <p className="text-xs text-muted-foreground mt-1">Articles, blogs, documentation — we'll extract the knowledge</p>
              </div>
              <div className="flex gap-2 max-w-lg mx-auto">
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && processUrl()}
                  className="rounded-full"
                  disabled={urlLoading}
                />
                <Button
                  onClick={processUrl}
                  disabled={urlLoading || !urlInput.trim()}
                  className="rounded-full px-5"
                  variant="gradient"
                >
                  {urlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyze"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {items.map((f) => (
          <UploadResultCard key={f.name} item={f} onRemove={removeItem} onStudyTopic={studyTopic} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadNotes;
