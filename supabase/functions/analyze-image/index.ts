import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor, isOriginAllowed, authenticateRequest, checkAndIncrementBudget } from "../_shared/cors.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";
const TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeadersFor(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const auth = await authenticateRequest(req, cors);
  if (auth instanceof Response) return auth;

  const budget = await checkAndIncrementBudget(auth.userId, 3000, cors);
  if (budget) return budget;

  try {
    const body = await req.json();
    const imageBase64 = body.imageBase64;
    const mimeType = String(body.mimeType || "image/jpeg");
    const fileName = String(body.fileName || "image").slice(0, 255).replace(/[<>]/g, "");

    if (!imageBase64 || imageBase64.length < 100) {
      return new Response(JSON.stringify({ error: "Image data is too small or missing" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (imageBase64.length > 20_000_000) {
      return new Response(JSON.stringify({ error: "Image is too large." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `Extract text (OCR) from any language. Preserve original language. Return JSON:
{"extracted_text":"...","topics":["..."],"summary":"...","key_points":["..."],"formulas":["..."],"detected_language":"ISO code"}
If no readable text: {"extracted_text":"","topics":[],"summary":"","key_points":[],"formulas":[],"error":"No readable text found."}
Return ONLY JSON.`;

    const models = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError = "Failed to analyze image";

    for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
      const model = attempt === 0 ? models[0] : models[1];
      try {
        const response = await fetchWithTimeout(
          `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nImage: "${fileName}"` }, { inlineData: { mimeType, data: imageBase64 } }] }] }) },
          TIMEOUT_MS
        );

        if (response.status === 429) {
          if (attempt < MAX_RETRIES) { await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt))); continue; }
          return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
        }

        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          let parsed;
          try {
            const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = { extracted_text: content, topics: [], summary: content, key_points: [], formulas: [] };
          }
          return new Response(JSON.stringify(parsed), { headers: { ...cors, "Content-Type": "application/json" } });
        }
        lastError = `AI service error (${response.status})`;
      } catch (e: any) {
        lastError = e.name === "AbortError" ? "Analysis timed out." : "AI service temporarily unavailable";
        console.error(`Analyze-image attempt ${attempt + 1}:`, e.message || e);
      }
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    return new Response(JSON.stringify({ error: lastError }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Analyze-image error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
