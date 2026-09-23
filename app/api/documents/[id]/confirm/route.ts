import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để xác nhận bài học.", 401);
  if (!env.DB) return jsonError("Dữ liệu chưa khả dụng.", 503);
  let body: { visibility?: string };
  try { body = await request.json(); } catch { return jsonError("Tùy chọn chia sẻ không hợp lệ.", 400); }
  if (!["PRIVATE", "LINK_ONLY", "PUBLIC"].includes(body.visibility || "")) return jsonError("Tùy chọn chia sẻ không hợp lệ.", 400);
  const { id } = await context.params;
  const row = await env.DB.prepare(
    "SELECT id, status FROM generated_contents WHERE document_id = ? AND owner_id = ? ORDER BY version DESC LIMIT 1"
  ).bind(id, learner.id).first<{ id: string; status: string }>();
  if (!row || row.status !== "DRAFT") return jsonError("Chỉ có thể xác nhận bản nháp mới nhất.", 409);
  const token = body.visibility === "LINK_ONLY" ? crypto.randomUUID() : null;
  await env.DB.batch([
    env.DB.prepare("UPDATE generated_contents SET status = 'USER_CONFIRMED', review_status = ?, updated_at = ? WHERE id = ? AND owner_id = ?")
      .bind(body.visibility === "PUBLIC" ? "PENDING" : "NOT_SUBMITTED", new Date().toISOString(), row.id, learner.id),
    env.DB.prepare("UPDATE documents SET visibility = ?, share_token = ? WHERE id = ? AND owner_id = ?")
      .bind(body.visibility, token, id, learner.id),
  ]);
  return Response.json({ id: row.id, status: "USER_CONFIRMED", reviewStatus: body.visibility === "PUBLIC" ? "PENDING" : "NOT_SUBMITTED", visibility: body.visibility, sharePath: token ? `/share/${token}` : null });
}
