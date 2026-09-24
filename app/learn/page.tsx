"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Library, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManabiBrand } from "@/components/manabi/brand";
import { AccountControl } from "@/components/manabi/account-control";
import { Progress } from "@/components/ui/progress";
import { authFetch } from "@/lib/browser-auth";
import { RouteAccessGate } from "@/components/route-access-gate";

type Level = "N5" | "N4" | "N3" | "N2" | "N1";
type Stats = { attempts: number; accuracy: number; xp: number; streak: number; wrongQuestions: string[] };
type ExternalExample = { text: string; author: string; license: string; url: string };
type PracticeResult = { level: Level; selectedOption: number; correct: boolean; explanation: string; saved: boolean };
type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
const samples: Record<"N5", { area: string; title: string; question: string; options: string[]; answer: number; explanation: string; point: string }> = {
  N5: { area: "Từ vựng · Sinh hoạt hằng ngày", title: "Động từ trong câu đơn", question: "毎朝、コーヒーを ______。", options: ["飲みます", "読みます", "見ます", "聞きます"], answer: 0, explanation: "飲みます (のみます) nghĩa là “uống”. Với コーヒーを, đây là động từ phù hợp. Các lựa chọn còn lại lần lượt là đọc, xem và nghe.", point: "飲む · uống" },
};

function PracticeExperience() {
  const [level, setLevel] = useState<"N5">("N5");
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [examples, setExamples] = useState<ExternalExample[]>([]);
  const [examplesUnavailable, setExamplesUnavailable] = useState(false);
  const [examplesRequested, setExamplesRequested] = useState(false);
  const practiceAction = useRef<(nextLevel: Level, option: number) => Promise<PracticeResult>>(async () => { throw new Error("Câu hỏi chưa sẵn sàng."); });
  const sample = samples[level];
  const chooseLevel = (next: Level) => {
    if (next !== "N5") return;
    setLevel(next); setSelected(null); setSubmitted(false); setSaveMessage("");
  };

  useEffect(() => {
    authFetch("/api/me").then(response => response.json()).then(value => {
      const data = value as { learner?: { displayName?: string } | null };
      setAccount(data.learner?.displayName || null);
      if (data.learner) authFetch("/api/stats").then(response => response.ok ? response.json() : null).then(value => setStats(value as Stats | null)).catch(() => {});
    }).catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (!examplesRequested) return;
    fetch("/api/examples").then(response => response.ok ? response.json() : Promise.reject()).then(value => {
      setExamples((value as { examples: ExternalExample[] }).examples);
    }).catch(() => setExamplesUnavailable(true));
  }, [examplesRequested]);

  async function completePractice(nextLevel: Level, option: number): Promise<PracticeResult> {
    if (nextLevel !== "N5") throw new Error("Cấp này chưa mở. Cần hoàn thành lộ trình và đỗ bài thi thử cuối cấp trước.");
    setLevel(nextLevel);
    setSelected(option);
    setSubmitted(true);
    const result = { level: nextLevel, selectedOption: option, correct: option === samples[nextLevel].answer, explanation: samples[nextLevel].explanation, saved: false };
    if (!account) return result;
    try {
      const response = await authFetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: nextLevel, selectedOption: option }),
      });
      setSaveMessage(response.ok ? "Đã lưu vào lịch sử học." : "Chưa lưu được bài làm, bạn có thể thử lại.");
      result.saved = response.ok;
      if (response.ok) {
        const fresh = await authFetch("/api/stats");
        if (fresh.ok) setStats(await fresh.json() as Stats);
      }
    } catch {
      setSaveMessage("Chưa lưu được bài làm, bạn có thể thử lại.");
    }
    return result;
  }

  useEffect(() => { practiceAction.current = completePractice; });

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Record<string, unknown>) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
    void register({
      name: "read_sample_jlpt_question", title: "Xem câu hỏi JLPT mẫu", description: "Đọc câu hỏi mẫu và bốn lựa chọn của một cấp JLPT mà không nộp bài.",
      inputSchema: { type: "object", properties: { level: { type: "string", enum: ["N5"] } }, required: ["level"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input: unknown) {
        const level = (input as { level?: Level })?.level;
        if (level !== "N5") throw new Error("Cấp này chưa mở.");
        return { level, question: samples[level].question, options: samples[level].options };
      },
    });
    void register({
      name: "complete_sample_jlpt_question", title: "Trả lời câu hỏi JLPT mẫu", description: "Chọn cấp JLPT, nộp đáp án câu hỏi mẫu và cập nhật tiến độ hiển thị; lưu bài làm nếu đã đăng nhập.",
      inputSchema: { type: "object", properties: { level: { type: "string", enum: ["N5"] }, selectedOption: { type: "integer", minimum: 0, maximum: 3 } }, required: ["level", "selectedOption"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        const value = input as { level?: Level; selectedOption?: number } | null;
        if (value?.level !== "N5" || !Number.isInteger(value.selectedOption) || (value.selectedOption ?? -1) < 0 || (value.selectedOption ?? 4) > 3) throw new Error("Cấp JLPT chưa mở hoặc đáp án không hợp lệ.");
        return practiceAction.current(value.level, value.selectedOption!);
      },
    });
    return () => lifecycle.abort();
  }, []);

  async function submitAnswer() {
    if (selected !== null) await completePractice(level, selected);
  }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-white/10 bg-[#101614] text-[#dfe7e0]" style={{ backgroundImage: "radial-gradient(ellipse at 86% -20%, rgba(224,35,28,.12), transparent 36%), linear-gradient(110deg, #0b100e, #17201b)" }}>
      <div className="mx-auto flex max-w-[1420px] items-center justify-between gap-4 px-5 py-3 md:px-10">
        <ManabiBrand inverse />
        <AccountControl inverse />
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-5 py-6 md:px-10 md:py-10">
      <nav aria-label="Các bước học" className="mb-6 flex flex-wrap gap-x-5 gap-y-1 border-b border-border pb-3 text-sm md:gap-x-7">
        <span aria-current="page" className="inline-flex min-h-11 items-center gap-2 font-semibold text-foreground"><span aria-hidden="true" className="size-1.5 rounded-full bg-[#e0231c]" />Luyện tập</span>
        <Link href="/documents" className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Tài liệu của tôi</Link>
        <Link href="/library" className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Thư viện cộng đồng</Link>
      </nav>
      <section className="min-w-0">
        <div className="relative isolate mb-6 overflow-hidden rounded-2xl border border-[#27332d] px-5 py-5 text-[#dfe7e0] md:px-7 md:py-6" style={{ backgroundImage: "radial-gradient(ellipse at 94% 0%, rgba(224,35,28,.12), transparent 38%), linear-gradient(120deg, #111815, #1b2520)" }}>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.025em] md:text-[2rem]">Học thử cấp N5</h1>
          <p className="mt-2 max-w-[65ch] text-base leading-7 text-[#bac4bd]">Bản beta hiện có một câu hỏi mẫu. N4–N1 chưa mở vì lộ trình học và đề thi cuối cấp chưa hoàn chỉnh.</p>
        </div>
        <article className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#f0f3f1] px-5 py-4 md:px-8 md:py-5">
            <div><p className="text-sm font-medium text-[#55728f]">{level} · {sample.area}</p><h3 className="mt-1 text-lg font-semibold leading-snug tracking-[-0.01em]">{sample.title}</h3></div>
            <span className="text-sm tabular-nums text-muted-foreground">Câu 1 / 1</span>
          </div>
          <div className="px-6 pb-7 pt-7 md:px-8 md:pb-8">
            <p className="text-sm font-semibold text-muted-foreground">Chọn đáp án đúng</p>
            <p lang="ja" className="mt-4 rounded-xl border border-[#dce5ed] bg-[#f8fafc] px-5 py-6 text-[1.5rem] font-medium leading-[1.9] tracking-[0.015em] md:text-[1.65rem]">{sample.question}</p>
            <p className="mt-3 max-w-[70ch] text-sm leading-6 text-muted-foreground">Nguồn câu hỏi: nhóm phát triển tự biên soạn cho bản thử; không trích từ đề JLPT hay tài liệu công khai. <a className="font-medium text-study-link underline" href="/sources">Xem nguồn học liệu</a>.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {sample.options.map((option, index) => {
                const chosen = selected === index;
                const stateClass = submitted && index === sample.answer ? "border-[#d1e2d5] bg-[#f4f8f4] text-[#28583b]" : submitted && chosen ? "border-[#e2d3cc] bg-[#faf5f3] text-[#734839]" : chosen ? "border-[#8ca1b3] bg-[#f5f7f9]" : "border-border bg-white hover:border-[#b4c1cb] hover:bg-[#fafbfc]";
                return <Button key={option} type="button" variant="outline" disabled={submitted} aria-pressed={chosen} onClick={() => setSelected(index)} className={`h-auto min-h-[62px] justify-start whitespace-normal rounded-xl px-4 py-3 text-left text-base font-medium ${stateClass}`}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-current/25 text-sm">{String.fromCharCode(65 + index)}</span><span lang="ja">{option}</span>
                </Button>;
              })}
            </div>
            {submitted && <div role="status" className={`mt-6 rounded-xl border p-5 ${selected === sample.answer ? "border-[#d8e7db] bg-[#f5f9f5]" : "border-[#e6d8d1] bg-[#faf6f4]"}`}>
              <p className="font-semibold">{selected === sample.answer ? "Chính xác!" : "Chưa đúng — cùng xem lại nhé."}</p>
              <p className="mt-2 max-w-[70ch] text-base leading-7">{sample.explanation}</p>
              <p className="mt-2 text-sm font-semibold text-[#3b658b]">Ghi nhớ: {sample.point}</p>
            </div>}
            <div className="mt-7 flex justify-end">
              {submitted ? <Button variant="outline" type="button" onClick={() => { setSelected(null); setSubmitted(false); setSaveMessage(""); }} className="h-11 rounded-xl px-5"><RotateCcw aria-hidden="true" /> Làm lại</Button>
                : <Button type="button" disabled={selected === null} onClick={submitAnswer} className="h-11 rounded-xl px-6">Kiểm tra đáp án <ChevronRight aria-hidden="true" /></Button>}
            </div>
            {saveMessage && <p role="status" className="mt-2 text-sm text-muted-foreground">{saveMessage}</p>}
            {submitted && <section aria-labelledby="sample-next-steps" className="mt-6 border-t border-border pt-6">
              <h4 id="sample-next-steps" className="text-lg font-semibold leading-snug tracking-[-0.01em]">Xong câu mẫu N5</h4>
              <p className="mt-2 max-w-[65ch] text-base leading-7 text-muted-foreground">Muốn học thêm? Khám phá bài học đã duyệt trong thư viện hoặc mở tài liệu của bạn.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild><Link href="/library"><Library aria-hidden="true" /> Khám phá thư viện</Link></Button>
                <Button asChild variant="outline"><Link href="/documents"><FileText aria-hidden="true" /> Mở tài liệu của tôi</Link></Button>
              </div>
            </section>}
            <details className="mt-8 border-t border-border pt-6" onToggle={event => { if (event.currentTarget.open) setExamplesRequested(true); }}>
              <summary className="cursor-pointer font-semibold underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Câu ví dụ ngoài bài tập</summary>
              <div className="mt-4">
              <p className="text-sm leading-6 text-muted-foreground">Ví dụ từ Tatoeba để xem cách dùng từ; đây không phải câu hỏi thi đã biên tập.</p>
              {examples.length > 0 ? <ul className="mt-3 space-y-3">{examples.map(example => <li key={example.url} className="rounded-xl bg-[#f6f8fb] p-4">
                <p lang="ja" className="text-lg font-medium">{example.text}</p>
                <span className="mt-2 block text-xs text-muted-foreground"><a href={example.url} target="_blank" rel="noreferrer" className="text-study-link underline">Tatoeba · {example.author}</a> · <a href={example.license === "CC0 1.0" ? "https://creativecommons.org/publicdomain/zero/1.0/" : "https://creativecommons.org/licenses/by/2.0/fr/"} target="_blank" rel="noreferrer" className="text-study-link underline">{example.license}</a></span>
              </li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{examplesUnavailable ? "Tatoeba tạm thời không khả dụng; bài luyện vẫn dùng được." : "Đang tải ví dụ…"}</p>}
              </div>
            </details>
          </div>
        </article>
      </section>

      <section aria-label="Tiến độ học" className="mt-8 border-t border-border pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold leading-snug tracking-[-0.01em]">{stats ? "Độ chính xác câu mẫu" : "Tiến độ câu mẫu"}</h2>
          <span className="text-sm font-semibold tabular-nums text-study-link">{stats ? `${stats.accuracy}%` : submitted ? "1/1 mẫu" : "0/1 mẫu"}</span>
        </div>
        <Progress value={stats ? stats.accuracy : submitted ? 100 : 0} className="mt-3 h-2 bg-[#e5edf4] [&_[data-slot=progress-indicator]]:bg-notebook-coral" />
        {stats && <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <p>{stats.attempts} câu đã làm</p><p>{stats.xp} XP</p><p>{stats.streak} ngày liên tiếp</p>
        </div>}
        {stats && stats.wrongQuestions.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <h3 className="font-semibold">Câu cần ôn</h3>
          {stats.wrongQuestions.filter(item => item === "N5").map((item, index) =>
            <Button key={`${item}-${index}`} type="button" variant="outline" size="sm" onClick={() => chooseLevel("N5")}>Ôn câu {item} <RotateCcw aria-hidden="true" /></Button>
          )}
        </div>}
      </section>
    </main>
  </div>;
}

export default function LearnPage() {
  return <RouteAccessGate><PracticeExperience /></RouteAccessGate>;
}
