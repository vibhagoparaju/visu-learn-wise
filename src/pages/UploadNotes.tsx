import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, Sparkles, BookOpen, FlaskConical, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  name: string;
  size: string;
  status: "uploading" | "processing" | "done";
  topics?: string[];
  summary?: string;
  formulas?: string[];
}

const UploadNotes = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const simulateProcess = (name: string, size: string) => {
    const file: UploadedFile = { name, size, status: "uploading" };
    setFiles((prev) => [...prev, file]);

    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) => (f.name === name ? { ...f, status: "processing" } : f))
      );
    }, 800);

    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === name
            ? {
                ...f,
                status: "done",
                topics: ["Cell Structure", "Mitosis & Meiosis", "DNA Replication", "Protein Synthesis"],
                summary:
                  "This document covers fundamental biology concepts including cell structure, division processes, and genetic replication. Key diagrams and formulas are included for exam preparation.",
                formulas: ["ATP → ADP + Pi + Energy", "DNA → mRNA (Transcription)", "mRNA → Protein (Translation)"],
              }
            : f
        )
      );
    }, 2500);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach((f) =>
      simulateProcess(f.name, `${(f.size / 1024).toFixed(1)} KB`)
    );
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    selected.forEach((f) =>
      simulateProcess(f.name, `${(f.size / 1024).toFixed(1)} KB`)
    );
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24 md:pb-8"
    >
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
          dragActive
            ? "border-primary bg-accent shadow-glow"
            : "border-border bg-card hover:border-primary/30"
        }`}
      >
        <div className="absolute inset-0 rounded-2xl gradient-primary opacity-[0.03]" />
        <div className="relative z-10">
          <div className="h-16 w-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center shadow-glow mb-4">
            <Upload className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Drag & drop your files here
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — up to 20MB</p>
          <label>
            <Button variant="outline" size="sm" className="mt-4 cursor-pointer rounded-full px-5" asChild>
              <span>Browse Files</span>
            </Button>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
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
                {f.status === "uploading" && (
                  <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>
                )}
                {f.status === "processing" && (
                  <span className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Sparkles className="h-3 w-3 animate-spin" /> Analyzing...
                  </span>
                )}
                {f.status === "done" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                <button onClick={() => removeFile(f.name)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {f.status !== "done" && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: f.status === "uploading" ? "40%" : "80%" }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            )}

            {f.status === "done" && f.topics && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-3 border-t border-border">
                {/* Topics */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Topics</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {f.topics.map((t) => (
                      <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent text-accent-foreground border border-primary/10">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Summary</p>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed bg-accent/50 rounded-xl p-3">{f.summary}</p>
                </div>

                {/* Formulas */}
                {f.formulas && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <FlaskConical className="h-3.5 w-3.5 text-secondary" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Formulas</p>
                    </div>
                    <div className="space-y-1.5">
                      {f.formulas.map((formula) => (
                        <div key={formula} className="text-xs font-mono px-3 py-2 rounded-lg bg-muted text-foreground">
                          {formula}
                        </div>
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
