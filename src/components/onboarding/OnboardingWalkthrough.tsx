import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, MessageSquare, Brain, BarChart3, Layers, Trophy, ArrowRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PuppyMascot, { type PuppyMood } from "@/components/mascot/PuppyMascot";

interface OnboardingStep {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  puppyMood: PuppyMood;
  puppyMessage: string;
}

const steps: OnboardingStep[] = [
  {
    icon: Upload,
    title: "Upload Your Notes",
    description: "Drop PDFs, images, or paste text. VISU extracts key topics and summaries instantly.",
    gradient: "gradient-success",
    puppyMood: "encouraging",
    puppyMessage: "Let's get started! 📄",
  },
  {
    icon: MessageSquare,
    title: "Chat with AI Tutor",
    description: "Ask anything about your material. Get clear, personalized explanations with visuals and videos.",
    gradient: "gradient-primary",
    puppyMood: "happy",
    puppyMessage: "I'll help you learn! 💬",
  },
  {
    icon: Brain,
    title: "Learn & Visualize",
    description: "AI generates diagrams, finds relevant videos, and breaks concepts into bite-sized pieces.",
    gradient: "gradient-warm",
    puppyMood: "thinking",
    puppyMessage: "Hmm, let me think... 🧠",
  },
  {
    icon: Layers,
    title: "Review with Flashcards",
    description: "Spaced repetition flashcards and quizzes lock knowledge into long-term memory.",
    gradient: "gradient-accent",
    puppyMood: "encouraging",
    puppyMessage: "You can do it! 💪",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description: "See mastery levels, streaks, and weak areas. The planner keeps you on track for exams.",
    gradient: "gradient-primary",
    puppyMood: "idle",
    puppyMessage: "Look how far you've come! 📊",
  },
  {
    icon: Trophy,
    title: "Earn Rewards",
    description: "Gain XP, level up, and unlock achievements as you study. Your puppy companion cheers you on!",
    gradient: "gradient-warm",
    puppyMood: "happy",
    puppyMessage: "Yay, rewards! 🏆",
  },
];

const ONBOARDING_KEY = "visu_onboarding_complete";

const OnboardingWalkthrough = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={handleSkip} />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="relative bg-card rounded-3xl shadow-elevated w-full max-w-sm overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon area */}
            <div className="pt-10 pb-6 flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                  className="relative"
                >
                  <div className={`h-20 w-20 rounded-2xl ${step.gradient} flex items-center justify-center shadow-glow`}>
                    <Icon className="h-9 w-9 text-primary-foreground" />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute -top-2 -right-2 text-2xl"
                  >
                    {step.emoji}
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Content */}
            <div className="px-8 pb-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <h2 className="text-xl font-bold text-foreground font-display mb-2">
                    {step.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 py-4">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
              <Button
                onClick={handleNext}
                variant="gradient"
                className="rounded-full px-6 gap-2"
              >
                {isLastStep ? (
                  <>
                    Get Started <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingWalkthrough;
