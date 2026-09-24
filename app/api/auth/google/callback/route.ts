import { ensureProfile, linkIdentity } from "@/lib/server-auth";
import {
  clearOAuthFlow,
  createGoogleSession,
  exchangeGoogleCode,
  getGoogleConfig,
  isConfiguredOrigin,
  readOAuthFlow,
  verifyGoogleIdToken,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const config = getGoogleConfig();
  if (!config) return Response.json({ error: "Đăng nhập Google chưa được cấu hình." }, { status: 503 });
  if (!isConfiguredOrigin(request, config)) return Response.json({ error: "Địa chỉ đăng nhập không hợp lệ." }, { status: 400 });
  const secure = config.secure;

  const flow = readOAuthFlow(request, secure);
  const params = new URL(request.url).searchParams;
  const loginUrl = new URL("/login", config.origin);
  loginUrl.searchParams.set("returnTo", flow?.returnTo || "/learn");
  loginUrl.searchParams.set("googleError", "1");
  function failed() {
    const response = new Response(null, { status: 303, headers: { Location: loginUrl.toString(), "Cache-Control": "no-store" } });
    clearOAuthFlow(response, secure);
    return response;
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!flow || !code || !state || state !== flow.state || params.has("error")) return failed();
  try {
    const idToken = await exchangeGoogleCode(code, flow.verifier, config);
    const google = await verifyGoogleIdToken(idToken, flow.nonce, config.clientId);
    const learner = await linkIdentity({
      id: `google:${google.sub}`,
      email: google.email,
      displayName: google.displayName,
      provider: "google",
      avatarUrl: google.avatarUrl,
    });
    await ensureProfile(learner);
    const sessionCookie = await createGoogleSession(learner, config.secure);
    const response = new Response(null, { status: 303, headers: { Location: new URL(flow.returnTo, config.origin).toString(), "Cache-Control": "no-store" } });
    clearOAuthFlow(response, secure);
    response.headers.append("Set-Cookie", sessionCookie);
    return response;
  } catch {
    return failed();
  }
}
