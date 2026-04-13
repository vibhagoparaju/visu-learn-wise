import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Maximize2, Minimize2, MessageSquareText, Lightbulb, Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useVoice } from "@/hooks/useVoice";
import { streamChat } from "@/services/ai";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import WellnessReminder from "@/components/study/WellnessReminder";
import { useParams } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const TypingIndicator = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
    <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
      <Sparkles className="h-4 w-4 text-primary-foreground" />
    </div>
    <div className="bg-card shadow-card rounded-2xl rounded-bl-md px-4 py-3">
      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-primary/40"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
      </div>
    </div>
  </motion.div>
);

const Study = () => {
  const { profile } = useAuth();
  const { topic: urlTopic } = useParams();
  const tutorName = profile?.tutor_name || "VISU";
  const difficulty = profile?.difficulty_level || "beginner";

  const topicIntro = urlTopic
    ? `Hey there! 👋 I'm ${tutorName}.\n\nLet's study **${decodeURIComponent(urlTopic)}** together! I'll explain it step by step.\n\nReady? Let's go! 🚀`
    : `Hey there! 👋 I'm ${tutorName}, your personal AI tutor.\n\nWhat would you like to learn today? I can:\n• **Explain any concept** step-by-step\n• **Quiz you** with questions\n• **Summarize** complex topics\n\nAsk me anything or upload your notes to get started! 🚀`;

  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: topicIntro },
  ]);
  const [input, setInput] = useState(urlTopic ? `Explain ${decodeURIComponent(urlTopic)}` : "");
  const [isLoading, setIsLoading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mode, setMode] = useState<"chat" | "teachback">("chat");
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice();

  // Auto-send topic question on mount
  const [autoSent, setAutoSent] = useState(false);
  useEffect(() => {
    if (urlTopic && !autoSent && input) {
      setAutoSent(true);
      setTimeout(() => sendMessage(), 300);
    }
  }, [urlTopic, autoSent]);

  useEffect(() => {
    const interval = setInterval(() => setSessionMinutes((m) => m + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = mode === "teachback" ? `[Teach Back] ${input.trim()}` : input.trim();
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { id: "streaming", role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: newMessages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content })),
        mode: mode === "teachback" ? "teachback" : "chat",
        difficulty,
        onDelta: upsertAssistant,
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "streaming" ? { ...m, id: Date.now().toString() } : m
            )
          );
          setIsLoading(false);

          // Auto-speak if voice enabled
          if (profile?.voice_enabled && assistantContent) {
            speak(assistantContent);
          }
        },
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
        },
      });
    } catch {
      toast.error("Failed to get AI response");
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      stopListening();
      return;
    }
    try {
      const transcript = await startListening();
      setInput(transcript);
    } catch (err: any) {
      toast.error(err.message || "Voice input failed");
    }
  };

  return (
    <div
      className={`flex flex-col ${
        focusMode
          ? "fixed inset-0 z-50 bg-background p-4 md:p-8"
          : "h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]"
      }`}
    >
      <WellnessReminder sessionMinutes={sessionMinutes} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {urlTopic ? `Studying: ${decodeURIComponent(urlTopic)}` : `Study with ${tutorName}`}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === "teachback"
              ? "🎓 Teach Back Mode — explain to learn!"
              : `Your AI tutor is ready • ${difficulty} level`}
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
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "gradient-primary text-primary-foreground rounded-br-md shadow-glow"
                    : "bg-card shadow-card text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-code:text-primary prose-code:bg-accent prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
                {/* Speaker button for assistant messages */}
                {msg.role === "assistant" && msg.id !== "welcome" && msg.id !== "streaming" && (
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    {isSpeaking ? "Stop" : "Listen"}
                  </button>
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

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && !urlTopic && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2 pb-3 overflow-x-auto"
        >
          {["Explain a concept", "Quiz me on a topic", "Help me study"].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
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
        {/* Mic button */}
        <Button
          variant={isListening ? "default" : "ghost"}
          size="icon"
          onClick={handleVoiceInput}
          className={`rounded-xl h-12 w-12 flex-shrink-0 ${isListening ? "animate-pulse bg-destructive hover:bg-destructive" : ""}`}
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={
            isListening
              ? "Listening..."
              : mode === "teachback"
              ? "Explain what you've learned..."
              : `Ask ${tutorName} anything...`
          }
          className="flex-1 bg-card rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
        <Button
          variant="gradient"
          size="icon"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="rounded-xl h-12 w-12 shadow-glow"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default Study;
