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
      beginner: `Use very simple language a 10-year-old can understand. 
- Short sentences only
- Use everyday analogies and real-life examples
- Break every concept into tiny steps
- Use emojis to keep it fun and engaging
- If the topic is basic (alphabets, numbers, colors, shapes), use playful language`,
      intermediate: "Give balanced explanations with some technical detail. Include practical examples and structured breakdowns.",
      advanced: "Provide deep, exam-focused explanations. Use technical terminology. Include edge cases and detailed analysis.",
    };

    const modePrompts: Record<string, string> = {
      chat: `You are VISU, a personal AI tutor. Be encouraging, clear, and supportive.

RESPONSE FORMAT — ALWAYS follow this structure:
## 📖 Explanation
(Clear, step-by-step explanation of the concept)

## 💡 Example
(A practical, relatable example)

## ✅ Key Points
- Point 1
- Point 2
- Point 3

Then optionally ask a follow-up question to check understanding.`,
      teachback: "The student is explaining a concept back to you (Teach-Back mode). Evaluate their explanation. Point out what they got right, gently correct mistakes, and fill in gaps. Be encouraging.",
      quiz: `Generate a multiple-choice question about the topic. Format:

**Question:** (your question here)

**A)** option 1
**B)** option 2
**C)** option 3
**D)** option 4

---
**Answer:** (correct letter) — (brief explanation)`,
      summarize: `Summarize the provided content clearly. Use this structure:
## 📋 Summary
(Brief overview)

## 🔑 Key Concepts
- Concept 1
- Concept 2

## 📝 Important Definitions / Formulas
- Definition or formula`,
      lazy: "Give a super concise 2-3 minute micro-lesson on the topic. Use bullet points, key takeaways only. Keep it light and fun with emojis. Maximum 150 words.",
    };

    const systemPrompt = `${modePrompts[mode] || modePrompts.chat}

Difficulty level: ${difficultyPrompts[difficulty] || difficultyPrompts.beginner}

CRITICAL FORMATTING RULES:
- NEVER use LaTeX, dollar signs ($), or math notation like $x^2$. Write math in plain text: "x squared" or "x^2"
- NEVER use \\( \\) or \\[ \\] for math
- Use **bold** for key terms
- Use bullet points and numbered lists for clarity
- Use ## for section headers
- Keep paragraphs short (2-3 sentences max)
- Use emojis sparingly but effectively

MULTILINGUAL SUPPORT:
- Detect the language the user is writing in
- ALWAYS respond in the SAME language the user uses
- If user writes in Hindi, respond in Hindi. If Spanish, respond in Spanish. Etc.
- Keep section headers and emojis consistent regardless of language

TONE GUIDELINES:
- Always be encouraging and supportive
- Use phrases like "Let's break this down 👇", "Great question!", "Nice try! Keep going 🔥"
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
          model: "google/gemini-2.5-flash",
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
