import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIMEOUT_MS = 30_000;
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

interface YouTubeVideo {
  title: string;
  channel: string;
  videoId: string;
  thumbnail: string;
  duration: string;
  searchQuery: string;
  keyPoints: string[];
}

async function searchYouTube(query: string, apiKey: string): Promise<YouTubeVideo[]> {
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("videoEmbeddable", "true");
  searchUrl.searchParams.set("videoCategoryId", "27");
  searchUrl.searchParams.set("maxResults", "5");
  searchUrl.searchParams.set("relevanceLanguage", "en");
  searchUrl.searchParams.set("safeSearch", "strict");
  searchUrl.searchParams.set("key", apiKey);

  const searchResp = await fetch(searchUrl.toString());
  if (!searchResp.ok) {
    const errText = await searchResp.text();
    console.error("YouTube search error:", searchResp.status, errText);
    throw new Error(`YouTube API search failed: ${searchResp.status}`);
  }

  const searchData = await searchResp.json();
  const items = searchData.items || [];
  if (items.length === 0) return [];

  const videoIds = items.map((item: any) => item.id.videoId).join(",");

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "snippet,contentDetails,status");
  detailsUrl.searchParams.set("id", videoIds);
  detailsUrl.searchParams.set("key", apiKey);

  const detailsResp = await fetch(detailsUrl.toString());
  if (!detailsResp.ok) {
    const errText = await detailsResp.text();
    console.error("YouTube details error:", detailsResp.status, errText);
    throw new Error(`YouTube API details failed: ${detailsResp.status}`);
  }

  const detailsData = await detailsResp.json();

  return (detailsData.items || [])
    .filter((v: any) => v.status?.embeddable === true)
    .slice(0, 3)
    .map((v: any) => ({
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      videoId: v.id,
      thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
      duration: formatDuration(v.contentDetails.duration),
      searchQuery: query,
      keyPoints: [],
    }));
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  const sPad = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sPad}`;
  return `${m}:${sPad}`;
}

async function aiCallWithRetry(apiKey: string, messages: any[], models: string[]): Promise<any | null> {
  for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
    const model = attempt === 0 ? models[0] : models[Math.min(attempt, models.length - 1)];
    try {
      const resp = await fetchWithTimeout(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages }),
        },
        TIMEOUT_MS
      );
      if (resp.ok) return await resp.json();
      if (resp.status === 429 || resp.status === 402) return null;
    } catch (e: any) {
      console.error(`AI call attempt ${attempt + 1} failed:`, e.message || e);
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return null;
}

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
    let searchQueries: string[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const qData = await aiCallWithRetry(
          LOVABLE_API_KEY,
          [
            { role: "system", content: "Return ONLY a JSON array of 3 specific YouTube search queries. No markdown, no explanation." },
            {
              role: "user",
              content: `Generate 3 specific YouTube search queries to find the best educational videos about: "${topic}"${explanation ? `\nContext: ${explanation.slice(0, 300)}` : ""}\n\nMake queries specific to the subtopic, not generic. Include terms like the subject area, specific concept names, and "explained" or "tutorial".\nExample for "Quadratic Formula": ["quadratic formula derivation explained","solving quadratic equations step by step tutorial","quadratic formula examples and practice"]`,
            },
          ],
          ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash"]
        );
        if (qData) {
          const qContent = qData.choices?.[0]?.message?.content || "";
          const qMatch = qContent.match(/\[[\s\S]*?\]/);
          if (qMatch) {
            searchQueries = JSON.parse(qMatch[0]).filter((q: any) => typeof q === "string").slice(0, 3);
          }
        }
      } catch (e) {
        console.error("Query generation error:", e);
      }
    }

    if (searchQueries.length === 0) {
      searchQueries = [`${topic} explained tutorial`];
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");

    if (YOUTUBE_API_KEY) {
      try {
        let allVideos: YouTubeVideo[] = [];
        const seenIds = new Set<string>();

        for (const query of searchQueries) {
          const results = await searchYouTube(query, YOUTUBE_API_KEY);
          for (const v of results) {
            if (!seenIds.has(v.videoId)) {
              seenIds.add(v.videoId);
              allVideos.push({ ...v, searchQuery: query });
            }
          }
          if (allVideos.length >= 5) break;
        }

        const videos = allVideos.slice(0, 5);

        if (videos.length > 0 && LOVABLE_API_KEY) {
          try {
            const titles = videos.map((v) => v.title).join("\n");
            const kpData = await aiCallWithRetry(
              LOVABLE_API_KEY,
              [
                { role: "system", content: "Return only valid JSON array." },
                {
                  role: "user",
                  content: `For each of these educational videos about "${topic}", generate 3 key learning points each. Videos:\n${titles}\n\nReturn JSON: [["point1","point2","point3"],...]`,
                },
              ],
              ["google/gemini-2.5-flash-lite", "google/gemini-2.5-flash"]
            );
            if (kpData) {
              const content = kpData.choices?.[0]?.message?.content || "";
              const match = content.match(/\[[\s\S]*\]/);
              if (match) {
                const points = JSON.parse(match[0]);
                videos.forEach((v, i) => {
                  if (points[i] && Array.isArray(points[i])) v.keyPoints = points[i];
                });
              }
            }
          } catch { /* key points enrichment is optional */ }
        }

        if (videos.length > 0) {
          return new Response(
            JSON.stringify({ videos }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.error("YouTube API error, falling back to AI:", e);
      }
    }

    if (!LOVABLE_API_KEY) throw new Error("No API keys configured");

    const prompt = `For the topic "${topic}", suggest 3 high-quality educational YouTube videos.
${explanation ? `Context: ${explanation.slice(0, 300)}` : ""}
Prioritize: Khan Academy, 3Blue1Brown, CrashCourse, Organic Chemistry Tutor, Physics Wallah, Vedantu, TED-Ed.
Return ONLY JSON array:
[{"title":"...","channel":"...","videoId":null,"thumbnail":"","searchQuery":"specific youtube search","duration":"12:30","keyPoints":["p1","p2","p3"]}]`;

    const data = await aiCallWithRetry(
      LOVABLE_API_KEY,
      [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"]
    );

    if (!data) {
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not find videos. Please try a different topic." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videos = JSON.parse(jsonMatch[0]).map((v: any) => ({
      ...v,
      videoId: v.videoId && /^[a-zA-Z0-9_-]{11}$/.test(v.videoId) ? v.videoId : null,
      thumbnail: v.thumbnail || "",
    }));

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("search-videos error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
