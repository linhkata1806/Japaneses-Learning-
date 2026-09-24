import { env } from "cloudflare:workers";
import { getGoogleConfig, hasGoogleSessionTable } from "@/lib/google-oauth";

export async function GET() {
  const googleAvailable = Boolean(getGoogleConfig()) && await hasGoogleSessionTable();
  return Response.json({
    googleAvailable,
    geminiAvailable: Boolean(env.GEMINI_API_KEY),
  }, { headers: { "cache-control": "no-store" } });
}
