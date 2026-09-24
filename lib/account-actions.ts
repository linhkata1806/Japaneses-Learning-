"use client";

import { authFetch, getEmailClient } from "@/lib/browser-auth";

/** End the provider session before leaving the current page. */
export async function signOutAccount(): Promise<void> {
  const client = await getEmailClient();
  if (client) {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (session) {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    }
  }

  // A hosted ChatGPT session can coexist with a Supabase session. Check the
  // remaining server identity after Supabase sign-out before choosing the exit.
  const response = await authFetch("/api/me");
  if (!response.ok) throw new Error("Chưa thể xác minh phiên đăng nhập. Vui lòng thử lại.");
  const data = await response.json() as { learner?: { provider?: string } | null };
  window.location.replace(data.learner?.provider === "chatgpt"
    ? "/signout-with-chatgpt?return_to=%2F"
    : "/");
}
