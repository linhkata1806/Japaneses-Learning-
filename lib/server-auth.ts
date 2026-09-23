import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export type Learner = { id: string; email: string; displayName: string; provider: "chatgpt" | "email" };

export async function getLearner(request: Request): Promise<Learner | null> {
  const chatgpt = await getChatGPTUser();
  if (chatgpt) {
    return { id: `chatgpt:${chatgpt.userId}`, email: chatgpt.email, displayName: chatgpt.displayName, provider: "chatgpt" };
  }

  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null;

  try {
    const response = await fetch(new URL("/auth/v1/user", env.SUPABASE_URL), {
      headers: { authorization: `Bearer ${token}`, apikey: env.SUPABASE_PUBLISHABLE_KEY },
    });
    if (!response.ok) return null;
    const user = await response.json() as { id?: string; email?: string; user_metadata?: { full_name?: string } };
    if (!user.id || !user.email) return null;
    return { id: `email:${user.id}`, email: user.email, displayName: user.user_metadata?.full_name || user.email, provider: "email" };
  } catch {
    return null;
  }
}

export async function ensureProfile(learner: Learner): Promise<void> {
  if (!env.DB) throw new Error("D1 unavailable");
  await env.DB.prepare(
    "INSERT OR IGNORE INTO profiles (id, provider, email, display_name, timezone, created_at) VALUES (?, ?, ?, ?, 'Asia/Ho_Chi_Minh', ?)"
  ).bind(learner.id, learner.provider, learner.email, learner.displayName, new Date().toISOString()).run();
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
