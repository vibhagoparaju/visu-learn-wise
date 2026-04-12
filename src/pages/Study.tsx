import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Maximize2, Minimize2, Moon, MessageSquareText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "mcq" | "teachback";
  options?: { label: string; correct?: boolean }[];
}

const INITIAL_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey there! 👋 I'm VISU, your personal AI tutor.\n\nWhat would you like to learn today? I can:\n• Explain any concept step-by-step\n• Quiz you with MCQs\n• Break down tough topics\n\nLet's go! 🚀",
};

const AI_RESPONSES: Message[] = [
  {
    id: "",
    role: "assistant",
    content: "Great question! Let's break this down step by step 👇\n\nFirst, let's understand the core concept. Think of it like building blocks — each piece connects to the next.",
  },
  {
    id: "",
    role: "assistant",
    content: "Let me check your understanding with a quick question:",
    type: "mcq",
    options: [
      { label: "Mitochondria is the powerhouse of the cell", correct: true },
      { label: "Nucleus is the powerhouse of the cell" },
      { label: "Ribosome is the powerhouse of the cell" },
    ],
  },
  {
    id: "",
    role: "assistant",
    content: "Nice try! You're improving 🔥\n\nHere's a real-life example to make it click:\n\n📌 Think of DNA like a recipe book — it contains all the instructions your body needs.",
  },
  {
    id: "",
    role: "assistant",
    content: "That's an excellent topic! Let me give you a structured breakdown:\n\n1️⃣ **Definition** — Start with what it is\n2️⃣ **How it works** — The mechanism\n3️⃣ **Why it matters** — Real-world application\n\nReady for more detail on any of these? 🧠",
  },
];

const TypingIndicator = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
    <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
      <Sparkles className="h-4 w-4 text-primary-foreground" />
    </div>
    <div className="bg-card shadow-card rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary/40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

const MCQOptions = ({ options, onAnswer }: { options: { label: string; correct?: boolean }[]; onAnswer: (correct: boolean) => void }) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-2 mt-3">
      {options.map((opt, i) => (
        <motion.button
          key={i}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (selected !== null) return;
            setSelected(i);
            onAnswer(!!opt.correct);
          }}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
            selected === null
              ? "border-border bg-muted/50 hover:border-primary/30 hover:bg-accent"
              : selected === i
              ? opt.correct
                ? "border-green-400 bg-green-50 text-green-700"
                : "border-red-400 bg-red-50 text-red-600"
              : opt.correct && selected !== null
              ? "border-green-400 bg-green-50 text-green-700"
              : "border-border bg-muted/30 opacity-50"
          }`}
        >
          <span className="mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
};

const Study = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mode, setMode] = useState<"chat" | "teachback">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: mode === "teachback" ? `[Teach Back] ${input.trim()}` : input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const template = AI_RESPONSES[responseIndex.current % AI_RESPONSES.length];
      const reply: Message = {
        ...template,
        id: (Date.now() + 1).toString(),
      };
      responseIndex.current++;
      setMessages((prev) => [...prev, reply]);
      setIsLoading(false);
    }, 1000 + Math.random() * 800);
  };

  const handleMCQAnswer = (correct: boolean) => {
    setTimeout(() => {
      const feedback: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: correct
          ? "✅ Correct! Great job — you've got a solid understanding of this concept. Let's move to the next topic!"
          : "❌ Not quite! Don't worry — mistakes help us learn. Here's the key thing to remember...",
      };
      setMessages((prev) => [...prev, feedback]);
    }, 600);
  };

  return (
    <div className={`flex flex-col ${focusMode ? "fixed inset-0 z-50 bg-background p-4 md:p-8" : "h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]"}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h1 className="text-xl font-bold text-foreground">Study with VISU</h1>
          <p className="text-xs text-muted-foreground">
            {mode === "teachback" ? "🎓 Teach Back Mode — explain to learn!" : "Your AI tutor is ready to help"}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant={mode === "teachback" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setMode(mode === "teachback" ? "chat" : "teachback")}
            title="Teach Back Mode"
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => setFocusMode(!focusMode)}
            title="Focus Mode"
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </motion.div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-br-md shadow-glow"
                      : "bg-card shadow-card text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.type === "mcq" && msg.options && (
                  <MCQOptions options={msg.options} onAnswer={handleMCQAnswer} />
                )}
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2 pb-3 overflow-x-auto"
        >
          {["Explain photosynthesis", "Quiz me on genetics", "Summarize Chapter 3"].map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setInput(prompt);
              }}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-primary/20 text-primary bg-accent hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Lightbulb className="h-3 w-3" />
              {prompt}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <div className="flex-1 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={mode === "teachback" ? "Explain what you've learned..." : "Ask VISU anything..."}
            className="w-full bg-card rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <Button
          variant="gradient"
          size="icon"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="rounded-xl h-12 w-12 shadow-glow"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Study;
