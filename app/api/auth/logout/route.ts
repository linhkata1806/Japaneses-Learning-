import { clearGoogleSession, revokeGoogleSession } from "@/lib/google-oauth";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Yêu cầu đăng xuất không hợp lệ." }, { status: 403 });
  }
  try {
    await revokeGoogleSession(request);
  } catch {
    return Response.json({ error: "Chưa thể đăng xuất. Vui lòng thử lại." }, { status: 503 });
  }
  const response = Response.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
  clearGoogleSession(response);
  return response;
}
