import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
  name: string;
  size: string;
  status: "uploading" | "processing" | "done";
  topics?: string[];
  summary?: string;
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
                topics: ["Cell Structure", "Mitosis & Meiosis", "DNA Replication"],
                summary:
                  "This document covers fundamental biology concepts including cell structure, division processes, and genetic replication. Key formulas and diagrams are included.",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload PDFs or notes and VISU will extract topics, summaries, and key formulas
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
          dragActive
            ? "border-primary bg-accent"
            : "border-border bg-card"
        }`}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">
          Drag & drop your files here
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — up to 20MB</p>
        <label>
          <Button variant="gradient" size="sm" className="mt-4 cursor-pointer" asChild>
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

      {/* Files */}
      <AnimatePresence>
        {files.map((f) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="bg-card rounded-xl p-5 shadow-card space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.size}</p>
                </div>
              </div>
              <div>
                {f.status === "uploading" && (
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                )}
                {f.status === "processing" && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="h-3 w-3 animate-pulse-glow" /> Analyzing...
                  </span>
                )}
                {f.status === "done" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>

            {f.status !== "done" && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: f.status === "uploading" ? "40%" : "80%",
                  }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            )}

            {f.status === "done" && f.topics && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3 pt-2 border-t border-border"
              >
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Extracted Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {f.topics.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-medium px-3 py-1 rounded-full bg-accent text-accent-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Summary
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{f.summary}</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default UploadNotes;
