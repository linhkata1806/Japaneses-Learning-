"use client";

import { useEffect, useState } from "react";
import LessonView from "@/components/lesson-view";
import { authFetch } from "@/lib/browser-auth";
import type { GeneratedContent } from "@/lib/generated-content";

export default function SharedLesson({ token }: { token: string }) {
  const [item, setItem] = useState<{ content: GeneratedContent; author: string | null } | null>(null);
  const [status, setStatus] = useState("Đang tải bài học…");
  useEffect(() => {
    authFetch(`/api/share/${encodeURIComponent(token)}`).then(async response => {
      const data = await response.json() as { content?: GeneratedContent; author?: string | null; error?: string };
      if (!response.ok || !data.content) throw new Error(data.error || "Không mở được bài học.");
      setItem({ content: data.content, author: data.author || null });
    }).catch(error => setStatus(error instanceof Error ? error.message : "Không mở được bài học."));
  }, [token]);
  return <main className="mx-auto max-w-3xl px-5 py-8"><a href="/" className="text-sm font-semibold text-[#315b85]">← Trang luyện tập</a><div className="mt-6">{item ? <LessonView content={item.content} author={item.author} /> : <div className="rounded-xl border border-border bg-white p-6"><p>{status}</p><a href="/auth" className="mt-3 inline-block text-sm font-semibold text-[#315b85]">Đăng nhập nếu bạn chưa có tài khoản</a></div>}</div></main>;
}
