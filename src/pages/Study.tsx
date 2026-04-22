import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useDebouncedCallback } from "use-debounce";
import { Send, Sparkles, User, Maximize2, Minimize2, MessageSquareText, Lightbulb, Mic, MicOff, Volume2, VolumeX, Loader2, HelpCircle, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useVoice } from "@/hooks/useVoice";
import { usePuppy } from "@/hooks/usePuppy";
import { streamChat } from "@/services/ai";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { awardStudyXP } from "@/services/xpService";
import { sanitizeChatInput, checkRateLimit, wrapUserInput } from "@/lib/security";
import WellnessReminder from "@/components/study/WellnessReminder";
import VisualExplanation from "@/components/study/VisualExplanation";
import VideoExplanation from "@/components/study/VideoExplanation";
import RetainPanel from "@/components/study/RetainPanel";
import MessageViewToggle, { type ViewMode } from "@/components/study/MessageViewToggle";
import AIErrorBoundary from "@/components/AIErrorBoundary";
import { useParams } from "react-router-dom";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

type StudyMode = "chat" | "teachback" | "quiz" | "lazy";

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

const modeConfig: Record<StudyMode, { label: string; icon: any; desc: string }> = {
  chat: { label: "Chat", icon: Sparkles, desc: "Ask anything" },
  teachback: { label: "Teach Back", icon: MessageSquareText, desc: "Explain to learn" },
  quiz: { label: "Quiz", icon: HelpCircle, desc: "Test yourself" },
  lazy: { label: "Quick", icon: Coffee, desc: "2-min lessons" },
};

const Study = () => {
  const { profile, user } = useAuth();
  const { showMessage: showPuppy, setMood: setPuppyMood, triggerState: triggerPuppy } = usePuppy();
  const { topic: urlTopic } = useParams();
  const tutorName = profile?.tutor_name || "VISU";
  const difficulty = profile?.difficulty_level || "beginner";

  const topicIntro = urlTopic
    ? `Hey! I'm ${tutorName}. Let's study **${decodeURIComponent(urlTopic)}** together. Ready?`
    : `Hi, I'm ${tutorName}, your AI tutor.\n\nWhat would you like to learn today?`;

  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: topicIntro },
  ]);
  const [input, setInput] = useState(urlTopic ? `Explain ${decodeURIComponent(urlTopic)}` : "");
  const [isLoading, setIsLoading] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mode, setMode] = useState<StudyMode>("chat");
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [messageViews, setMessageViews] = useState<Record<string, ViewMode>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice();

  const getViewMode = (msgId: string): ViewMode => messageViews[msgId] || "explain";
  const setViewMode = (msgId: string, view: ViewMode) =>
    setMessageViews((prev) => ({ ...prev, [msgId]: view }));

  const [autoSent, setAutoSent] = useState(false);
  const retainedMessageIds = useRef<Set<string>>(new Set());
  const pendingProgress = useRef<Map<string, { delta: number; attempts: number; correct: number }>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounced batch flush of mastery updates (5s)
  const flushProgress = useDebouncedCallback(async () => {
    if (!user || pendingProgress.current.size === 0) return;
    const updates: Array<Record<string, unknown>> = [];
    for (const [topic, agg] of pendingProgress.current.entries()) {
      updates.push({
        topic,
        mastery_pct: Math.round(agg.delta),
        strength: agg.delta >= 75 ? "strong" : agg.delta >= 40 ? "moderate" : "weak",
        questions_attempted: agg.attempts,
        questions_correct: agg.correct,
      });
    }
    pendingProgress.current.clear();
    try {
      await supabase.rpc("batch_update_progress", { updates: updates as any });
    } catch (e) {
      console.error("batch_update_progress failed:", e);
    }
  }, 5000);

  useEffect(() => {
    if (urlTopic && !autoSent && input) {
      setAutoSent(true);
      sendMessage(input);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTopic, autoSent]);

  useEffect(() => {
    const interval = setInterval(() => setSessionMinutes((m) => m + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Flush any pending progress on unmount
  useEffect(() => {
    return () => {
      flushProgress.flush();
    };
  }, [flushProgress]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const retainAsFlashcards = useCallback(async (content: string, msgId?: string) => {
    if (!user) return;
    if (msgId && retainedMessageIds.current.has(msgId)) {
      toast.info("Already retained as flashcards");
      return;
    }
    if (msgId) retainedMessageIds.current.add(msgId);
    toast.loading("Creating flashcards...", { id: "retain" });

    let result = "";
    await streamChat({
      messages: [
        {
          role: "user",
          content: `Based on this explanation, generate exactly 3 flashcards. Return ONLY a JSON array with objects having "front" (question) and "back" (answer) keys. No markdown, no code blocks, just the raw JSON array.\n\nExplanation:\n${content}`,
        },
      ],
      mode: "chat",
      difficulty: "beginner",
      onDelta: (d) => (result += d),
      onDone: async () => {
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          if (!jsonMatch) throw new Error("No JSON");
          const parsed = JSON.parse(jsonMatch[0]) as { front: string; back: string }[];
          const topic = urlTopic ? decodeURIComponent(urlTopic) : "General";
          const inserts = parsed.map((c) => ({
            user_id: user.id,
            topic,
            front: c.front,
            back: c.back,
          }));
          await supabase.from("flashcards").insert(inserts);
          toast.success(`${parsed.length} flashcards saved`, { id: "retain" });
          triggerPuppy("celebrating");
        } catch {
          toast.error("Failed to create flashcards", { id: "retain" });
        }
      },
      onError: () => toast.error("Failed to create flashcards", { id: "retain" }),
    });
  }, [user, urlTopic]);

  const sendMessage = async (overrideInput?: string) => {
    const sanitized = sanitizeChatInput(overrideInput ?? input);
    if (!sanitized || isLoading) return;

    if (!checkRateLimit("chat", 15, 60000)) {
      toast.error("Slow down! Please wait a moment before sending another message.");
      return;
    }

    let userContent = wrapUserInput(sanitized);
    if (mode === "teachback") userContent = `[Teach Back] ${userContent}`;
    else if (mode === "quiz") userContent = `[Quiz Mode] Generate a quiz question about: ${userContent}`;
    else if (mode === "lazy") userContent = `[Lazy Mode] Give a super quick 2-min lesson on: ${userContent}`;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    triggerPuppy("thinking");

    let assistantContent = "";
    let firstChunkSeen = false;

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      if (!firstChunkSeen) {
        firstChunkSeen = true;
        triggerPuppy("studying");
      }
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
        // Trim to last 10 messages to keep context window small
        messages: newMessages
          .filter((m) => m.id !== "welcome")
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
        mode: mode === "teachback" ? "teachback" : mode === "quiz" ? "quiz" : mode === "lazy" ? "lazy" : "chat",
        difficulty,
        onDelta: upsertAssistant,
        onDone: async () => {
          // Strip RESULT marker from displayed content (quiz mode)
          const isQuiz = mode === "quiz";
          const isCorrect = isQuiz && /RESULT:CORRECT\b/.test(assistantContent);
          const isIncorrect = isQuiz && /RESULT:INCORRECT\b/.test(assistantContent);
          if (isQuiz) {
            assistantContent = assistantContent.replace(/RESULT:(CORRECT|INCORRECT|NEW)\b/g, "").trim();
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "streaming" ? { ...m, id: Date.now().toString(), content: assistantContent } : m
            )
          );
          setIsLoading(false);
          if (isCorrect) triggerPuppy("correct");
          else if (isIncorrect) triggerPuppy("incorrect");
          else showPuppy("Great question! Keep going 📚", "happy", 3000);

          if (user && assistantContent.length > 50) {
            const topicName = urlTopic ? decodeURIComponent(urlTopic) : userContent.replace(/^\[(.*?)\]\s*/, "").slice(0, 100);
            try {
              const { data: existing } = await supabase
                .from("study_progress")
                .select("id, questions_attempted, questions_correct, mastery_pct, last_studied_at")
                .eq("user_id", user.id).eq("topic", topicName).maybeSingle();

              // Decay model: lose 0.5% per day since last study
              const lastStudied = existing?.last_studied_at ? new Date(existing.last_studied_at) : null;
              const daysSince = lastStudied ? (Date.now() - lastStudied.getTime()) / 86400000 : 0;
              const decayedMastery = Math.max(0, (existing?.mastery_pct || 0) - daysSince * 0.5);

              const isTeachOrQuiz = mode === "quiz" || mode === "teachback";
              const delta = isTeachOrQuiz ? 10 : 2; // 10 for active recall, 2 for exploration
              const newMastery = Math.min(100, decayedMastery + delta);
              const attempted = (existing?.questions_attempted || 0) + (isTeachOrQuiz ? 1 : 0);
              const correct = (existing?.questions_correct || 0) + (isQuiz && isCorrect ? 1 : 0);
              const strength = newMastery >= 75 ? "strong" : newMastery >= 40 ? "moderate" : newMastery > 0 ? "weak" : "not-started";

              if (existing) {
                await supabase.from("study_progress").update({
                  mastery_pct: Math.round(newMastery), strength,
                  questions_attempted: attempted, questions_correct: correct,
                  last_studied_at: new Date().toISOString(),
                }).eq("id", existing.id);
              } else {
                await supabase.from("study_progress").insert({
                  user_id: user.id, topic: topicName,
                  mastery_pct: Math.round(newMastery), strength: "weak",
                  questions_attempted: isTeachOrQuiz ? 1 : 0,
                  questions_correct: isQuiz && isCorrect ? 1 : 0,
                  last_studied_at: new Date().toISOString(),
                });
              }
            } catch (e) { console.error("Progress tracking error:", e); }
          }

          if (user) awardStudyXP(user.id).catch(console.error);
          if (profile?.voice_enabled && assistantContent) speak(assistantContent);
        },
        onError: (error) => {
          // Remove ghost streaming message on error
          setMessages((prev) => prev.filter((m) => m.id !== "streaming"));
          toast.error(error);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== "streaming"));
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

  const renderMessageContent = (msg: Message) => {
    const viewMode = getViewMode(msg.id);
    const isComplete = msg.id !== "streaming" && msg.id !== "welcome";

    return (
      <div>
        {/* View toggle for completed assistant messages */}
        {msg.role === "assistant" && isComplete && (
          <div className="mb-3">
            <MessageViewToggle
              activeView={viewMode}
              onViewChange={(v) => setViewMode(msg.id, v)}
            />
          </div>
        )}

        {/* Content based on active view */}
        <AnimatePresence mode="wait">
          {viewMode === "visual" && isComplete ? (
            <motion.div key="visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AIErrorBoundary label="Visual">
                <VisualExplanation content={msg.content} topic={urlTopic ? decodeURIComponent(urlTopic) : undefined} />
              </AIErrorBoundary>
            </motion.div>
          ) : viewMode === "video" && isComplete ? (
            <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AIErrorBoundary label="Video">
                <VideoExplanation content={msg.content} topic={urlTopic ? decodeURIComponent(urlTopic) : undefined} />
              </AIErrorBoundary>
            </motion.div>
          ) : viewMode === "retain" && isComplete ? (
            <motion.div key="retain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AIErrorBoundary label="Retain">
                <RetainPanel content={msg.content} onRetain={(c) => retainAsFlashcards(c, msg.id)} />
              </AIErrorBoundary>
            </motion.div>
          ) : (
            <motion.div key="explain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-code:text-primary prose-code:bg-accent prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action bar for completed assistant messages (only in explain mode) */}
        {msg.role === "assistant" && isComplete && viewMode === "explain" && (
          <div className="mt-2 flex items-center gap-3 border-t border-border/50 pt-2">
            <button
              onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              {isSpeaking ? "Stop" : "Listen"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col ${
        focusMode
          ? "fixed inset-0 z-50 bg-background p-4 md:p-8"
          : "h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]"
      }`}
    >
      <Helmet>
        <title>{urlTopic ? `Study: ${decodeURIComponent(urlTopic)} · VISU` : `Study with ${tutorName} · VISU`}</title>
      </Helmet>
      <WellnessReminder paused={isLoading} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">
            {urlTopic ? decodeURIComponent(urlTopic) : `Study with ${tutorName}`}
          </h1>
          <p className="text-xs text-muted-foreground">
            {modeConfig[mode].desc} · {difficulty}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg flex-shrink-0"
          onClick={() => setFocusMode(!focusMode)}
        >
          {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </motion.div>

      {/* Mode Selector */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {(Object.keys(modeConfig) as StudyMode[]).map((m) => {
          const cfg = modeConfig[m];
          const Icon = cfg.icon;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{cfg.label}</span>
            </button>
          );
        })}
      </div>

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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "gradient-primary text-primary-foreground rounded-br-md"
                    : "bg-card shadow-card text-foreground rounded-bl-md"
                }`}
              >
                {renderMessageContent(msg)}
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
          {["Explain a concept", "Quiz me", "Help me study"].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-border text-foreground bg-card hover:bg-accent transition-colors"
            >
              <Lightbulb className="h-3 w-3 text-primary" />
              {prompt}
            </button>
          ))}
        </motion.div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-border">
        <Button
          variant={isListening ? "default" : "ghost"}
          size="icon"
          onClick={handleVoiceInput}
          className={`rounded-xl h-11 w-11 flex-shrink-0 ${isListening ? "animate-pulse bg-destructive hover:bg-destructive" : ""}`}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={
            isListening
              ? "Listening..."
              : mode === "teachback"
              ? "Explain what you've learned..."
              : mode === "quiz"
              ? "Enter a topic to get quizzed on..."
              : mode === "lazy"
              ? "Topic for a quick lesson..."
              : `Ask ${tutorName} anything...`
          }
          style={{ resize: "none", overflow: "hidden" }}
          className="flex-1 bg-card rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow leading-relaxed"
        />
        <Button
          variant="gradient"
          size="icon"
          onClick={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          className="rounded-xl h-11 w-11"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default Study;
