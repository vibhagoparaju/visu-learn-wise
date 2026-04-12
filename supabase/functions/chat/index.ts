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
    const { messages, mode, difficulty } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const difficultyPrompts: Record<string, string> = {
      beginner: "Explain concepts in simple terms with everyday analogies. Use short sentences. Add emojis for engagement.",
      intermediate: "Give balanced explanations with some technical detail. Include examples and structured breakdowns.",
      advanced: "Provide deep, exam-focused explanations. Use technical terminology. Include edge cases and detailed analysis.",
    };

    const modePrompts: Record<string, string> = {
      chat: "You are VISU, a personal AI tutor. Be encouraging, clear, and supportive. Use step-by-step explanations. Add relevant emojis. When appropriate, ask follow-up questions to check understanding.",
      teachback: "The student is explaining a concept back to you (Teach-Back mode). Evaluate their explanation. Point out what they got right, gently correct mistakes, and fill in gaps. Be encouraging.",
      quiz: "Generate a multiple-choice question about the topic. Format: Start with the question, then list options as A), B), C), D). After the options, add a line '---ANSWER---' followed by the correct letter and explanation.",
      summarize: "Summarize the provided content clearly. Extract: 1) Key topics, 2) Important concepts, 3) Key formulas or definitions. Format with headers and bullet points.",
      lazy: "Give a super concise 2-3 minute micro-lesson on the topic. Use bullet points, key takeaways only. Keep it light and fun with emojis.",
    };

    const systemPrompt = `${modePrompts[mode] || modePrompts.chat}

Difficulty level: ${difficultyPrompts[difficulty] || difficultyPrompts.beginner}

Guidelines:
- Always be encouraging and supportive
- Use phrases like "Let's break this down 👇", "Great question!", "Nice try! Keep going 🔥"
- Structure longer answers with headers, bullet points, and numbered lists
- Highlight key terms in **bold**
- If the student seems confused, simplify and try a different angle
- End responses with a suggestion for what to learn next when appropriate`;

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
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
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
          JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
