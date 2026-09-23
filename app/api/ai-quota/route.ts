import { env } from "cloudflare:workers";
import { getLearner, jsonError } from "@/lib/server-auth";

export async function GET(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return jsonError("Cần đăng nhập để xem hạn mức AI.", 401);
  if (!env.DB) return jsonError("Hạn mức AI chưa khả dụng.", 503);
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const start = new Date(`${date}T00:00:00+07:00`).toISOString();
  const used = await env.DB.prepare("SELECT COUNT(*) AS count FROM generated_contents WHERE owner_id = ? AND created_at >= ?").bind(learner.id, start).first<{ count: number }>();
  return Response.json({ limit: 3, used: used?.count || 0, remaining: Math.max(0, 3 - (used?.count || 0)) });
}
