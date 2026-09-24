"use client";

import { useEffect, useState } from "react";
import type { GeneratedContent } from "@/lib/generated-content";
import { ManabiBrand } from "@/components/manabi/brand";
import { AccountControl } from "@/components/manabi/account-control";

type LibraryItem = { id: string; content: GeneratedContent; author: string | null; updatedAt: string };

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/library").then(async response => {
      const data = await response.json() as { items?: LibraryItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Không tải được thư viện.");
      setItems(data.items || []);
    }).catch(err => setError(err instanceof Error ? err.message : "Không tải được thư viện.")).finally(() => setLoading(false));
  }, []);
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-white"><div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-5 py-4"><ManabiBrand compact /><AccountControl /></div></header>
    <main className="mx-auto max-w-[1100px] px-5 py-10">
      <p className="eyebrow">Thư viện cộng đồng</p><h1 className="mt-2 text-3xl font-bold">Bài học đã được duyệt</h1>
      <p className="mt-3 leading-7 text-muted-foreground">Nội dung do học viên chia sẻ và quản trị viên kiểm tra trước khi xuất bản.</p>
      {loading ? <p className="mt-8">Đang tải…</p> : error ? <p role="alert" className="mt-8">{error}</p> : items.length === 0
        ? <div className="mt-8 rounded-2xl border border-border bg-white p-8 text-muted-foreground">Chưa có bài học công khai. Hãy quay lại sau khi những bài đầu tiên được duyệt.</div>
        : <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map(item => <a key={item.id} href={`/lesson/${item.id}`} className="rounded-2xl border border-border bg-white p-6 transition hover:border-[#789cba] hover:shadow-lg">
          <span className="text-sm font-bold text-study-link">{item.content.level}</span>
          <h2 className="mt-2 text-xl font-bold">{item.content.title}</h2>
          <p className="mt-3 line-clamp-3 leading-7 text-muted-foreground">{item.content.summary}</p>
          <p className="mt-4 text-sm text-muted-foreground">{item.content.questions.length} câu hỏi · {item.author || "Học viên"}</p>
        </a>)}</div>}
    </main>
  </div>;
}
