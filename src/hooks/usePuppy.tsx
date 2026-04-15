import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { PuppyMood } from "@/components/mascot/PuppyMascot";

interface PuppyContextType {
  enabled: boolean;
  mood: PuppyMood;
  message: string;
  setMood: (mood: PuppyMood) => void;
  showMessage: (msg: string, mood?: PuppyMood, durationMs?: number) => void;
  setEnabled: (v: boolean) => void;
}

const PuppyContext = createContext<PuppyContextType | undefined>(undefined);

export const PuppyProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [mood, setMood] = useState<PuppyMood>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setEnabled(profile.puppy_enabled !== false);
    }
  }, [profile]);

  const showMessage = useCallback((msg: string, newMood?: PuppyMood, durationMs = 4000) => {
    setMessage(msg);
    if (newMood) setMood(newMood);
    setTimeout(() => {
      setMessage("");
      setMood("idle");
    }, durationMs);
  }, []);

  return (
    <PuppyContext.Provider value={{ enabled, mood, message, setMood, showMessage, setEnabled }}>
      {children}
    </PuppyContext.Provider>
  );
};

export const usePuppy = () => {
  const context = useContext(PuppyContext);
  if (!context) throw new Error("usePuppy must be used within PuppyProvider");
  return context;
};
