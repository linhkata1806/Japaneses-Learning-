import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export type Learner = { id: string; email: string; displayName: string; provider: "chatgpt" | "email"; avatarUrl?: string | null };

export async function getLearner(request: Request): Promise<Learner | null> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (token) {
    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null;
    try {
      const response = await fetch(new URL("/auth/v1/user", env.SUPABASE_URL), {
        headers: { authorization: `Bearer ${token}`, apikey: env.SUPABASE_PUBLISHABLE_KEY },
      });
      if (!response.ok) return null;
      const user = await response.json() as { id?: string; email?: string; email_confirmed_at?: string | null; user_metadata?: { full_name?: string; avatar_url?: string } };
      if (!user.id || !user.email || !user.email_confirmed_at) return null;
      const avatar = user.user_metadata?.avatar_url;
      return linkIdentity({ id: `email:${user.id}`, email: user.email, displayName: user.user_metadata?.full_name || user.email, provider: "email", avatarUrl: avatar && /^https:\/\//i.test(avatar) ? avatar : null });
    } catch {
      return null;
    }
  }

  const chatgpt = await getChatGPTUser();
  return chatgpt
    ? linkIdentity({ id: `chatgpt:${chatgpt.userId}`, email: chatgpt.email, displayName: chatgpt.displayName, provider: "chatgpt" })
    : null;
}

async function linkIdentity(identity: Learner): Promise<Learner> {
  if (!env.DB) return identity;
  const email = identity.email.trim().toLowerCase();
  const linked = await env.DB.prepare("SELECT user_id AS userId FROM account_identities WHERE identity_id = ?")
    .bind(identity.id).first<{ userId: string }>();
  if (linked) {
    await env.DB.prepare("INSERT OR IGNORE INTO account_emails (email, user_id) VALUES (?, ?)").bind(email, linked.userId).run();
    return { ...identity, id: linked.userId };
  }

  const previous = await env.DB.prepare("SELECT id FROM profiles WHERE lower(email) = ? ORDER BY created_at LIMIT 1")
    .bind(email).first<{ id: string }>();
  await env.DB.prepare("INSERT OR IGNORE INTO account_emails (email, user_id) VALUES (?, ?)")
    .bind(email, previous?.id || identity.id).run();
  const account = await env.DB.prepare("SELECT user_id AS userId FROM account_emails WHERE email = ?")
    .bind(email).first<{ userId: string }>();
  if (!account) throw new Error("Could not resolve learner account");
  await env.DB.prepare("INSERT OR IGNORE INTO account_identities (identity_id, user_id, created_at) VALUES (?, ?, ?)")
    .bind(identity.id, account.userId, new Date().toISOString()).run();
  const selected = await env.DB.prepare("SELECT user_id AS userId FROM account_identities WHERE identity_id = ?")
    .bind(identity.id).first<{ userId: string }>();
  return { ...identity, id: selected?.userId || account.userId };
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
