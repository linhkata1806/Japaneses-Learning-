import { env } from "cloudflare:workers";
import { jsonError } from "@/lib/server-auth";

export async function GET() {
  if (!env.DB) return jsonError("Thư viện chưa khả dụng.", 503);
  try {
    const rows = await env.DB.prepare(
      "SELECT c.id, c.document_id AS documentId, c.payload_json AS payloadJson, c.updated_at AS updatedAt, p.display_name AS author FROM generated_contents c JOIN documents d ON d.id = c.document_id LEFT JOIN profiles p ON p.id = c.owner_id WHERE d.visibility = 'PUBLIC' AND c.status = 'USER_CONFIRMED' AND c.review_status = 'APPROVED' AND c.version = (SELECT MAX(v.version) FROM generated_contents v WHERE v.document_id = c.document_id AND v.review_status = 'APPROVED') ORDER BY c.updated_at DESC LIMIT 100"
    ).all<{ id: string; documentId: string; payloadJson: string; updatedAt: string; author: string | null }>();
    return Response.json({ items: rows.results.map(item => ({ id: item.id, documentId: item.documentId, content: JSON.parse(item.payloadJson), updatedAt: item.updatedAt, author: item.author })) });
  } catch {
    return jsonError("Chưa thể tải thư viện.", 503);
  }
}
