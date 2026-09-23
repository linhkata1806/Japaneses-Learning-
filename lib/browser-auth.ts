"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let emailClient: Promise<SupabaseClient | null> | null = null;

export function getEmailClient(): Promise<SupabaseClient | null> {
  if (!emailClient) {
    emailClient = fetch("/api/auth-config")
      .then(response => response.json())
      .then(value => {
        const config = value as { supabaseUrl: string | null; supabasePublishableKey: string | null };
        return config.supabaseUrl && config.supabasePublishableKey
          ? createClient(config.supabaseUrl, config.supabasePublishableKey)
          : null;
      });
  }
  return emailClient;
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const client = await getEmailClient();
  const session = client ? (await client.auth.getSession()).data.session : null;
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set("authorization", `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers });
}
