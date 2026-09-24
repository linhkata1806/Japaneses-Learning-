"use client";

import { authFetch } from "@/lib/browser-auth";

/** End the provider session before leaving the current page. */
export async function signOutAccount(): Promise<void> {
  const logout = await authFetch("/api/auth/logout", { method: "POST" });
  if (!logout.ok) throw new Error("Chưa thể kết thúc phiên đăng nhập. Vui lòng thử lại.");

  // A hosted ChatGPT session can coexist with the application session.
  const response = await authFetch("/api/me", { cache: "no-store" });
  if (!response.ok) throw new Error("Chưa thể xác minh phiên đăng nhập. Vui lòng thử lại.");
  const data = await response.json() as { learner?: { provider?: string } | null };
  window.location.replace(data.learner?.provider === "chatgpt"
    ? "/signout-with-chatgpt?return_to=%2F"
    : "/");
}
