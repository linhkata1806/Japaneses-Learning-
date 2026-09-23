import { env } from "cloudflare:workers";
import { ensureProfile, getLearner, jsonError } from "@/lib/server-auth";

const answers: Record<string, number> = { N5: 0, N4: 2, N3: 0, N2: 0, N1: 0 };

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
  if (!questionId || !(questionId in answers) || !Number.isInteger(selected) || selected! < 0 || selected! > 3) {
    return jsonError("Câu trả lời không hợp lệ.", 400);
  }
  const correct = selected === answers[questionId];
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await ensureProfile(learner);
    await env.DB.prepare(
      "INSERT INTO question_attempts (id, user_id, question_id, question_version, level, selected_option, is_correct, mode, answered_at) VALUES (?, ?, ?, 1, ?, ?, ?, 'PRACTICE', ?)"
    ).bind(id, learner.id, questionId, questionId, selected, correct ? 1 : 0, now).run();
    return Response.json({ id, correct, answeredAt: now }, { status: 201 });
  } catch {
    return jsonError("Chưa thể lưu câu trả lời. Vui lòng thử lại.", 503);
  }
}
