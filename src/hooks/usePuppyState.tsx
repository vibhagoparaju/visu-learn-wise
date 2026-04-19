import { useCallback, useEffect, useRef, useState } from "react";

export type PuppyState =
  | "idle"
  | "thinking"
  | "correct"
  | "incorrect"
  | "studying"
  | "sleeping"
  | "celebrating";

const INACTIVITY_MS = 3 * 60 * 1000; // 3 min

interface Options {
  /** Disable inactivity → sleeping watcher (e.g. when puppy is hidden). */
  disableInactivity?: boolean;
}

/**
 * Centralised puppy state machine.
 * - triggerState(state, durationMs?) sets a state and auto-returns to idle
 * - 3 min of inactivity → sleeping; any input → idle
 */
export const usePuppyState = (opts: Options = {}) => {
  const [state, setState] = useState<PuppyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<PuppyState>("idle");

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearReset = () => {
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
  };

  const startInactivity = useCallback(() => {
    if (opts.disableInactivity) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setState("sleeping");
    }, INACTIVITY_MS);
  }, [opts.disableInactivity]);

  const triggerState = useCallback(
    (next: PuppyState, durationMs?: number) => {
      clearReset();
      setState(next);

      // Default durations for transient states
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
    },
    [startInactivity],
  );

  // Wake from sleep + reset inactivity on user activity
  useEffect(() => {
    if (opts.disableInactivity) return;
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
      clearReset();
    };
  }, [opts.disableInactivity, startInactivity]);

  return { state, triggerState, setState };
};
