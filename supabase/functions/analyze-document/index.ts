import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are an AI document analyzer for a study platform. Analyze the provided document text and extract structured information.

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
Return ONLY the JSON object, no markdown formatting or code blocks.`,
            },
            {
              role: "user",
              content: `Analyze this document titled "${fileName}":\n\n${text.substring(0, 15000)}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    // Parse the JSON from the AI response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        topics: [],
        summary: content,
        key_points: [],
        formulas: [],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analyze function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
