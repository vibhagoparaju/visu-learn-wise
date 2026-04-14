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

    const prompt = `You are an expert educational video curator. For the topic "${topic}", suggest exactly 3 high-quality YouTube videos that best explain this concept to students.

${explanation ? `Context about the topic: ${explanation.slice(0, 300)}` : ""}

IMPORTANT RULES:
- Suggest videos from REAL, well-known educational YouTube channels
- Prioritize these trusted channels (pick the most relevant ones):
  * Khan Academy, 3Blue1Brown, CrashCourse, Organic Chemistry Tutor
  * Physics Wallah, Vedantu, Unacademy, BYJU'S (for Indian curriculum)
  * Professor Dave Explains, TED-Ed, Kurzgesagt, MIT OpenCourseWare
  * Numberphile, Veritasium, SmarterEveryDay, MinutePhysics
- The "searchQuery" must be a realistic YouTube search string that would actually find this video
- Include the channel name in the searchQuery for accuracy (e.g., "photosynthesis Khan Academy")
- Estimate realistic video durations
- Key points should reflect what the video actually covers

Return ONLY a JSON array:
[
  {
    "title": "Descriptive video title",
    "channel": "Channel Name",
    "searchQuery": "specific search query with channel name",
    "duration": "12:30",
    "keyPoints": ["key concept 1", "key concept 2", "key concept 3"]
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
            { role: "system", content: "You are a helpful educational video curator. Suggest real, findable YouTube videos from well-known channels. Return only valid JSON." },
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

    return new Response(
      JSON.stringify({ videos }),
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
