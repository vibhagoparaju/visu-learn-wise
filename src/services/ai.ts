/**
 * Centralized AI Router Layer
 * --------------------------
 * All AI calls go through this module. It handles:
 * - Routing to the correct edge function
 * - Response caching (prevents duplicate calls)
 * - Request deduplication (in-flight dedup)
 * - Unified retry with exponential backoff
 * - Friendly error mapping
 */

import { aiCache, dedup } from "./aiCache";

// ─── Route Map ───────────────────────────────────────────────
const BASE = import.meta.env.VITE_SUPABASE_URL;
const AUTH = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;

const ROUTES = {
  chat:           `${BASE}/functions/v1/chat`,
  analyzeDoc:     `${BASE}/functions/v1/analyze-document`,
  analyzeImage:   `${BASE}/functions/v1/analyze-image`,
  extractUrl:     `${BASE}/functions/v1/extract-url`,
  generateVisual: `${BASE}/functions/v1/generate-visual`,
  searchVideos:   `${BASE}/functions/v1/search-videos`,
  generateSyllabus: `${BASE}/functions/v1/generate-syllabus`,
} as const;

// ─── Friendly Errors ─────────────────────────────────────────
const FRIENDLY_ERRORS: Record<number, string> = {
  429: "VISU is a bit busy right now. Please wait a moment and try again.",
  402: "AI credits have been used up. Please check your workspace settings.",
  503: "VISU is temporarily unavailable. We're retrying automatically…",
  500: "Something went wrong. Please try again.",
};

function friendlyError(status: number, fallback?: string): string {
  return FRIENDLY_ERRORS[status] || fallback || "Something unexpected happened. Please try again.";
}

// ─── Core Transport: Retry + Timeout ─────────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { maxRetries = 2, timeoutMs = 45000 }: { maxRetries?: number; timeoutMs?: number } = {}
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (resp.ok || (resp.status >= 400 && resp.status < 500 && resp.status !== 408)) {
        return resp;
      }
      lastError = new Error(`HTTP ${resp.status}`);
    } catch (e: any) {
      lastError = e;
    }

    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError || new Error("Request failed after retries");
}

// ─── Generic JSON call with caching + dedup ──────────────────
async function callAI<T>(
  route: string,
  body: Record<string, unknown>,
  opts?: { timeoutMs?: number; cacheTtlMs?: number; skipCache?: boolean }
): Promise<T> {
  const cacheKey = aiCache.key({ route, ...body });

  // Check cache first
  if (!opts?.skipCache) {
    const cached = aiCache.get<T>(cacheKey);
    if (cached) return cached;
  }

  // Deduplicate in-flight identical requests
  return dedup(cacheKey, async () => {
    const resp = await fetchWithRetry(route, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: AUTH },
      body: JSON.stringify(body),
    }, { timeoutMs: opts?.timeoutMs ?? 50000 });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || friendlyError(resp.status));
    }

    const result = await resp.json() as T;
    aiCache.set(cacheKey, result, opts?.cacheTtlMs);
    return result;
  }) as Promise<T>;
}

// ─── Public API (unchanged signatures) ───────────────────────

type Msg = { role: "user" | "assistant"; content: string };

/** Streaming chat — not cached (real-time conversation) */
export async function streamChat({
  messages,
  mode = "chat",
  difficulty = "beginner",
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  mode?: string;
  difficulty?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError?: (error: string) => void;
}) {
  let resp: Response;
  try {
    resp = await fetchWithRetry(ROUTES.chat, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: AUTH },
      body: JSON.stringify({ messages, mode, difficulty }),
    }, { timeoutMs: 35000 });
  } catch {
    onError?.("Could not reach VISU. Please check your connection and try again.");
    onDone();
    return;
  }

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError?.(data.error || friendlyError(resp.status));
    onDone();
    return;
  }

  if (!resp.body) {
    onError?.("No response received. Please try again.");
    onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

/** Analyze a text document — cached for 10 minutes */
export async function analyzeDocument(text: string, fileName: string) {
  return callAI(ROUTES.analyzeDoc, { text, fileName }, { timeoutMs: 50000, cacheTtlMs: 10 * 60 * 1000 });
}

/** Analyze a URL — cached for 10 minutes */
export async function analyzeUrl(url: string) {
  return callAI(ROUTES.extractUrl, { url }, { timeoutMs: 50000, cacheTtlMs: 10 * 60 * 1000 });
}

/** Analyze an image (OCR + AI) — cached for 10 minutes */
export async function analyzeImage(imageBase64: string, mimeType: string, fileName: string) {
  // Use fileName + size as cache key instead of full base64
  return callAI(ROUTES.analyzeImage, { imageBase64, mimeType, fileName }, { timeoutMs: 55000, cacheTtlMs: 10 * 60 * 1000 });
}

/** Generate a visual explanation — cached for 5 minutes */
export async function generateVisual(topic: string, explanation?: string) {
  return callAI<{ imageUrl?: string; description?: string }>(
    ROUTES.generateVisual,
    { topic, explanation },
    { timeoutMs: 65000, cacheTtlMs: 5 * 60 * 1000 }
  );
}

/** Search for educational videos — cached for 15 minutes */
export async function searchVideos(topic: string, explanation?: string) {
  return callAI<{ videos: unknown[] }>(
    ROUTES.searchVideos,
    { topic, explanation },
    { timeoutMs: 30000, cacheTtlMs: 15 * 60 * 1000 }
  );
}

/** Generate syllabus — cached for 30 minutes */
export async function generateSyllabus(board: string, grade: string, subject: string) {
  return callAI(ROUTES.generateSyllabus, { board, grade, subject }, { timeoutMs: 60000, cacheTtlMs: 30 * 60 * 1000 });
}
