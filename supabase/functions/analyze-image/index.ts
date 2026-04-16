import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRIMARY_MODEL = "google/gemini-2.5-flash";
const FALLBACK_MODEL = "google/gemini-3-flash-preview";
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
    const imageBase64 = body.imageBase64;
    const mimeType = String(body.mimeType || "image/jpeg");
    const fileName = String(body.fileName || "image").slice(0, 255).replace(/[<>]/g, "");

    if (!imageBase64 || imageBase64.length < 100) {
      return new Response(
        JSON.stringify({ error: "Image data is too small or missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (imageBase64.length > 20_000_000) {
      return new Response(
        JSON.stringify({ error: "Image is too large. Please use an image under 15MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI image analyzer for a study platform called VISU. You receive images of notes, book pages, screenshots, or handwritten content.

MULTILINGUAL OCR RULES:
- Extract text in ANY language including non-Latin scripts (Hindi, Arabic, Chinese, Japanese, Korean, Tamil, etc.)
- Preserve the original language of the text — do NOT translate
- Write the summary and key_points in the SAME language as the extracted text
- Support mixed-language content; use the dominant language for summary
- Handle handwritten text in any script

Your tasks:
1. Extract ALL readable text from the image (OCR). Ignore decorative elements, logos, or non-relevant visuals.
2. Analyze the extracted text and structure it for learning.

Return a JSON object with exactly this structure:
{
  "extracted_text": "The full text extracted from the image (in original language)",
  "topics": ["topic1", "topic2", ...],
  "summary": "A clear, concise summary of the content (in the document's language)",
  "key_points": ["point1", "point2", ...],
  "formulas": ["formula1", "formula2", ...],
  "detected_language": "ISO 639-1 code (e.g. en, hi, fr, ar, zh)"
}

If the image has NO readable text or is too blurry/low-quality, return:
{
  "extracted_text": "",
  "topics": [],
  "summary": "",
  "key_points": [],
  "formulas": [],
  "error": "No readable text found in image. Please upload a clearer image."
}

Be thorough but concise. Return ONLY the JSON object, no markdown formatting or code blocks.`;

    const userContent = [
      { type: "text", text: `Analyze this image titled "${fileName}". Extract all text and structure it for studying.` },
      { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
    ];

    // Only gemini-2.5-flash supports vision well; fallback model is text-only with extracted context
    const models = [PRIMARY_MODEL, FALLBACK_MODEL];
    let lastError = "Failed to analyze image";

    for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
      const model = attempt === 0 ? models[0] : models[1];
      try {
        const response = await fetchWithTimeout(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent },
              ],
            }),
          },
          TIMEOUT_MS
        );

        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || "{}";
          let parsed;
          try {
            const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            parsed = JSON.parse(cleaned);
          } catch {
            parsed = { extracted_text: content, topics: [], summary: content, key_points: [], formulas: [] };
          }
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        lastError = `AI service error (${response.status})`;
      } catch (e: any) {
        lastError = e.name === "AbortError" ? "Analysis timed out. Please try again." : "AI service temporarily unavailable";
        console.error(`Analyze-image attempt ${attempt + 1} failed (${model}):`, e.message || e);
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
    console.error("Analyze-image error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
