import { getLearner, ensureProfile, jsonError } from "@/lib/server-auth";

export async function GET(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return Response.json({ learner: null }, { headers: { "cache-control": "private, no-store" } });
  try {
    await ensureProfile(learner);
    return Response.json({ learner }, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return jsonError("Chưa thể tải hồ sơ. Vui lòng thử lại.", 503);
  }
}
