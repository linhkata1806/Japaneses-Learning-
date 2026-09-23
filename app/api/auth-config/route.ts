import { env } from "cloudflare:workers";

export async function GET() {
  return Response.json({
    supabaseUrl: env.SUPABASE_URL || null,
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY || null,
    geminiAvailable: Boolean(env.GEMINI_API_KEY),
  });
}
