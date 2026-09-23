import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";

function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để xem tiến độ.", 401);
  if (!env.DB) return jsonError("Tiến độ chưa khả dụng.", 503);
  const profile = await env.DB.prepare("SELECT timezone FROM profiles WHERE id = ?").bind(learner.id).first<{ timezone: string }>();
  const timezone = profile?.timezone || "Asia/Ho_Chi_Minh";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [totals, xp, days, latest] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS attempts, SUM(is_correct) AS correct FROM question_attempts WHERE user_id = ?").bind(learner.id).first<{ attempts: number; correct: number | null }>(),
    env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM xp_transactions WHERE user_id = ?").bind(learner.id).first<{ total: number }>(),
    env.DB.prepare("SELECT DISTINCT local_day AS day FROM question_attempts WHERE user_id = ? AND local_day != '' ORDER BY local_day DESC LIMIT 400").bind(learner.id).all<{ day: string }>(),
    env.DB.prepare("SELECT question_id AS questionId, is_correct AS isCorrect, answered_at AS answeredAt FROM question_attempts WHERE user_id = ? ORDER BY answered_at DESC LIMIT 100").bind(learner.id).all<{ questionId: string; isCorrect: number; answeredAt: string }>(),
  ]);
  const daySet = new Set(days.results.map(item => item.day));
  let cursor = daySet.has(today) ? today : previousDay(today);
  let streak = 0;
  while (daySet.has(cursor)) { streak++; cursor = previousDay(cursor); }
  const latestByQuestion = new Map<string, number>();
  for (const item of latest.results) if (!latestByQuestion.has(item.questionId)) latestByQuestion.set(item.questionId, item.isCorrect);
  const wrongQuestions = [...latestByQuestion].filter(([, correct]) => !correct).map(([id]) => id);
  const attempts = totals?.attempts || 0;
  return Response.json({
    attempts, correct: totals?.correct || 0, accuracy: attempts ? Math.round(((totals?.correct || 0) / attempts) * 100) : 0,
    xp: xp?.total || 0, streak, wrongQuestions, timezone,
  });
}
