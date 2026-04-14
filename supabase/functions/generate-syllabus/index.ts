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
    const { board, grade, subject, chapter } = await req.json();

    if (!board || typeof board !== "string") {
      return new Response(
        JSON.stringify({ error: "board is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt: string;

    if (chapter) {
      // Level 3: Get subtopics for a specific chapter
      prompt = `You are an expert curriculum designer with deep knowledge of the ${board} education system.

Generate a detailed list of subtopics for:
Board: ${board}
Grade/Year: ${grade || "General"}
Subject: ${subject}
Chapter: ${chapter}

IMPORTANT RULES:
- List ALL subtopics that are actually taught in this chapter under the ${board} board for ${grade}
- Use the EXACT topic names as they appear in official ${board} textbooks and syllabi
- Order topics from foundational concepts to advanced applications
- Include both theory topics and practical/numerical topics
- Do NOT skip any important concept
- Assign accurate difficulty levels based on student experience

Return a JSON object:
{
  "topics": [
    { "name": "Exact Subtopic Name", "description": "One clear sentence explaining what students learn", "difficulty": "beginner|intermediate|advanced" }
  ]
}

Include 6-15 subtopics depending on the chapter size. Return ONLY valid JSON, no markdown.`;
    } else if (subject) {
      // Level 2: Get chapters for a specific subject
      prompt = `You are an expert curriculum designer with deep knowledge of the ${board} education system.

Generate the COMPLETE chapter list for:
Board: ${board}
Grade/Year: ${grade || "General"}
Subject: ${subject}

IMPORTANT RULES:
- List ALL chapters exactly as they appear in the official ${board} ${grade} ${subject} textbook
- Use EXACT chapter names from the official syllabus (e.g., for CBSE Class 10 Science: "Chemical Reactions and Equations", "Acids, Bases and Salts", etc.)
- Maintain the EXACT order chapters appear in the textbook
- Do NOT combine or skip chapters
- Include the chapter number
- For each chapter, provide a count of key subtopics it contains

Return a JSON object:
{
  "chapters": [
    { "number": 1, "name": "Exact Chapter Name", "description": "Brief chapter summary", "topicCount": 8, "difficulty": "beginner|intermediate|advanced" }
  ]
}

Return ONLY valid JSON, no markdown.`;
    } else {
      // Level 1: Get subjects
      prompt = `You are an expert curriculum designer with deep knowledge of the ${board} education system.

Generate the list of subjects for:
Board: ${board}
Grade/Year: ${grade || "General"}

IMPORTANT RULES:
- List ALL subjects that are officially part of the ${board} ${grade} curriculum
- Use EXACT subject names as they appear in official ${board} documentation
- Include both compulsory and common elective subjects
- Provide accurate topic counts based on the actual number of chapters

Return a JSON object:
{
  "subjects": [
    { "name": "Exact Subject Name", "icon": "emoji", "topicCount": number }
  ]
}

Include 6-12 subjects. Return ONLY valid JSON, no markdown.`;
    }

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
            { role: "system", content: "You are an expert educational curriculum specialist. You have precise knowledge of Indian education boards (CBSE, ICSE, State Boards) and university syllabi. Always return accurate, complete, and well-structured syllabus data. Return only valid JSON, no markdown code blocks." },
            { role: "user", content: prompt },
          ],
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
        JSON.stringify({ error: "Failed to generate syllabus" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Failed to parse syllabus data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-syllabus error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
