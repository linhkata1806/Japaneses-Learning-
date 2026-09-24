declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    APP_URL?: string;
    GEMINI_API_KEY?: string;
    ADMIN_EMAILS?: string;
  }
}
