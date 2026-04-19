import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import type { PuppyState } from "./usePuppyState";

// Legacy mood names from earlier API — kept so callers don't break.
export type PuppyMood = "happy" | "thinking" | "idle" | "encouraging" | "relaxing";

const moodToState = (m: PuppyMood): PuppyState => {
  switch (m) {
    case "happy": return "celebrating";
    case "thinking": return "thinking";
    case "encouraging": return "studying";
    case "relaxing": return "sleeping";
    default: return "idle";
  }
};

interface PuppyContextType {
  enabled: boolean;
  /** Legacy mood (mapped from state). */
  mood: PuppyMood;
  /** Rich state machine value. */
  state: PuppyState;
  message: string;
  setMood: (mood: PuppyMood) => void;
  /** Set rich state directly. Auto-resets transient states to idle. */
  triggerState: (state: PuppyState, durationMs?: number) => void;
  showMessage: (msg: string, mood?: PuppyMood, durationMs?: number) => void;
  setEnabled: (v: boolean) => void;
}

const PuppyContext = createContext<PuppyContextType | undefined>(undefined);

const INACTIVITY_MS = 3 * 60 * 1000;

export const PuppyProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [state, setState] = useState<PuppyState>("idle");
  const [message, setMessage] = useState("");
  const stateRef = useRef<PuppyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (profile) setEnabled(profile.puppy_enabled !== false);
  }, [profile]);

  const startInactivity = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setState("sleeping");
    }, INACTIVITY_MS);
  }, []);

  const triggerState = useCallback((next: PuppyState, durationMs?: number) => {
    if (resetTimer.current) { clearTimeout(resetTimer.current); resetTimer.current = null; }
    setState(next);
    const defaultDur: Partial<Record<PuppyState, number>> = {
      correct: 2000,
      incorrect: 1500,
      celebrating: 2000,
    };
    const dur = durationMs ?? defaultDur[next];
    if (dur) {
      resetTimer.current = setTimeout(() => {
        setState("idle");
        startInactivity();
      }, dur);
    }
  }, [startInactivity]);

  const setMood = useCallback((m: PuppyMood) => {
    triggerState(moodToState(m));
  }, [triggerState]);

  const showMessage = useCallback((msg: string, newMood?: PuppyMood, durationMs = 4000) => {
    setMessage(msg);
    if (newMood) triggerState(moodToState(newMood));
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => {
      setMessage("");
    }, durationMs);
  }, [triggerState]);

  // Wake on user activity + idle watcher
  useEffect(() => {
    const wake = () => {
      if (stateRef.current === "sleeping") setState("idle");
      startInactivity();
    };
    window.addEventListener("mousemove", wake, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("touchstart", wake, { passive: true });
    startInactivity();
    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("touchstart", wake);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      if (msgTimer.current) clearTimeout(msgTimer.current);
    };
  }, [startInactivity]);

  const moodFromState: PuppyMood =
    state === "thinking" ? "thinking"
    : state === "celebrating" || state === "correct" ? "happy"
    : state === "studying" ? "encouraging"
    : state === "sleeping" ? "relaxing"
    : "idle";

  return (
    <PuppyContext.Provider value={{ enabled, mood: moodFromState, state, message, setMood, triggerState, showMessage, setEnabled }}>
      {children}
    </PuppyContext.Provider>
  );
};

export const usePuppy = () => {
  const context = useContext(PuppyContext);
  if (!context) throw new Error("usePuppy must be used within PuppyProvider");
  return context;
};
