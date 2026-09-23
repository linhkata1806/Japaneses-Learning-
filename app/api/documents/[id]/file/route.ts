import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để tải tài liệu.", 401);
  if (!env.DB || !env.BUCKET) return jsonError("Tài liệu chưa khả dụng.", 503);
  const { id } = await context.params;
  const row = await env.DB.prepare(
    "SELECT owner_id AS ownerId, filename, mime_type AS mimeType, storage_key AS storageKey, visibility FROM documents WHERE id = ?"
  ).bind(id).first<{ ownerId: string; filename: string; mimeType: string; storageKey: string; visibility: string }>();
  if (!row) return jsonError("Không tìm thấy tài liệu.", 404);
  const admins = (env.ADMIN_EMAILS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (row.ownerId !== learner.id && !(row.visibility === "PUBLIC" && admins.includes(learner.email.toLowerCase()))) {
    return jsonError("Bạn không có quyền xem tài liệu này.", 403);
  }
  const object = await env.BUCKET.get(row.storageKey);
  if (!object) return jsonError("Tệp gốc không còn khả dụng.", 404);
  return new Response(object.body, {
    headers: {
      "content-type": row.mimeType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
