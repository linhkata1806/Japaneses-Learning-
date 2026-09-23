import { env } from "cloudflare:workers";
import { ensureProfile, getLearner, jsonError } from "@/lib/server-auth";

// Chỉ câu mẫu N5 đang được mở; không cho nộp cấp cao hơn qua API.
const answers: Record<string, number> = { N5: 0 };

export async function GET(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để xem lịch sử.", 401);
  if (!env.DB) return jsonError("Dữ liệu học đang tạm thời không khả dụng.", 503);
  try {
    const result = await env.DB.prepare(
      "SELECT id, question_id AS questionId, question_version AS questionVersion, level, selected_option AS selectedOption, is_correct AS isCorrect, answered_at AS answeredAt FROM question_attempts WHERE user_id = ? ORDER BY answered_at DESC LIMIT 100"
    ).bind(learner.id).all();
    return Response.json({ attempts: result.results });
  } catch {
    return jsonError("Chưa thể tải lịch sử làm bài.", 503);
  }
}

export async function POST(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để lưu bài làm.", 401);
  if (!env.DB) return jsonError("Dữ liệu học đang tạm thời không khả dụng.", 503);
  let input: { questionId?: string; selectedOption?: number };
  try { input = await request.json(); } catch { return jsonError("Dữ liệu câu trả lời không hợp lệ.", 400); }
  const questionId = input.questionId;
  const selected = input.selectedOption;
  if (["N4", "N3", "N2", "N1"].includes(questionId || "")) {
    return jsonError("Cấp này chưa mở. Cần hoàn thành lộ trình và đỗ đề cuối cấp trước.", 403);
  }
  if (!questionId || !(questionId in answers) || !Number.isInteger(selected) || selected! < 0 || selected! > 3) {
    return jsonError("Câu trả lời không hợp lệ.", 400);
  }
  const correct = selected === answers[questionId];
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await ensureProfile(learner);
    const profile = await env.DB.prepare("SELECT timezone FROM profiles WHERE id = ?").bind(learner.id).first<{ timezone: string }>();
    const timezone = profile?.timezone || "Asia/Ho_Chi_Minh";
    const localDay = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const history = await env.DB.prepare(
      "SELECT COUNT(*) AS attempts, SUM(is_correct) AS correctCount FROM question_attempts WHERE user_id = ? AND question_id = ?"
    ).bind(learner.id, questionId).first<{ attempts: number; correctCount: number | null }>();
    await env.DB.prepare(
      "INSERT INTO question_attempts (id, user_id, question_id, question_version, level, selected_option, is_correct, mode, answered_at, local_day) VALUES (?, ?, ?, 1, ?, ?, ?, 'PRACTICE', ?, ?)"
    ).bind(id, learner.id, questionId, questionId, selected, correct ? 1 : 0, now, localDay).run();
    let xpAwarded = 0;
    if (correct && !history?.correctCount) {
      const amount = history?.attempts ? 5 : 10;
      const result = await env.DB.prepare(
        "INSERT OR IGNORE INTO xp_transactions (id, user_id, source_type, source_id, amount, created_at) VALUES (?, ?, 'FIRST_CORRECT', ?, ?, ?)"
      ).bind(crypto.randomUUID(), learner.id, questionId, amount, now).run();
      if (result.meta.changes > 0) xpAwarded = amount;
    }
    return Response.json({ id, correct, answeredAt: now, xpAwarded }, { status: 201 });
  } catch {
    return jsonError("Chưa thể lưu câu trả lời. Vui lòng thử lại.", 503);
  }
}
