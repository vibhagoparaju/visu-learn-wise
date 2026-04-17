import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeadersFor, isOriginAllowed, authenticateRequest, checkAndIncrementBudget } from "../_shared/cors.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

interface YouTubeVideo {
  title: string; channel: string; videoId: string; thumbnail: string;
  duration: string; searchQuery: string; keyPoints: string[];
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
  if (!searchResp.ok) throw new Error(`YouTube search failed: ${searchResp.status}`);

  const searchData = await searchResp.json();
  const items = searchData.items || [];
  if (items.length === 0) return [];

  const videoIds = items.map((item: any) => item.id.videoId).join(",");
  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("part", "snippet,contentDetails,status");
  detailsUrl.searchParams.set("id", videoIds);
  detailsUrl.searchParams.set("key", apiKey);

  const detailsResp = await fetch(detailsUrl.toString());
  if (!detailsResp.ok) throw new Error(`YouTube details failed: ${detailsResp.status}`);

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
      searchQuery: query, keyPoints: [],
    }));
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0"), m = parseInt(match[2] || "0"), s = parseInt(match[3] || "0");
  const sPad = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sPad}`;
  return `${m}:${sPad}`;
}

async function geminiCall(apiKey: string, messages: { role: string; text: string }[], model: string): Promise<any | null> {
  for (let attempt = 0; attempt < MAX_RETRIES + 1; attempt++) {
    try {
      const resp = await fetchWithTimeout(
        `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: messages.map((m) => ({ role: m.role === "system" ? "user" : m.role === "assistant" ? "model" : m.role, parts: [{ text: m.text }] })) }) },
        TIMEOUT_MS
      );
      if (resp.ok) return await resp.json();
      if (resp.status === 429 || resp.status === 402) return null;
    } catch (e: any) { console.error(`Gemini attempt ${attempt + 1}:`, e.message || e); }
    if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  return null;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeadersFor(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isOriginAllowed(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const auth = await authenticateRequest(req, cors);
  if (auth instanceof Response) return auth;

  const budget = await checkAndIncrementBudget(auth.userId, 800, cors);
  if (budget) return budget;

  try {
    const { topic, explanation } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "topic is required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    let searchQueries: string[] = [];

    if (GEMINI_API_KEY) {
      try {
        const qData = await geminiCall(GEMINI_API_KEY, [
          { role: "user", text: `Return ONLY a JSON array of 3 specific YouTube search queries to find educational videos about: "${topic}"${explanation ? `\nContext: ${explanation.slice(0, 300)}` : ""}` },
        ], "gemini-2.0-flash");
        if (qData) {
          const qContent = qData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const qMatch = qContent.match(/\[[\s\S]*?\]/);
          if (qMatch) searchQueries = JSON.parse(qMatch[0]).filter((q: any) => typeof q === "string").slice(0, 3);
        }
      } catch (e) { console.error("Query gen error:", e); }
    }

    if (searchQueries.length === 0) searchQueries = [`${topic} explained tutorial`];

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (YOUTUBE_API_KEY) {
      try {
        let allVideos: YouTubeVideo[] = [];
        const seenIds = new Set<string>();
        for (const query of searchQueries) {
          const results = await searchYouTube(query, YOUTUBE_API_KEY);
          for (const v of results) {
            if (!seenIds.has(v.videoId)) { seenIds.add(v.videoId); allVideos.push({ ...v, searchQuery: query }); }
          }
          if (allVideos.length >= 5) break;
        }
        const videos = allVideos.slice(0, 5);

        if (videos.length > 0 && GEMINI_API_KEY) {
          try {
            const titles = videos.map((v) => v.title).join("\n");
            const kpData = await geminiCall(GEMINI_API_KEY, [
              { role: "user", text: `For each video about "${topic}", generate 3 key points each. Videos:\n${titles}\n\nReturn JSON array: [["p1","p2","p3"],...]` },
            ], "gemini-2.0-flash");
            if (kpData) {
              const content = kpData.candidates?.[0]?.content?.parts?.[0]?.text || "";
              const match = content.match(/\[[\s\S]*\]/);
              if (match) {
                const points = JSON.parse(match[0]);
                videos.forEach((v, i) => { if (points[i] && Array.isArray(points[i])) v.keyPoints = points[i]; });
              }
            }
          } catch { /* optional */ }
        }

        if (videos.length > 0) {
          return new Response(JSON.stringify({ videos }), { headers: { ...cors, "Content-Type": "application/json" } });
        }
      } catch (e) { console.error("YouTube error:", e); }
    }

    if (!GEMINI_API_KEY) throw new Error("No API keys configured");

    const prompt = `For "${topic}", suggest 3 educational YouTube videos. Return JSON array: [{"title":"...","channel":"...","videoId":null,"thumbnail":"","searchQuery":"...","duration":"12:30","keyPoints":["p1","p2","p3"]}]`;
    const data = await geminiCall(GEMINI_API_KEY, [{ role: "user", text: prompt }], "gemini-2.5-flash");
    if (!data) {
      return new Response(JSON.stringify({ error: "AI temporarily unavailable." }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "No videos found." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const videos = JSON.parse(jsonMatch[0]).map((v: any) => ({
      ...v,
      videoId: v.videoId && /^[a-zA-Z0-9_-]{11}$/.test(v.videoId) ? v.videoId : null,
      thumbnail: v.thumbnail || "",
    }));

    return new Response(JSON.stringify({ videos }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("search-videos error:", e);
    return new Response(JSON.stringify({ error: "Something went wrong." }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
