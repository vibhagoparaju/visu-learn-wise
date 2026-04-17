import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor, isOriginAllowed, authenticateRequest, checkAndIncrementBudget } from "../_shared/cors.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";
const TIMEOUT_MS = 40_000;
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

  const budget = await checkAndIncrementBudget(auth.userId, 2000, cors);
  if (budget) return budget;

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL format." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const pageResp = await fetch(parsedUrl.toString(), { headers: { "User-Agent": "Mozilla/5.0 (compatible; VISU-Bot/1.0)", Accept: "text/html,application/xhtml+xml,text/plain" }, redirect: "follow" });
    if (!pageResp.ok) {
      return new Response(JSON.stringify({ error: `Could not access URL (${pageResp.status}).` }), { status: 422, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const contentType = pageResp.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return new Response(JSON.stringify({ error: "URL does not point to a readable webpage." }), { status: 422, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const html = await pageResp.text();
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, " ").trim().slice(0, 50000);

    if (text.length < 50) {
      return new Response(JSON.stringify({ error: "Could not extract enough readable content." }), { status: 422, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 255) : parsedUrl.hostname;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `Analyze this webpage. Return JSON: {"topics":["..."],"summary":"...","key_points":["..."],"formulas":["..."]}. Return ONLY JSON.`;

    const models = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError = "Failed to analyze URL";

    for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
      const model = attempt === 0 ? models[0] : models[1];
      try {
        const aiResp = await fetchWithTimeout(
          `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n"${title}":\n${text.substring(0, 15000)}` }] }] }) },
          TIMEOUT_MS
        );

        if (aiResp.status === 429) {
          if (attempt < MAX_RETRIES) { await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt))); continue; }
          return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
        }

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          let parsed;
          try {
            const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = { topics: [], summary: content, key_points: [], formulas: [] };
          }
          return new Response(JSON.stringify({ ...parsed, title, url: parsedUrl.toString() }), { headers: { ...cors, "Content-Type": "application/json" } });
        }
        lastError = `AI service error (${aiResp.status})`;
      } catch (e: any) {
        lastError = e.name === "AbortError" ? "Analysis timed out." : "AI service temporarily unavailable";
        console.error(`Extract-url attempt ${attempt + 1}:`, e.message || e);
      }
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    return new Response(JSON.stringify({ error: lastError }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Extract URL error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
