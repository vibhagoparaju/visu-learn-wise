const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`;
const ANALYZE_IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`;

type Msg = { role: "user" | "assistant"; content: string };

const FRIENDLY_ERRORS: Record<number, string> = {
  429: "VISU is a bit busy right now. Please wait a moment and try again.",
  402: "AI credits have been used up. Please check your workspace settings.",
  503: "VISU is temporarily unavailable. We're retrying automatically…",
  500: "Something went wrong. Please try again.",
};

function friendlyError(status: number, fallback?: string): string {
  return FRIENDLY_ERRORS[status] || fallback || "Something unexpected happened. Please try again.";
}

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

      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit with backoff)
      if (resp.ok || (resp.status >= 400 && resp.status < 500 && resp.status !== 408)) {
        return resp;
      }

      // Server errors — retry
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
    resp = await fetchWithRetry(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
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
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

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
      } catch { /* ignore partial leftovers */ }
    }
  }

  onDone();
}

export async function analyzeDocument(text: string, fileName: string) {
  const resp = await fetchWithRetry(ANALYZE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ text, fileName }),
  }, { timeoutMs: 50000 });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || friendlyError(resp.status, "Failed to analyze document"));
  }

  return resp.json();
}

const EXTRACT_URL_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-url`;

export async function analyzeUrl(url: string) {
  const resp = await fetchWithRetry(EXTRACT_URL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ url }),
  }, { timeoutMs: 50000 });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || friendlyError(resp.status, "Failed to analyze URL"));
  }

  return resp.json();
}

export async function analyzeImage(imageBase64: string, mimeType: string, fileName: string) {
  const resp = await fetchWithRetry(ANALYZE_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ imageBase64, mimeType, fileName }),
  }, { timeoutMs: 55000 });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || friendlyError(resp.status, "Failed to analyze image"));
  }

  return resp.json();
}
