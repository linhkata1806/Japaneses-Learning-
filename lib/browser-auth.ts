"use client";

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, { ...init, credentials: "same-origin" });
}
