import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, Sparkles, BookOpen, FlaskConical, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { analyzeDocument } from "@/services/ai";
import { toast } from "sonner";

interface UploadedFile {
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
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file: File) => {
    const name = file.name;
    const size = `${(file.size / 1024).toFixed(1)} KB`;

    setFiles((prev) => [...prev, { name, size, status: "uploading" }]);

    try {
      // Upload to storage
      const filePath = `${user!.id}/${Date.now()}_${name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user!.id,
          file_name: name,
          file_path: filePath,
          status: "processing",
        })
        .select()
        .single();

      if (docError) throw docError;

      setFiles((prev) =>
        prev.map((f) => (f.name === name ? { ...f, status: "processing" } : f))
      );

      // Extract text and analyze
      const text = await file.text();
      const analysis = await analyzeDocument(text, name);

      // Update document with analysis
      await supabase
        .from("documents")
        .update({
          status: "done",
          topics: analysis.topics || [],
          summary: analysis.summary || "",
          key_points: analysis.key_points || [],
          formulas: analysis.formulas || [],
        })
        .eq("id", doc.id);

      setFiles((prev) =>
        prev.map((f) =>
          f.name === name
            ? {
                ...f,
                status: "done",
                topics: analysis.topics,
                summary: analysis.summary,
                key_points: analysis.key_points,
                formulas: analysis.formulas,
              }
            : f
        )
      );

      toast.success(`${name} analyzed successfully!`);
    } catch (err: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === name ? { ...f, status: "error", error: err.message } : f
        )
      );
      toast.error(`Failed to process ${name}`);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      Array.from(e.dataTransfer.files).forEach(processFile);
    },
    [user]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(processFile);
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload PDFs or notes — VISU will extract topics, summaries, and key formulas ✨
        </p>
      </div>

      {/* Drop Zone */}
      <motion.div
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

      {/* Files */}
      <AnimatePresence>
        {files.map((f) => (
          <motion.div
            key={f.name}
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
                  <p className="text-xs text-muted-foreground">{f.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {f.status === "uploading" && <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>}
                {f.status === "processing" && (
                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Sparkles className="h-3 w-3 animate-spin" /> Analyzing with AI...
                  </span>
                )}
                {f.status === "done" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {f.status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                <button onClick={() => removeFile(f.name)} className="text-muted-foreground hover:text-foreground p-1">
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
              <p className="text-sm text-destructive">{f.error || "Failed to process file"}</p>
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
                        <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent text-accent-foreground border border-primary/10">{t}</span>
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

                <Button variant="gradient" size="sm" className="rounded-full px-5 w-full">
                  Start Studying These Topics
                </Button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadNotes;
