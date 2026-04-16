import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";
const TIMEOUT_MS = 45_000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const text = String(body.text || "").slice(0, 50000);
    const fileName = String(body.fileName || "document").slice(0, 255).replace(/[<>]/g, "");

    if (!text || text.length < 10) {
      return new Response(
        JSON.stringify({ error: "Document text is too short to analyze" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemPrompt = `You are an AI document analyzer for a study platform. Analyze the provided document text and extract structured information.

MULTILINGUAL RULES:
- Auto-detect the language of the document
- Write the summary and key_points in the SAME language as the document
- If the document contains mixed languages, use the dominant language for output
- Support ALL languages including non-Latin scripts (Hindi, Arabic, Chinese, Japanese, Korean, etc.)

Return a JSON object with exactly this structure:
{
  "topics": ["topic1", "topic2", ...],
  "summary": "A clear, concise summary of the document (in the document's language)",
  "key_points": ["point1", "point2", ...],
  "formulas": ["formula1", "formula2", ...],
  "detected_language": "ISO 639-1 code (e.g. en, hi, fr, ar, zh)"
}

Be thorough but concise. Extract all key topics, important points, and any mathematical/scientific formulas.
Return ONLY the JSON object, no markdown formatting or code blocks.`;

    const models = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError = "Failed to analyze document";

    for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
      const model = attempt === 0 ? models[0] : models[1];
      try {
        const response = await fetchWithTimeout(
          `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: `${systemPrompt}\n\nAnalyze this document titled "${fileName}":\n\n${text.substring(0, 15000)}` }] },
              ],
            }),
          },
          TIMEOUT_MS
        );

        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
            continue;
          }
          return new Response(
            JSON.stringify({ error: "Rate limited. Please try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (response.ok) {
          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          let parsed;
          try {
            const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = { topics: [], summary: content, key_points: [], formulas: [] };
          }
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        lastError = `AI service error (${response.status})`;
      } catch (e: any) {
        lastError = e.name === "AbortError" ? "Analysis timed out. Please try again." : "AI service temporarily unavailable";
        console.error(`Analyze attempt ${attempt + 1} failed (${model}):`, e.message || e);
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    return new Response(
      JSON.stringify({ error: lastError }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Analyze function error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
