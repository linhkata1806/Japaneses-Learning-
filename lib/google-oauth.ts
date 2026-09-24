import { env } from "cloudflare:workers";
import { sanitizeReturnTo } from "@/app/chatgpt-auth";

const AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const FLOW_SECONDS = 10 * 60;
const SESSION_SECONDS = 14 * 24 * 60 * 60;

type OAuthFlow = { state: string; verifier: string; nonce: string; returnTo: string; createdAt: number };
export type GoogleIdentity = { sub: string; email: string; displayName: string; avatarUrl: string | null };

export function getGoogleConfig() {
  if (!env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.APP_URL) return null;
  try {
    const appUrl = new URL(env.APP_URL);
    const local = appUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(appUrl.hostname);
    if (appUrl.protocol !== "https:" && !local) return null;
    if (appUrl.pathname !== "/" || appUrl.search || appUrl.hash || appUrl.username || appUrl.password) return null;
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      origin: appUrl.origin,
      callbackUrl: `${appUrl.origin}/api/auth/google/callback`,
      secure: appUrl.protocol === "https:",
    };
  } catch {
    return null;
  }
}

export async function hasGoogleSessionTable(): Promise<boolean> {
  if (!env.DB) return false;
  try {
    await env.DB.prepare("SELECT token_hash FROM auth_sessions LIMIT 1").first();
    return true;
  } catch {
    return false;
  }
}

export function isConfiguredOrigin(request: Request, config: NonNullable<ReturnType<typeof getGoogleConfig>>) {
  return new URL(request.url).origin === config.origin;
}

export async function beginGoogleOAuth(returnTo: string, config: NonNullable<ReturnType<typeof getGoogleConfig>>): Promise<Response> {
  const flow: OAuthFlow = {
    state: randomToken(),
    verifier: randomToken(),
    nonce: randomToken(),
    returnTo: sanitizeReturnTo(returnTo, "/learn"),
    createdAt: Date.now(),
  };
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(flow.verifier))));
  const url = new URL(AUTHORIZATION_URL);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();
  const response = new Response(null, { status: 302, headers: { Location: url.toString(), "Cache-Control": "no-store" } });
  response.headers.append("Set-Cookie", cookie(flowCookieName(config.secure), base64url(new TextEncoder().encode(JSON.stringify(flow))), FLOW_SECONDS, config.secure));
  return response;
}

export function readOAuthFlow(request: Request, secure: boolean): OAuthFlow | null {
  const value = readCookie(request, flowCookieName(secure));
  if (!value || value.length > 2048) return null;
  try {
    const flow = JSON.parse(new TextDecoder().decode(fromBase64url(value))) as OAuthFlow;
    if (![flow.state, flow.verifier, flow.nonce].every(value => typeof value === "string" && /^[A-Za-z0-9_-]{40,128}$/.test(value))) return null;
    if (typeof flow.returnTo !== "string" || typeof flow.createdAt !== "number") return null;
    if (flow.createdAt > Date.now() || Date.now() - flow.createdAt > FLOW_SECONDS * 1000) return null;
    return { ...flow, returnTo: sanitizeReturnTo(flow.returnTo, "/learn") };
  } catch {
    return null;
  }
}

export function clearOAuthFlow(response: Response, secure: boolean) {
  response.headers.append("Set-Cookie", cookie(flowCookieName(secure), "", 0, secure));
}

export async function exchangeGoogleCode(code: string, verifier: string, config: NonNullable<ReturnType<typeof getGoogleConfig>>): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });
  if (!response.ok) throw new Error("Google token exchange failed");
  const tokens = await response.json() as { id_token?: unknown };
  if (typeof tokens.id_token !== "string") throw new Error("Google ID token missing");
  return tokens.id_token;
}

export async function verifyGoogleIdToken(token: string, nonce: string, clientId: string): Promise<GoogleIdentity> {
  const parts = token.split(".");
  if (parts.length !== 3 || token.length > 16000) throw new Error("Invalid Google ID token");
  const header = JSON.parse(new TextDecoder().decode(fromBase64url(parts[0]))) as { alg?: unknown; kid?: unknown };
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("Invalid Google signing key");
  const keysResponse = await fetch(JWKS_URL);
  if (!keysResponse.ok) throw new Error("Google signing keys unavailable");
  const keySet = await keysResponse.json() as { keys?: (JsonWebKey & { kid?: string })[] };
  const jwk = keySet.keys?.find(key => key.kid === header.kid && key.kty === "RSA" && key.use === "sig");
  if (!jwk) throw new Error("Google signing key not found");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = fromBase64url(parts[2]);
  if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, toBuffer(signature), toBuffer(signed))) {
    throw new Error("Invalid Google ID token signature");
  }
  const claims = JSON.parse(new TextDecoder().decode(fromBase64url(parts[1]))) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== "https://accounts.google.com" && claims.iss !== "accounts.google.com") throw new Error("Invalid Google issuer");
  if (claims.aud !== clientId || claims.nonce !== nonce) throw new Error("Invalid Google audience or nonce");
  if (claims.azp !== undefined && claims.azp !== clientId) throw new Error("Invalid Google authorized party");
  if (typeof claims.exp !== "number" || claims.exp <= now || typeof claims.iat !== "number" || claims.iat > now + 60) throw new Error("Expired Google ID token");
  if (typeof claims.sub !== "string" || !claims.sub || typeof claims.email !== "string" || !claims.email || ![true, "true"].includes(claims.email_verified as string | boolean)) {
    throw new Error("Google email identity is unverified");
  }
  const avatarUrl = typeof claims.picture === "string" && /^https:\/\//i.test(claims.picture) ? claims.picture : null;
  return {
    sub: claims.sub,
    email: claims.email,
    displayName: typeof claims.name === "string" && claims.name ? claims.name : claims.email,
    avatarUrl,
  };
}

export async function createGoogleSession(user: { id: string; email: string; displayName: string; avatarUrl?: string | null }, secure: boolean): Promise<string> {
  if (!env.DB) throw new Error("D1 unavailable");
  const token = randomToken();
  const tokenHash = await hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_SECONDS * 1000).toISOString();
  await env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").bind(now.toISOString()).run();
  await env.DB.prepare(
    "INSERT INTO auth_sessions (token_hash, user_id, email, display_name, avatar_url, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(tokenHash, user.id, user.email, user.displayName, user.avatarUrl || null, expiresAt, now.toISOString()).run();
  return cookie(sessionCookieName(secure), token, SESSION_SECONDS, secure);
}

export async function readGoogleSession(request: Request): Promise<{ id: string; email: string; displayName: string; avatarUrl: string | null } | null> {
  if (!env.DB) return null;
  const token = readCookie(request, sessionCookieName(isSecureApp()));
  if (!token || !/^[A-Za-z0-9_-]{40,128}$/.test(token)) return null;
  try {
    const row = await env.DB.prepare(
      "SELECT user_id AS id, email, display_name AS displayName, avatar_url AS avatarUrl FROM auth_sessions WHERE token_hash = ? AND expires_at > ?"
    ).bind(await hashToken(token), new Date().toISOString()).first<{ id: string; email: string; displayName: string; avatarUrl: string | null }>();
    return row || null;
  } catch {
    // A pending migration must not prevent the hosted ChatGPT identity from working.
    return null;
  }
}

export async function revokeGoogleSession(request: Request): Promise<void> {
  const token = readCookie(request, sessionCookieName(isSecureApp()));
  if (!token || !/^[A-Za-z0-9_-]{40,128}$/.test(token) || !env.DB) return;
  await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await hashToken(token)).run();
}

export function clearGoogleSession(response: Response) {
  const secure = isSecureApp();
  response.headers.append("Set-Cookie", cookie(sessionCookieName(secure), "", 0, secure));
}

function isSecureApp(): boolean {
  return env.APP_URL?.startsWith("https://") ?? false;
}

function flowCookieName(secure: boolean) { return secure ? "__Host-manabi_oauth" : "manabi_oauth"; }
function sessionCookieName(secure: boolean) { return secure ? "__Host-manabi_session" : "manabi_session"; }
function cookie(name: string, value: string, maxAge: number, secure: boolean) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
function readCookie(request: Request, name: string): string | null {
  const pair = request.headers.get("cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : null;
}
function randomToken(): string { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
function base64url(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid base64url");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
function toBuffer(bytes: Uint8Array): ArrayBuffer { return Uint8Array.from(bytes).buffer; }
async function hashToken(token: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token))));
}
