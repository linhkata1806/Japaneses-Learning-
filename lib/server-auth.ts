import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { readGoogleSession } from "@/lib/google-oauth";

export type Learner = { id: string; email: string; displayName: string; provider: "chatgpt" | "google"; avatarUrl?: string | null };

export async function getLearner(request: Request): Promise<Learner | null> {
  const google = await readGoogleSession(request);
  if (google) return { ...google, provider: "google" };

  const chatgpt = await getChatGPTUser();
  return chatgpt
    ? linkIdentity({ id: `chatgpt:${chatgpt.userId}`, email: chatgpt.email, displayName: chatgpt.displayName, provider: "chatgpt" })
    : null;
}

export async function linkIdentity(identity: Learner): Promise<Learner> {
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
