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
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format. Please enter a valid http/https URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the webpage
    const pageResp = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VISU-Bot/1.0)",
        "Accept": "text/html,application/xhtml+xml,text/plain",
      },
      redirect: "follow",
    });

    if (!pageResp.ok) {
      return new Response(
        JSON.stringify({ error: `Could not access URL (status ${pageResp.status}). The page may be restricted.` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = pageResp.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return new Response(
        JSON.stringify({ error: "URL does not point to a readable webpage." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await pageResp.text();

    // Strip HTML to extract readable text
    let text = html
      // Remove script and style blocks
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      // Remove all remaining tags
      .replace(/<[^>]+>/g, " ")
      // Decode common entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Limit to 50k chars
    text = text.slice(0, 50000);

    if (text.length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract enough readable content from this URL." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get page title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 255) : parsedUrl.hostname;

    // Now analyze with AI (reuse same logic as analyze-document)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are an AI content analyzer for a study platform. Analyze the provided webpage text and extract structured learning content.

Return a JSON object with exactly this structure:
{
  "topics": ["topic1", "topic2", ...],
  "summary": "A clear, concise summary of the content",
  "key_points": ["point1", "point2", ...],
  "formulas": ["formula1", "formula2", ...]
}

Be thorough but concise. Extract all key topics, important points, and any mathematical/scientific formulas.
Return ONLY the JSON object, no markdown formatting or code blocks.`,
          },
          {
            role: "user",
            content: `Analyze this webpage titled "${title}":\n\n${text.substring(0, 15000)}`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { topics: [], summary: content, key_points: [], formulas: [] };
    }

    return new Response(
      JSON.stringify({ ...parsed, title, url: parsedUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Extract URL error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
