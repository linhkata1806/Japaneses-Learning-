declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    GEMINI_API_KEY?: string;
    ADMIN_EMAILS?: string;
  }
}
