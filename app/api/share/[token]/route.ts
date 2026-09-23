import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để mở liên kết chia sẻ.", 401);
  if (!env.DB) return jsonError("Bài học chưa khả dụng.", 503);
  const { token } = await context.params;
  const item = await env.DB.prepare(
    "SELECT c.id, c.payload_json AS payloadJson, p.display_name AS author FROM documents d JOIN generated_contents c ON c.document_id = d.id LEFT JOIN profiles p ON p.id = d.owner_id WHERE d.share_token = ? AND d.visibility = 'LINK_ONLY' AND c.status = 'USER_CONFIRMED' ORDER BY c.version DESC LIMIT 1"
  ).bind(token).first<{ id: string; payloadJson: string; author: string | null }>();
  if (!item) return jsonError("Liên kết đã hết hiệu lực hoặc bài học không còn tồn tại.", 404);
  return Response.json({ id: item.id, content: JSON.parse(item.payloadJson), author: item.author });
}
