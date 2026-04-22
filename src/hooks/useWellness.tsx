import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

export type WellnessInterval = 20 | 30 | 45 | 60;

interface WellnessSettings {
  enabled: boolean;
  intervalMinutes: WellnessInterval;
}

interface WellnessContextType extends WellnessSettings {
  setEnabled: (v: boolean) => void;
  setInterval: (m: WellnessInterval) => void;
}

const STORAGE_KEY = "visu-wellness";
const DEFAULTS: WellnessSettings = { enabled: true, intervalMinutes: 30 };

const WellnessContext = createContext<WellnessContextType | undefined>(undefined);

const readSettings = (): WellnessSettings => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULTS.enabled,
      intervalMinutes: [20, 30, 45, 60].includes(parsed.intervalMinutes)
        ? parsed.intervalMinutes
        : DEFAULTS.intervalMinutes,
    };
  } catch {
    return DEFAULTS;
  }
};

export const WellnessProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<WellnessSettings>(readSettings);

  const persist = useCallback((next: WellnessSettings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setEnabled = useCallback(
    (v: boolean) => persist({ ...settings, enabled: v }),
    [settings, persist],
  );
  const setInterval = useCallback(
    (m: WellnessInterval) => persist({ ...settings, intervalMinutes: m }),
    [settings, persist],
  );

  return (
    <WellnessContext.Provider value={{ ...settings, setEnabled, setInterval }}>
      {children}
    </WellnessContext.Provider>
  );
};

export const useWellness = () => {
  const ctx = useContext(WellnessContext);
  if (!ctx) throw new Error("useWellness must be used within WellnessProvider");
  return ctx;
};

interface UseWellnessTimerOpts {
  /** Pause the timer (e.g. while AI is responding). */
  paused?: boolean;
}

/**
 * Tracks active study time and fires `onTrigger` after the user-selected
 * interval has elapsed. Pauses on tab inactivity, idle (>2 min no input),
 * or when `paused` is true. Resumes seamlessly when the user returns.
 */
export const useWellnessTimer = (
  onTrigger: () => void,
  opts: UseWellnessTimerOpts = {},
) => {
  const { enabled, intervalMinutes } = useWellness();
  const accumulatedMs = useRef(0);
  const lastTickAt = useRef<number | null>(null);
  const lastActivityAt = useRef<number>(Date.now());
  const onTriggerRef = useRef(onTrigger);
  const snoozeUntil = useRef<number>(0);

  useEffect(() => { onTriggerRef.current = onTrigger; }, [onTrigger]);

  // Reset accumulated time when interval changes or feature toggled
  useEffect(() => {
    accumulatedMs.current = 0;
    lastTickAt.current = enabled ? Date.now() : null;
  }, [enabled, intervalMinutes]);

  // Activity tracking
  useEffect(() => {
    const onActivity = () => { lastActivityAt.current = Date.now(); };
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
    };
  }, []);

  // Visibility — pause on tab hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        lastTickAt.current = null;
      } else {
        lastTickAt.current = Date.now();
        lastActivityAt.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Main tick loop
  useEffect(() => {
    if (!enabled) return;
    lastTickAt.current = Date.now();

    const intervalMs = intervalMinutes * 60_000;
    const IDLE_THRESHOLD = 2 * 60_000; // 2 min no input → pause accumulation

    const id = window.setInterval(() => {
      const now = Date.now();
      if (opts.paused || document.hidden) {
        lastTickAt.current = now;
        return;
      }
      const idle = now - lastActivityAt.current > IDLE_THRESHOLD;
      if (idle) {
        lastTickAt.current = now;
        return;
      }
      if (lastTickAt.current === null) {
        lastTickAt.current = now;
        return;
      }
      const delta = now - lastTickAt.current;
      lastTickAt.current = now;
      accumulatedMs.current += delta;

      if (now < snoozeUntil.current) return;

      if (accumulatedMs.current >= intervalMs) {
        accumulatedMs.current = 0;
        onTriggerRef.current();
      }
    }, 5000);

    return () => window.clearInterval(id);
  }, [enabled, intervalMinutes, opts.paused]);

  const snooze = useCallback((minutes: number) => {
    snoozeUntil.current = Date.now() + minutes * 60_000;
    accumulatedMs.current = 0;
  }, []);

  const skip = useCallback(() => {
    accumulatedMs.current = 0;
  }, []);

  return { snooze, skip };
};
