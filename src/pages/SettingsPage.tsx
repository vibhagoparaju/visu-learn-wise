import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const SettingsPage = () => {
  const [tutorName, setTutorName] = useState("VISU");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize your AI tutor</p>
      </div>

      <div className="bg-card rounded-xl p-5 shadow-card space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">AI Tutor Name</label>
          <input
            value={tutorName}
            onChange={(e) => setTutorName(e.target.value)}
            className="mt-1 w-full bg-muted rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Difficulty Level</label>
          <div className="flex gap-2 mt-2">
            {(["beginner", "intermediate", "advanced"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  difficulty === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button variant="gradient" className="w-full">
        Save Settings
      </Button>
    </motion.div>
  );
};

export default SettingsPage;
