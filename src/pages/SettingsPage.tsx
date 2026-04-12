import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Volume2, VolumeX, Palette, GraduationCap, User, Moon, Sun } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const SettingsPage = () => {
  const [tutorName, setTutorName] = useState("VISU");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [personality, setPersonality] = useState<"friendly" | "professional" | "motivating">("friendly");

  const difficultyConfig = {
    beginner: { emoji: "🌱", desc: "Simple explanations with examples" },
    intermediate: { emoji: "📚", desc: "Balanced depth and detail" },
    advanced: { emoji: "🎯", desc: "Deep, exam-focused content" },
  };

  const personalityConfig = {
    friendly: { emoji: "😊", desc: "Warm and encouraging" },
    professional: { emoji: "👔", desc: "Straight to the point" },
    motivating: { emoji: "🔥", desc: "High energy and pumped" },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-24 md:pb-8">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize your AI tutor experience</p>
      </motion.div>

      {/* Tutor Name */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">AI Tutor Name</h2>
        </div>
        <div className="relative">
          <input
            value={tutorName}
            onChange={(e) => setTutorName(e.target.value)}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            placeholder="Name your AI tutor..."
          />
          <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
        </div>
        <p className="text-xs text-muted-foreground">Your tutor will introduce itself as "{tutorName}"</p>
      </motion.div>

      {/* Difficulty */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Difficulty Level</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["beginner", "intermediate", "advanced"] as const).map((level) => {
            const config = difficultyConfig[level];
            return (
              <motion.button
                key={level}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(level)}
                className={`p-3 rounded-xl text-center transition-all border ${
                  difficulty === level
                    ? "border-primary bg-accent shadow-glow"
                    : "border-border bg-muted/50 hover:border-primary/30"
                }`}
              >
                <span className="text-xl">{config.emoji}</span>
                <p className={`text-xs font-semibold capitalize mt-1 ${difficulty === level ? "text-primary" : "text-foreground"}`}>
                  {level}
                </p>
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{difficultyConfig[difficulty].desc}</p>
      </motion.div>

      {/* AI Personality */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">AI Personality</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["friendly", "professional", "motivating"] as const).map((p) => {
            const config = personalityConfig[p];
            return (
              <motion.button
                key={p}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPersonality(p)}
                className={`p-3 rounded-xl text-center transition-all border ${
                  personality === p
                    ? "border-primary bg-accent shadow-glow"
                    : "border-border bg-muted/50 hover:border-primary/30"
                }`}
              >
                <span className="text-xl">{config.emoji}</span>
                <p className={`text-xs font-semibold capitalize mt-1 ${personality === p ? "text-primary" : "text-foreground"}`}>
                  {p}
                </p>
              </motion.button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">{personalityConfig[personality].desc}</p>
      </motion.div>

      {/* Voice Toggle */}
      <motion.div variants={item} className="bg-card rounded-2xl p-5 shadow-card">
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            {voiceEnabled ? (
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-primary-foreground" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Voice Mode</p>
              <p className="text-xs text-muted-foreground">AI tutor reads responses aloud</p>
            </div>
          </div>
          <div className={`h-7 w-12 rounded-full transition-colors relative ${voiceEnabled ? "bg-primary" : "bg-muted"}`}>
            <motion.div
              className="h-5 w-5 rounded-full bg-white shadow absolute top-1"
              animate={{ left: voiceEnabled ? 24 : 4 }}
              transition={{ type: "spring", bounce: 0.3 }}
            />
          </div>
        </button>
      </motion.div>

      <motion.div variants={item}>
        <Button variant="gradient" className="w-full rounded-xl h-12 font-semibold shadow-glow">
          Save Settings
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
