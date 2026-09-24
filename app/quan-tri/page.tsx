"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/browser-auth";
import type { GeneratedContent } from "@/lib/generated-content";

type Pending = { id: string; documentId: string; version: number; authorEmail: string | null; content: GeneratedContent };

export default function ModerationPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [message, setMessage] = useState("Đang tải hàng chờ…");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const response = await authFetch("/api/admin/reviews");
    const data = await response.json() as { items?: Pending[]; error?: string };
    if (!response.ok) throw new Error(data.error || "Không tải được hàng chờ.");
    setItems(data.items || []);
    setMessage(data.items?.length ? "" : "Không có nội dung nào đang chờ duyệt.");
  }
  useEffect(() => { load().catch(error => setMessage(error instanceof Error ? error.message : "Không tải được hàng chờ.")); }, []);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setBusy(id); setMessage("");
    try {
      const response = await authFetch(`/api/admin/reviews/${id}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, reason: reason[id] || "" }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Không thể lưu quyết định.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể lưu quyết định."); }
    finally { setBusy(null); }
  }

  async function downloadSource(documentId: string) {
    const response = await authFetch(`/api/documents/${documentId}/file`);
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setMessage(data.error || "Không tải được tệp gốc.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `tai-lieu-${documentId}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  return <main className="mx-auto max-w-4xl px-5 py-10">
    <Link href="/" className="text-sm font-semibold text-study-link">← Trang học</Link>
    <p className="eyebrow mt-8">Quản trị nội dung</p><h1 className="mt-2 text-3xl font-bold">Bài học chờ duyệt</h1>
    {message && <p role="status" className="mt-6 rounded-xl border border-border bg-white p-4">{message}</p>}
    <div className="mt-7 space-y-6">{items.map(item => <article key={item.id} className="rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="font-bold text-study-link">{item.content.level}</span><span>Phiên bản {item.version}</span><span>{item.authorEmail || "Học viên"}</span></div>
      <h2 className="mt-3 text-xl font-bold">{item.content.title}</h2>
      <button type="button" onClick={() => downloadSource(item.documentId)} className="mt-2 text-sm font-semibold text-study-link underline">Tải tài liệu gốc để đối chiếu</button>
      <p className="mt-3 whitespace-pre-wrap leading-7">{item.content.summary}</p>
      <div className="mt-4 space-y-3">{item.content.questions.map((question, index) => <div key={index} className="rounded-xl bg-[#f5f7f9] p-4 text-sm leading-6">
        <p className="font-bold">Câu {index + 1}: {question.question}</p>
        <p className="mt-1">Đúng: {question.options[question.answerIndex]}</p>
        <p>Giải thích: {question.explanation}</p><p>Nguồn: {question.sourceHint}</p>
      </div>)}</div>
      <label className="mt-5 block text-sm font-semibold">Lý do nếu từ chối<Textarea value={reason[item.id] || ""} onChange={event => setReason({ ...reason, [item.id]: event.target.value })} className="mt-2" /></label>
      <div className="mt-4 flex gap-3"><Button disabled={busy === item.id} onClick={() => decide(item.id, "APPROVED")}>Duyệt công khai</Button><Button variant="outline" disabled={busy === item.id || !reason[item.id]?.trim()} onClick={() => decide(item.id, "REJECTED")}>Từ chối</Button></div>
    </article>)}</div>
  </main>;
}
