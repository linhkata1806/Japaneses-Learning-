import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";

export async function GET(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập.", 401);
  const admins = (env.ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!admins.includes(learner.email.toLowerCase())) return jsonError("Bạn không có quyền duyệt nội dung.", 403);
  if (!env.DB) return jsonError("Dữ liệu chưa khả dụng.", 503);
  const rows = await env.DB.prepare(
    "SELECT c.id, c.document_id AS documentId, c.version, c.payload_json AS payloadJson, c.created_at AS createdAt, p.email AS authorEmail FROM generated_contents c JOIN documents d ON d.id = c.document_id LEFT JOIN profiles p ON p.id = c.owner_id WHERE c.review_status = 'PENDING' AND d.visibility = 'PUBLIC' ORDER BY c.created_at LIMIT 100"
  ).all<{ id: string; documentId: string; version: number; payloadJson: string; createdAt: string; authorEmail: string | null }>();
  return Response.json({ items: rows.results.map(item => ({ ...item, payloadJson: undefined, content: JSON.parse(item.payloadJson) })) });
}
