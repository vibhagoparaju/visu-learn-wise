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

  const budget = await checkAndIncrementBudget(auth.userId, 1500, cors);
  if (budget) return budget;

  try {
    const { board, grade, subject, chapter, university, stream } = await req.json();
    if (!board || typeof board !== "string") {
      return new Response(JSON.stringify({ error: "board is required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let prompt: string;
    if (chapter) {
      prompt = `Generate subtopics for Board: ${board}, Grade: ${grade || "General"}, Subject: ${subject}, Chapter: ${chapter}. Use EXACT names from official ${board} textbooks. Return JSON: {"topics":[{"name":"...","description":"...","difficulty":"beginner|intermediate|advanced"}]} 6-15 items. Return ONLY JSON.`;
    } else if (subject) {
      prompt = `Generate complete chapter list for Board: ${board}, Grade: ${grade || "General"}, Subject: ${subject}. Use EXACT chapter names from official syllabus. Return JSON: {"chapters":[{"number":1,"name":"...","description":"...","topicCount":8,"difficulty":"..."}]}. Return ONLY JSON.`;
    } else {
      const uniContext = university ? `University: ${university}\nStream: ${stream || "General"}\n` : "";
      prompt = `List subjects for Board: ${board}\n${uniContext}Grade: ${grade || "General"}. Return JSON: {"subjects":[{"name":"...","icon":"emoji","topicCount":number}]} 6-12 items. Return ONLY JSON.`;
    }

    const models = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError = "Failed to generate syllabus";

    for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
      const model = attempt === 0 ? models[0] : models[1];
      try {
        const response = await fetchWithTimeout(
          `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }) },
          TIMEOUT_MS
        );

        if (response.status === 429) {
          if (attempt < MAX_RETRIES) { await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt))); continue; }
          return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
        }

        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify(parsed), { headers: { ...cors, "Content-Type": "application/json" } });
          }
          lastError = "Failed to parse syllabus";
        } else {
          lastError = `AI service error (${response.status})`;
        }
      } catch (e: any) {
        lastError = e.name === "AbortError" ? "Request timed out." : "AI service temporarily unavailable";
        console.error(`Generate-syllabus attempt ${attempt + 1}:`, e.message || e);
      }
      if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }

    return new Response(JSON.stringify({ error: lastError }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-syllabus error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
