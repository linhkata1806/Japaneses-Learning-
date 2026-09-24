"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  return <main className="mx-auto max-w-3xl px-5 py-8"><Link href="/learn" className="text-sm font-semibold text-study-link">← Trang luyện tập</Link><div className="mt-6">{item ? <LessonView content={item.content} author={item.author} /> : <div className="rounded-xl border border-border bg-white p-6"><p>{status}</p><Link href={`/login?returnTo=${encodeURIComponent(`/share/${token}`)}`} className="mt-3 inline-block text-sm font-semibold text-study-link">Đăng nhập nếu bạn chưa có tài khoản</Link></div>}</div></main>;
}
