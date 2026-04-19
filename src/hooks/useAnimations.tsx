import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface AnimationContextType {
  /** Master toggle from settings (persisted in localStorage). */
  enabled: boolean;
  /** True if the OS-level prefers-reduced-motion is set. */
  reducedMotion: boolean;
  /** Effective: animations should play. (enabled && !reducedMotion) */
  shouldAnimate: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
}

const STORAGE_KEY = "visu-animations";
const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);

  const shouldAnimate = enabled && !reducedMotion;

  return (
    <AnimationContext.Provider value={{ enabled, reducedMotion, shouldAnimate, toggle, setEnabled }}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimations = () => {
  const ctx = useContext(AnimationContext);
  if (!ctx) throw new Error("useAnimations must be used within AnimationProvider");
  return ctx;
};
