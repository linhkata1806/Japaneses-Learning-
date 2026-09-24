import { beginGoogleOAuth, getGoogleConfig, hasGoogleSessionTable, isConfiguredOrigin } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const config = getGoogleConfig();
  if (!config) return Response.json({ error: "Đăng nhập Google chưa được cấu hình." }, { status: 503 });
  if (!await hasGoogleSessionTable()) return Response.json({ error: "Đăng nhập Google chưa sẵn sàng." }, { status: 503 });
  if (!isConfiguredOrigin(request, config)) return Response.json({ error: "Địa chỉ đăng nhập không hợp lệ." }, { status: 400 });
  const returnTo = new URL(request.url).searchParams.get("returnTo") || "/learn";
  return beginGoogleOAuth(returnTo, config);
}
