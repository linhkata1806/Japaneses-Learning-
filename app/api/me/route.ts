import { env } from "cloudflare:workers";
import { getLearner, ensureProfile, jsonError } from "@/lib/server-auth";

export async function GET(request: Request) {
  const learner = await getLearner(request);
  if (!learner) return Response.json({ learner: null, emailEnabled: Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY) });
  try {
    await ensureProfile(learner);
    return Response.json({ learner, emailEnabled: Boolean(env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY) });
  } catch {
    return jsonError("Chưa thể tải hồ sơ. Vui lòng thử lại.", 503);
  }
}
