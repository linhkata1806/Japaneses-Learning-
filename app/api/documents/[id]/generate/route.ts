import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";
import { generatedContentSchema } from "@/lib/generated-content";
import { documentUploadUnavailableMessage, getDocumentStorage } from "@/lib/document-storage";

function vnDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để tạo bài học.", 401);
  const storage = getDocumentStorage();
  if (!env.DB || !storage) return jsonError(documentUploadUnavailableMessage, 503);
  if (!env.GEMINI_API_KEY) return jsonError("AI chưa được kết nối. Vui lòng thử lại sau.", 503);
  const { id } = await context.params;
  let body: { consent?: boolean };
  try { body = await request.json(); } catch { return jsonError("Thiếu xác nhận xử lý tài liệu.", 400); }
  if (body.consent !== true) return jsonError("Cần đồng ý gửi tài liệu tới Gemini để tạo bài học.", 400);

  const document = await env.DB.prepare(
    "SELECT id, owner_id AS ownerId, mime_type AS mimeType, storage_key AS storageKey FROM documents WHERE id = ? AND owner_id = ?"
  ).bind(id, learner.id).first<{ id: string; ownerId: string; mimeType: string; storageKey: string }>();
  if (!document) return jsonError("Không tìm thấy tài liệu.", 404);
  let object: Blob | null;
  try { object = await storage.get(document.storageKey); }
  catch { return jsonError("Chưa thể tải tệp gốc. Vui lòng thử lại.", 503); }
  if (!object) return jsonError("Tệp gốc không còn khả dụng.", 404);
  const bytes = new Uint8Array(await object.arrayBuffer());
  const prompt = "Dựa CHỈ trên tài liệu đính kèm, tạo một bài học ngắn bằng tiếng Việt để luyện thi JLPT. Giữ nguyên tiếng Nhật gốc. Trả JSON có title, level (N5-N1), summary và 1-8 câu hỏi trắc nghiệm; mỗi câu có question, đúng 4 options, answerIndex 0-3, explanation và sourceHint là đoạn/trang hỗ trợ đáp án. Không bịa câu hỏi nếu thiếu bằng chứng; không sao chép dài nguyên văn tài liệu. Nếu tài liệu không phù hợp, trả thông báo lỗi trong summary và không tự nghĩ ra kiến thức.";
  const part = document.mimeType === "text/plain"
    ? { text: new TextDecoder().decode(bytes) }
    : { inline_data: { mime_type: document.mimeType, data: toBase64(bytes) } };

  const now = new Date();
  const day = vnDay(now);
  const jobId = crypto.randomUUID();
  await env.DB.prepare(
    "UPDATE ai_generation_jobs SET status = 'FAILED' WHERE user_id = ? AND status = 'STARTED' AND created_at < ?"
  ).bind(learner.id, new Date(now.getTime() - 30 * 60 * 1000).toISOString()).run();
  const reserved = await env.DB.prepare(
    "INSERT INTO ai_generation_jobs (id, user_id, local_day, status, created_at) SELECT ?, ?, ?, 'STARTED', ? WHERE (SELECT COUNT(*) FROM ai_generation_jobs WHERE user_id = ? AND local_day = ? AND status IN ('STARTED', 'SUCCEEDED')) < 3"
  ).bind(jobId, learner.id, day, now.toISOString(), learner.id, day).run();
  if (reserved.meta.changes === 0) return jsonError("Bạn đã dùng hết 3 lượt AI hôm nay.", 429);
  try {
    await env.DB.prepare("UPDATE documents SET status = 'PROCESSING' WHERE id = ?").bind(id).run();
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }, part] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const result = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = result.candidates?.[0]?.content?.parts?.map(item => item.text || "").join("") || "";
    const parsed = generatedContentSchema.parse(JSON.parse(text));
    const completedAt = new Date().toISOString();
    const contentId = crypto.randomUUID();
    const latest = await env.DB.prepare("SELECT MAX(version) AS version FROM generated_contents WHERE document_id = ?").bind(id).first<{ version: number | null }>();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO generated_contents (id, document_id, owner_id, version, status, review_status, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, 'DRAFT', 'NOT_SUBMITTED', ?, ?, ?)")
        .bind(contentId, id, learner.id, (latest?.version || 0) + 1, JSON.stringify(parsed), completedAt, completedAt),
      env.DB.prepare("UPDATE documents SET status = 'PROCESSED' WHERE id = ?").bind(id),
      env.DB.prepare("UPDATE ai_generation_jobs SET status = 'SUCCEEDED' WHERE id = ?").bind(jobId),
    ]);
    const used = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM ai_generation_jobs WHERE user_id = ? AND local_day = ? AND status IN ('STARTED', 'SUCCEEDED')"
    ).bind(learner.id, day).first<{ count: number }>();
    return Response.json({ contentId, content: parsed, remainingToday: Math.max(0, 3 - (used?.count || 0)) }, { status: 201 });
  } catch {
    await env.DB.batch([
      env.DB.prepare("UPDATE documents SET status = 'FAILED' WHERE id = ?").bind(id),
      env.DB.prepare("UPDATE ai_generation_jobs SET status = 'FAILED' WHERE id = ?").bind(jobId),
    ]).catch(() => {});
    return jsonError("AI chưa tạo được bài học từ tệp này. Lượt sử dụng không bị trừ.", 502);
  }
}
