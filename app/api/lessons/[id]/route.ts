import { env } from "cloudflare:workers";
import { jsonError } from "@/lib/server-auth";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!env.DB) return jsonError("Bài học chưa khả dụng.", 503);
  const { id } = await context.params;
  const item = await env.DB.prepare(
    "SELECT c.id, c.payload_json AS payloadJson, p.display_name AS author FROM generated_contents c JOIN documents d ON d.id = c.document_id LEFT JOIN profiles p ON p.id = c.owner_id WHERE c.id = ? AND d.visibility = 'PUBLIC' AND c.status = 'USER_CONFIRMED' AND c.review_status = 'APPROVED'"
  ).bind(id).first<{ id: string; payloadJson: string; author: string | null }>();
  if (!item) return jsonError("Bài học chưa công khai hoặc không còn tồn tại.", 404);
  return Response.json({ id: item.id, content: JSON.parse(item.payloadJson), author: item.author });
}
