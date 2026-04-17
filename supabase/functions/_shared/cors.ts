// Shared CORS + auth utilities for all edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /\.lovable\.app$/,
  /\.lovable\.dev$/,
  /\.lovableproject\.com$/,
];

export function corsHeadersFor(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_PATTERNS.some((re) => re.test(origin)) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  return ALLOWED_PATTERNS.some((re) => re.test(origin));
}

export async function authenticateRequest(req: Request, cors: Record<string, string>): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }
  const token = authHeader.slice(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }
  return { userId: data.user.id };
}

const DAILY_TOKEN_BUDGET = 50_000;

export async function checkAndIncrementBudget(userId: string, estTokens: number, cors: Record<string, string>): Promise<Response | null> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const today = new Date().toISOString().split("T")[0];
    const { data: profile } = await admin
      .from("profiles")
      .select("daily_tokens_used, daily_tokens_reset_at")
      .eq("id", userId)
      .maybeSingle();

    let used = profile?.daily_tokens_used || 0;
    if (profile?.daily_tokens_reset_at !== today) {
      used = 0;
    }
    if (used >= DAILY_TOKEN_BUDGET) {
      return new Response(JSON.stringify({ error: "Daily AI usage limit reached. Try again tomorrow." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
    }
    // Fire-and-forget increment
    admin.from("profiles").update({ daily_tokens_used: used + estTokens, daily_tokens_reset_at: today }).eq("id", userId).then(() => {}).catch(() => {});
    return null;
  } catch (e) {
    console.error("Budget check failed:", e);
    return null; // fail open
  }
}
