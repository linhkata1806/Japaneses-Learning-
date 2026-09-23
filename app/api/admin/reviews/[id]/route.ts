import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập.", 401);
  const admins = (env.ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!admins.includes(learner.email.toLowerCase())) return jsonError("Bạn không có quyền duyệt nội dung.", 403);
  if (!env.DB) return jsonError("Dữ liệu chưa khả dụng.", 503);
  let body: { decision?: string; reason?: string };
  try { body = await request.json(); } catch { return jsonError("Dữ liệu duyệt không hợp lệ.", 400); }
  if (!["APPROVED", "REJECTED"].includes(body.decision || "")) return jsonError("Quyết định duyệt không hợp lệ.", 400);
  const { id } = await context.params;
  const row = await env.DB.prepare("SELECT id FROM generated_contents WHERE id = ? AND review_status = 'PENDING'").bind(id).first();
  if (!row) return jsonError("Bản nội dung không còn chờ duyệt.", 409);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE generated_contents SET review_status = ?, updated_at = ? WHERE id = ? AND review_status = 'PENDING'").bind(body.decision, now, id),
    env.DB.prepare("INSERT INTO content_reviews (id, content_id, reviewer_id, decision, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, learner.id, body.decision, body.reason || null, now),
  ]);
  return Response.json({ id, decision: body.decision });
}
