import { env } from "cloudflare:workers";
import { generatedContentSchema } from "@/lib/generated-content";
import { getLearner, jsonError } from "@/lib/server-auth";

type ContentRow = { id: string; documentId: string; version: number; status: string; reviewStatus: string; payloadJson: string };

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để xem bản nháp.", 401);
  if (!env.DB) return jsonError("Dữ liệu chưa khả dụng.", 503);
  const { id } = await context.params;
  const row = await env.DB.prepare(
    "SELECT id, document_id AS documentId, version, status, review_status AS reviewStatus, payload_json AS payloadJson FROM generated_contents WHERE document_id = ? AND owner_id = ? ORDER BY version DESC LIMIT 1"
  ).bind(id, learner.id).first<ContentRow>();
  if (!row) return jsonError("Tài liệu này chưa có bài học AI.", 404);
  return Response.json({ id: row.id, documentId: row.documentId, version: row.version, status: row.status, reviewStatus: row.reviewStatus, content: JSON.parse(row.payloadJson) });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để sửa bản nháp.", 401);
  if (!env.DB) return jsonError("Dữ liệu chưa khả dụng.", 503);
  const { id } = await context.params;
  let payload: unknown;
  try { payload = await request.json(); } catch { return jsonError("Nội dung không hợp lệ.", 400); }
  const parsed = generatedContentSchema.safeParse(payload);
  if (!parsed.success) return jsonError("Bài học cần tiêu đề, tóm tắt và câu hỏi có đáp án/nguồn hợp lệ.", 400);
  const row = await env.DB.prepare(
    "SELECT id, version, status FROM generated_contents WHERE document_id = ? AND owner_id = ? ORDER BY version DESC LIMIT 1"
  ).bind(id, learner.id).first<{ id: string; version: number; status: string }>();
  if (!row) return jsonError("Không tìm thấy bản nháp.", 404);
  const now = new Date().toISOString();
  if (row.status === "DRAFT") {
    await env.DB.prepare(
      "UPDATE generated_contents SET payload_json = ?, updated_at = ? WHERE id = ? AND owner_id = ?"
    ).bind(JSON.stringify(parsed.data), now, row.id, learner.id).run();
    return Response.json({ id: row.id, version: row.version, content: parsed.data });
  }
  const newId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO generated_contents (id, document_id, owner_id, version, status, review_status, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'DRAFT', 'NOT_SUBMITTED', ?, ?, ?)"
  ).bind(newId, id, learner.id, row.version + 1, JSON.stringify(parsed.data), now, now).run();
  return Response.json({ id: newId, version: row.version + 1, content: parsed.data }, { status: 201 });
}
