"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ManabiBrand } from "@/components/manabi/brand";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/browser-auth";
import type { GeneratedContent } from "@/lib/generated-content";

type DocumentItem = { id: string; filename: string; byteSize: number; status: string; visibility: string; createdAt: string };
type ContentItem = { id: string; version: number; status: string; reviewStatus: string; content: GeneratedContent };
type Visibility = "PRIVATE" | "LINK_ONLY" | "PUBLIC";

export default function DocumentsPage() {
  const [learner, setLearner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContentItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("PRIVATE");
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [remainingAi, setRemainingAi] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [sharePath, setSharePath] = useState<string | null>(null);

  async function reloadDocuments() {
    const response = await authFetch("/api/documents");
    if (response.ok) {
      const data = await response.json() as { documents: DocumentItem[] };
      setDocs(data.documents);
    }
  }

  useEffect(() => {
    Promise.all([authFetch("/api/me"), fetch("/api/auth-config")])
      .then(async ([me, config]) => {
        const meData = await me.json() as { learner?: { displayName: string } | null };
        const cfg = await config.json() as { geminiAvailable?: boolean };
        setLearner(meData.learner?.displayName || null);
        setGeminiAvailable(Boolean(cfg.geminiAvailable));
        if (meData.learner) {
          await reloadDocuments();
          const quota = await authFetch("/api/ai-quota");
          if (quota.ok) setRemainingAi(((await quota.json()) as { remaining: number }).remaining);
        }
      })
      .catch(() => setMessage("Chưa tải được thông tin tài khoản."))
      .finally(() => setLoading(false));
  }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy("upload"); setMessage("");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await authFetch("/api/documents", { method: "POST", body: form });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "Không thể tải tài liệu.");
      setFile(null); setSelectedDoc(result.id); setDraft(null);
      setMessage("Đã lưu tài liệu ở chế độ riêng tư.");
      await reloadDocuments();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Tải tài liệu thất bại."); }
    finally { setBusy(""); }
  }

  async function openDocument(id: string) {
    setSelectedDoc(id); setDraft(null); setSharePath(null); setMessage("");
    const response = await authFetch(`/api/documents/${id}/content`);
    if (response.ok) setDraft(await response.json() as ContentItem);
    const document = docs.find(item => item.id === id);
    setVisibility((document?.visibility as Visibility) || "PRIVATE");
  }

  async function generate() {
    if (!selectedDoc || !consent) return;
    setBusy("generate"); setMessage("");
    try {
      const response = await authFetch(`/api/documents/${selectedDoc}/generate`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ consent: true }),
      });
      const result = await response.json() as { contentId?: string; content?: GeneratedContent; remainingToday?: number; error?: string };
      if (!response.ok || !result.contentId || !result.content) throw new Error(result.error || "AI chưa tạo được bài học.");
      setDraft({ id: result.contentId, version: 1, status: "DRAFT", reviewStatus: "NOT_SUBMITTED", content: result.content });
      if (typeof result.remainingToday === "number") setRemainingAi(result.remainingToday);
      setMessage("AI đã tạo bản nháp. Hãy kiểm tra và sửa trước khi dùng hoặc chia sẻ.");
      await reloadDocuments();
    } catch (error) { setMessage(error instanceof Error ? error.message : "AI chưa tạo được bài học."); }
    finally { setBusy(""); }
  }

  function changeQuestion(index: number, key: "question" | "explanation" | "sourceHint", value: string) {
    if (!draft) return;
    setDraft({ ...draft, content: { ...draft.content, questions: draft.content.questions.map((item, i) => i === index ? { ...item, [key]: value } : item) } });
  }
  function changeOption(questionIndex: number, optionIndex: number, value: string) {
    if (!draft) return;
    setDraft({ ...draft, content: { ...draft.content, questions: draft.content.questions.map((item, i) =>
      i === questionIndex ? { ...item, options: item.options.map((option, j) => j === optionIndex ? value : option) } : item) } });
  }

  async function saveDraft(): Promise<ContentItem | null> {
    if (!selectedDoc || !draft) return null;
    const response = await authFetch(`/api/documents/${selectedDoc}/content`, {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(draft.content),
    });
    const result = await response.json() as { id?: string; version?: number; error?: string };
    if (!response.ok || !result.id) throw new Error(result.error || "Không thể lưu bản nháp.");
    const saved = { ...draft, id: result.id, version: result.version || draft.version, status: "DRAFT", reviewStatus: "NOT_SUBMITTED" };
    setDraft(saved);
    return saved;
  }

  async function save() {
    setBusy("save"); setMessage("");
    try { await saveDraft(); setMessage("Đã lưu bản nháp."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Không thể lưu bản nháp."); }
    finally { setBusy(""); }
  }

  async function confirm() {
    if (!selectedDoc || !draft) return;
    setBusy("confirm"); setMessage("");
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const response = await authFetch(`/api/documents/${selectedDoc}/confirm`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ visibility }),
      });
      const result = await response.json() as { error?: string; sharePath?: string | null; reviewStatus?: string };
      if (!response.ok) throw new Error(result.error || "Không thể xác nhận bài học.");
      setSharePath(result.sharePath || null);
      setDraft({ ...saved, status: "USER_CONFIRMED", reviewStatus: result.reviewStatus || "NOT_SUBMITTED" });
      setMessage(visibility === "PUBLIC" ? "Đã gửi quản trị viên duyệt. Chỉ khi được duyệt, bài học mới xuất hiện công khai." : "Đã xác nhận bài học.");
      await reloadDocuments();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể xác nhận bài học."); }
    finally { setBusy(""); }
  }

  const current = docs.find(item => item.id === selectedDoc);
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-white"><div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 md:px-8">
      <ManabiBrand compact />
      <Link href="/" className="text-sm font-semibold text-study-link">← Về luyện tập</Link>
    </div></header>
    <main className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
      <p className="eyebrow">Tài liệu của tôi</p><h1 className="mt-2 text-3xl font-bold">Tạo bài học từ tài liệu</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Tệp của bạn luôn riêng tư khi mới tải lên. Hãy kiểm tra kỹ nội dung AI tạo trước khi chia sẻ cho người khác.</p>
      {loading ? <p className="mt-8">Đang tải…</p> : !learner ? <div className="mt-8 rounded-2xl border border-border bg-white p-6"><p>Cần đăng nhập để lưu và xử lý tài liệu.</p><a href="/auth" className="mt-3 inline-block font-semibold text-study-link">Đăng nhập</a></div>
        : <div className="mt-8 grid gap-7 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <form onSubmit={upload} className="rounded-2xl border border-border bg-white p-5">
              <h2 className="font-bold">Tải tài liệu mới</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">PDF, DOCX hoặc TXT · tối đa 2 MB</p>
              <Input type="file" accept=".pdf,.docx,.txt" onChange={event => setFile(event.target.files?.[0] || null)} className="mt-4 h-auto py-2" aria-label="Chọn tài liệu" />
              <Button type="submit" disabled={!file || Boolean(busy)} className="mt-4 w-full">Lưu tài liệu</Button>
            </form>
            <div className="rounded-2xl border border-border bg-white p-5">
              <h2 className="font-bold">Tài liệu đã tải</h2>
              {docs.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Chưa có tài liệu nào.</p>
                : <div className="mt-3 space-y-2">{docs.map(item => <Button key={item.id} type="button" variant="outline" onClick={() => openDocument(item.id)} className={`h-auto w-full justify-start whitespace-normal rounded-xl p-3 text-left ${selectedDoc === item.id ? "border-study-link bg-study-tint" : ""}`}>
                  <span className="min-w-0"><span className="block truncate font-semibold">{item.filename}</span><span className="mt-1 block text-xs text-muted-foreground">{item.visibility === "PRIVATE" ? "Riêng tư" : item.visibility === "PUBLIC" ? "Đang xét duyệt / Công khai" : "Qua liên kết"} · {item.status}</span></span>
                </Button>)}</div>}
            </div>
          </aside>
          <section className="min-w-0 rounded-2xl border border-border bg-white p-5 md:p-7">
            {!selectedDoc ? <div className="py-14 text-center text-muted-foreground">Chọn một tài liệu để tạo hoặc chỉnh sửa bài học.</div>
              : <>
                <h2 className="break-words text-xl font-bold">{current?.filename || "Tài liệu"}</h2>
                {!draft && <div className="mt-6">
                  <p className="leading-7 text-muted-foreground">AI sẽ đề xuất tóm tắt và câu hỏi có trích dẫn từ tệp. Bạn phải kiểm tra lại trước khi dùng hoặc chia sẻ.</p>
                  {remainingAi !== null && <p className="mt-2 text-sm font-semibold text-study-link">Còn {remainingAi}/3 lượt AI hôm nay</p>}
                  <label className="mt-5 flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 size-4" />
                    <span>Tôi đồng ý gửi nội dung tệp tới Gemini Free để tạo bài học. Nội dung gửi đi có thể được Google dùng để cải thiện dịch vụ; không tải thông tin nhạy cảm lên. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" className="font-semibold text-study-link underline">Xem điều khoản</a>.</span></label>
                  <Button type="button" onClick={generate} disabled={!geminiAvailable || !consent || remainingAi === 0 || Boolean(busy)} className="mt-5">{busy === "generate" ? "AI đang xử lý…" : "Tạo bài học bằng AI"}</Button>
                  {!geminiAvailable && <p className="mt-3 text-sm text-muted-foreground">Tính năng AI sẽ bật khi khóa Gemini được thêm vào cấu hình bảo mật.</p>}
                </div>}
                {draft && <div className="mt-6 space-y-6">
                  <div className="rounded-xl bg-study-tint p-4 text-sm">Phiên bản {draft.version} · {draft.status === "DRAFT" ? "Bản nháp cần kiểm tra" : draft.reviewStatus === "PENDING" ? "Đang chờ duyệt công khai" : "Đã xác nhận"}</div>
                  <label className="block text-sm font-semibold">Tên bài học<Input value={draft.content.title} onChange={event => setDraft({ ...draft, content: { ...draft.content, title: event.target.value } })} className="mt-2 h-11" /></label>
                  <label className="block text-sm font-semibold">Tóm tắt tiếng Việt<Textarea value={draft.content.summary} onChange={event => setDraft({ ...draft, content: { ...draft.content, summary: event.target.value } })} className="mt-2 min-h-36 leading-7" /></label>
                  {draft.content.questions.map((item, index) => <div key={index} className="rounded-xl border border-border p-4">
                    <h3 className="font-bold">Câu hỏi {index + 1}</h3>
                    <label className="mt-4 block text-sm font-semibold">Câu hỏi<Input value={item.question} onChange={event => changeQuestion(index, "question", event.target.value)} className="mt-2" /></label>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">{item.options.map((option, optionIndex) => <label key={optionIndex} className="block text-sm font-semibold">Đáp án {String.fromCharCode(65 + optionIndex)}
                      <Input value={option} onChange={event => changeOption(index, optionIndex, event.target.value)} className="mt-2" /></label>)}</div>
                    <div className="mt-4 flex flex-wrap gap-2" aria-label="Đáp án đúng">{item.options.map((_, optionIndex) => <Button key={optionIndex} type="button" variant={item.answerIndex === optionIndex ? "default" : "outline"} aria-pressed={item.answerIndex === optionIndex} onClick={() => setDraft({ ...draft, content: { ...draft.content, questions: draft.content.questions.map((question, i) => i === index ? { ...question, answerIndex: optionIndex } : question) } })}>Đúng: {String.fromCharCode(65 + optionIndex)}</Button>)}</div>
                    <label className="mt-4 block text-sm font-semibold">Giải thích<Textarea value={item.explanation} onChange={event => changeQuestion(index, "explanation", event.target.value)} className="mt-2 min-h-24" /></label>
                    <label className="mt-4 block text-sm font-semibold">Trang hoặc đoạn nguồn<Input value={item.sourceHint} onChange={event => changeQuestion(index, "sourceHint", event.target.value)} className="mt-2" /></label>
                  </div>)}
                  <div className="border-t border-border pt-5">
                    <p className="mb-3 font-bold">Phạm vi chia sẻ sau khi xác nhận</p>
                    <div className="flex flex-wrap gap-2">{([["PRIVATE", "Riêng tư"], ["LINK_ONLY", "Qua liên kết"], ["PUBLIC", "Công khai (chờ duyệt)"]] as const).map(([value, label]) => <Button key={value} type="button" variant={visibility === value ? "default" : "outline"} aria-pressed={visibility === value} onClick={() => setVisibility(value)}>{label}</Button>)}</div>
                    <div className="mt-5 flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={save} disabled={Boolean(busy)}>{busy === "save" ? "Đang lưu…" : "Lưu bản nháp"}</Button><Button type="button" onClick={confirm} disabled={Boolean(busy)}>{busy === "confirm" ? "Đang xác nhận…" : "Xác nhận bài học"}</Button></div>
                  </div>
                  {sharePath && <p className="break-all rounded-xl bg-study-tint p-4 text-sm">Liên kết chia sẻ: <a className="font-semibold text-study-link underline" href={sharePath}>{window.location.origin}{sharePath}</a></p>}
                </div>}
              </>}
            {message && <p role="status" className="mt-6 rounded-xl bg-study-tint p-4 text-sm leading-6">{message}</p>}
          </section>
        </div>}
    </main>
  </div>;
}
