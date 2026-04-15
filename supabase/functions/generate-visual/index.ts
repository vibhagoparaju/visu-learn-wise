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

    // Classify the visual type from the explanation
    const classifyPrompt = explanation
      ? `Based on this explanation, what type of visual would best represent it? Choose ONE: flow diagram, concept breakdown, comparison chart, or relationship map.\n\nExplanation: ${explanation.slice(0, 400)}`
      : "";

    const prompt = `You are an expert educational illustrator. Create a SINGLE, focused visual that directly represents this concept: "${topic}".

${explanation ? `The AI tutor explained it as follows (your visual MUST match this explanation exactly):\n"""${explanation.slice(0, 600)}"""\n` : ""}
${classifyPrompt ? `First, decide which visual type fits best: flow diagram, concept breakdown, comparison chart, or relationship map. Then generate that specific type.\n` : ""}

STRICT RULES:
1. ACCURACY — Every element in the visual must come directly from the explanation above. Do NOT add information that isn't mentioned.
2. ONE IDEA — Show only ONE main concept per visual. No side topics.
3. MINIMAL ELEMENTS — Maximum 5-7 labeled elements. Fewer is better.
4. CLEAR LABELS — Every box, arrow, or shape must have a short, readable text label.
5. STEP-BY-STEP — If it's a process, show numbered steps with arrows (1 → 2 → 3).
6. WHITE BACKGROUND — Clean white background, no textures or gradients.
7. HIGH CONTRAST — Use bold, distinct colors (blue, green, orange) to separate concepts. Black text on light backgrounds.
8. NO DECORATION — Zero decorative elements. No icons, emojis, or clip art. Purely informational.
9. READABLE IN 5 SECONDS — A student should understand the core idea within seconds.
10. HIERARCHY — The most important concept should be visually largest or centered.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate visual" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const imageUrl = message?.images?.[0]?.image_url?.url;
    const textContent = message?.content || "";

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image was generated. Try a different topic." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, description: textContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-visual error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
