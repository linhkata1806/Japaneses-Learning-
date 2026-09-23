import { env } from "cloudflare:workers";
import { ensureProfile, getLearner, jsonError } from "@/lib/server-auth";

const allowed = new Map([
  ["application/pdf", ".pdf"],
  ["text/plain", ".txt"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);
const MAX_BYTES = 2 * 1024 * 1024;

export async function GET(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để xem tài liệu.", 401);
  if (!env.DB) return jsonError("Dữ liệu tài liệu chưa khả dụng.", 503);
  try {
    const rows = await env.DB.prepare(
      "SELECT id, filename, mime_type AS mimeType, byte_size AS byteSize, status, visibility, created_at AS createdAt FROM documents WHERE owner_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(learner.id).all();
    return Response.json({ documents: rows.results });
  } catch {
    return jsonError("Chưa thể tải danh sách tài liệu.", 503);
  }
}

export async function POST(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để tải tài liệu.", 401);
  if (!env.DB || !env.BUCKET) return jsonError("Lưu trữ tài liệu chưa khả dụng.", 503);
  let form: FormData;
  try { form = await request.formData(); } catch { return jsonError("Không đọc được tệp tải lên.", 400); }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Hãy chọn một tệp PDF, DOCX hoặc TXT.", 400);
  const extension = allowed.get(file.type);
  if (!extension || !file.name.toLowerCase().endsWith(extension)) return jsonError("Chỉ nhận PDF, DOCX hoặc TXT.", 400);
  if (file.size < 1 || file.size > MAX_BYTES) return jsonError("Tệp phải nhỏ hơn 2 MB.", 400);

  const id = crypto.randomUUID();
  const key = `documents/${learner.id.replace(/[^a-zA-Z0-9:_-]/g, "_")}/${id}`;
  try {
    await ensureProfile(learner);
    await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    await env.DB.prepare(
      "INSERT INTO documents (id, owner_id, filename, mime_type, byte_size, storage_key, status, visibility, created_at) VALUES (?, ?, ?, ?, ?, ?, 'UPLOADED', 'PRIVATE', ?)"
    ).bind(id, learner.id, file.name, file.type, file.size, key, new Date().toISOString()).run();
    return Response.json({ id, filename: file.name, status: "UPLOADED" }, { status: 201 });
  } catch {
    await env.BUCKET.delete(key).catch(() => {});
    return jsonError("Chưa thể lưu tệp. Vui lòng thử lại.", 503);
  }
}
