import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor, isOriginAllowed, authenticateRequest, checkAndIncrementBudget } from "../_shared/cors.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const IMAGE_MODEL = "gemini-2.0-flash-exp-image-generation";
const SVG_FALLBACK_MODEL = "gemini-2.0-flash";
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function tryImageGeneration(apiKey: string, prompt: string): Promise<{ imageUrl?: string; description?: string } | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${GEMINI_BASE}/${IMAGE_MODEL}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }) },
        TIMEOUT_MS
      );

      if (response.status === 429) {
        if (attempt < MAX_RETRIES) { await new Promise((r) => setTimeout(r, 2000)); continue; }
        return null;
      }

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        let imageUrl = "", textContent = "";
        for (const part of parts) {
          if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          if (part.text) textContent += part.text;
        }
        if (imageUrl) return { imageUrl, description: textContent };
      }
    } catch (e: any) {
      console.error(`Image gen attempt ${attempt + 1}:`, e.message || e);
    }
  }
  return null;
}

async function trySvgFallback(apiKey: string, topic: string, explanation?: string): Promise<{ svgCode?: string; description?: string } | null> {
  try {
    const svgPrompt = `Create a simple, clean SVG diagram (max 400x300px viewBox) explaining: "${topic}".
${explanation ? `Based on this explanation:\n${explanation.slice(0, 400)}\n` : ""}
Use clear labels, simple shapes (boxes, arrows, circles), max 5-7 elements, high contrast colors.
Return ONLY valid SVG starting with <svg> and ending with </svg>. No markdown, no explanation, just the SVG code.`;

    const response = await fetchWithTimeout(
      `${GEMINI_BASE}/${SVG_FALLBACK_MODEL}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: svgPrompt }] }] }) },
      TIMEOUT_MS
    );

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
      if (svgMatch) return { svgCode: svgMatch[0], description: `Diagram for ${topic}` };
    }
  } catch (e: any) {
    console.error("SVG fallback failed:", e.message || e);
  }
  return null;
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

  const budget = await checkAndIncrementBudget(auth.userId, 4000, cors);
  if (budget) return budget;

  try {
    const { topic, explanation } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "topic is required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const prompt = `Create a clean educational visual for: "${topic}".
${explanation ? `Match this explanation:\n"""${explanation.slice(0, 600)}"""\n` : ""}
RULES: White background. Max 5-7 labeled elements. Bold distinct colors. No decoration. Readable in 5 seconds.`;

    const imgResult = await tryImageGeneration(GEMINI_API_KEY, prompt);
    if (imgResult?.imageUrl) {
      return new Response(JSON.stringify(imgResult), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Fallback to SVG
    const svgResult = await trySvgFallback(GEMINI_API_KEY, topic, explanation);
    if (svgResult?.svgCode) {
      return new Response(JSON.stringify(svgResult), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Could not generate visual. Please try again." }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-visual error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
