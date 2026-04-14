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
    const { topic, explanation } = await req.json();

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are an expert educational video curator. For the topic "${topic}", suggest exactly 3 high-quality YouTube videos that best explain this concept.

${explanation ? `Context: ${explanation.slice(0, 300)}` : ""}

CRITICAL RULES:
- You MUST provide the actual YouTube video ID for each video in the "videoId" field
- The videoId should be a real 11-character YouTube video ID (e.g., "dQw4w9WgXcQ")
- Only suggest videos from well-known educational channels that you're confident exist
- Prioritize: Khan Academy, 3Blue1Brown, CrashCourse, Organic Chemistry Tutor, Physics Wallah, Vedantu, Professor Dave Explains, TED-Ed, Kurzgesagt, MIT OpenCourseWare
- Also provide a searchQuery as fallback
- If you're not confident about a specific videoId, set it to null

Return ONLY a JSON array:
[
  {
    "title": "Video title",
    "channel": "Channel Name",
    "videoId": "dQw4w9WgXcQ or null",
    "searchQuery": "fallback YouTube search query",
    "duration": "12:30",
    "keyPoints": ["point 1", "point 2", "point 3"]
  }
]

Return ONLY valid JSON, no markdown.`;

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
            { role: "system", content: "You are a helpful educational video curator. Return only valid JSON. For videoId, provide real YouTube video IDs when you're confident they exist, otherwise use null." },
            { role: "user", content: prompt },
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to search videos" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Failed to parse video suggestions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videos = JSON.parse(jsonMatch[0]);

    // Clean up videoId — ensure it looks like a valid YouTube ID
    const cleaned = videos.map((v: any) => ({
      ...v,
      videoId: v.videoId && typeof v.videoId === "string" && /^[a-zA-Z0-9_-]{11}$/.test(v.videoId)
        ? v.videoId
        : null,
    }));

    return new Response(
      JSON.stringify({ videos: cleaned }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("search-videos error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
