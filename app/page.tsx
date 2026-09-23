"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, FileText, Library, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { authFetch } from "@/lib/browser-auth";

type Level = "N5" | "N4" | "N3" | "N2" | "N1";
type Stats = { attempts: number; accuracy: number; xp: number; streak: number; wrongQuestions: string[] };
const levels: Level[] = ["N5", "N4", "N3", "N2", "N1"];
const samples: Record<Level, { area: string; title: string; question: string; options: string[]; answer: number; explanation: string; point: string }> = {
  N5: { area: "Từ vựng · Sinh hoạt hằng ngày", title: "Động từ trong câu đơn", question: "毎朝、コーヒーを ______。", options: ["飲みます", "読みます", "見ます", "聞きます"], answer: 0, explanation: "飲みます (のみます) nghĩa là “uống”. Với コーヒーを, đây là động từ phù hợp. Các lựa chọn còn lại lần lượt là đọc, xem và nghe.", point: "飲む · uống" },
  N4: { area: "Ngữ pháp · Nêu lý do", title: "Diễn đạt nguyên nhân", question: "今日は寒い ______、コートを着ます。", options: ["まで", "だけ", "ので", "より"], answer: 2, explanation: "ので nối nguyên nhân với kết quả: vì hôm nay lạnh nên mặc áo khoác. Các từ còn lại không diễn đạt quan hệ nguyên nhân ở đây.", point: "ので · vì, bởi vì" },
  N3: { area: "Ngữ pháp · Làm theo hướng dẫn", title: "Diễn đạt “đúng như”", question: "先生に言われた ______、宿題を出しました。", options: ["とおりに", "ばかりに", "ところに", "かわりに"], answer: 0, explanation: "とおりに nghĩa là làm đúng như điều được nói hoặc hướng dẫn. Câu này là “Tôi đã nộp bài tập đúng như thầy/cô dặn”.", point: "とおりに · đúng như" },
  N2: { area: "Ngữ pháp · Bổ sung thông tin", title: "Hai ưu điểm song song", question: "この店は駅に近い ______、値段も手ごろだ。", options: ["うえに", "ものの", "ところで", "わりに"], answer: 0, explanation: "うえに bổ sung thêm một đặc điểm cùng chiều: cửa hàng vừa gần ga, giá lại phải chăng.", point: "うえに · hơn nữa" },
  N1: { area: "Ngữ pháp · Khả năng tiêu cực", title: "Dự đoán hệ quả", question: "彼の発言は誤解を招き ______。", options: ["かねない", "がたい", "かねる", "きれない"], answer: 0, explanation: "～かねない diễn tả khả năng xảy ra một kết quả không mong muốn. Ở đây, phát biểu của anh ấy có thể gây hiểu lầm.", point: "かねない · có nguy cơ" },
};

export default function Home() {
  const [level, setLevel] = useState<Level>("N5");
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const sample = samples[level];
  const chooseLevel = (next: Level) => { setLevel(next); setSelected(null); setSubmitted(false); setSaveMessage(""); };

  useEffect(() => {
    authFetch("/api/me").then(response => response.json()).then(value => {
      const data = value as { learner?: { displayName?: string } | null };
      setAccount(data.learner?.displayName || null);
      if (data.learner) authFetch("/api/stats").then(response => response.ok ? response.json() : null).then(value => setStats(value as Stats | null)).catch(() => {});
    }).catch(() => setAccount(null));
  }, []);

  async function submitAnswer() {
    if (selected === null) return;
    setSubmitted(true);
    if (!account) return;
    try {
      const response = await authFetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: level, selectedOption: selected }),
      });
      setSaveMessage(response.ok ? "Đã lưu vào lịch sử học." : "Chưa lưu được bài làm, bạn có thể thử lại.");
      if (response.ok) {
        const fresh = await authFetch("/api/stats");
        if (fresh.ok) setStats(await fresh.json() as Stats);
      }
    } catch {
      setSaveMessage("Chưa lưu được bài làm, bạn có thể thử lại.");
    }
  }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-[1420px] items-center justify-between gap-4 px-5 py-4 md:px-10">
        <a href="/" className="flex items-center gap-3 text-[1.05rem] font-bold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">日</span>
          <span>Manabi<span className="text-[#e5593f]">.</span></span>
        </a>
        {account ? <span className="max-w-[45vw] truncate rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground">{account}</span>
          : <a href="/auth" className="rounded-full border border-border px-3 py-1 text-sm font-medium text-[#1c456b] hover:bg-[#eef5fb]">Đăng nhập để lưu tiến độ</a>}
      </div>
    </header>

    <main className="mx-auto grid max-w-[1420px] gap-8 px-5 py-8 md:px-10 lg:grid-cols-[248px_minmax(0,1fr)_254px] lg:gap-10 lg:py-12">
      <aside className="space-y-7">
        <div>
          <p className="eyebrow">Luyện thi JLPT</p>
          <h1 className="mt-2 text-[1.9rem] font-bold leading-tight tracking-tight">Học từng bước,<br />nhớ thật lâu.</h1>
          <p className="mt-3 max-w-xs text-[0.96rem] leading-7 text-muted-foreground">Chọn cấp độ và thử một câu hỏi. Bài học đầy đủ sẽ mở theo lộ trình của bạn.</p>
        </div>
        <nav aria-label="Các bước học" className="rounded-2xl border border-border bg-white p-3">
          <div className="flex items-center gap-3 rounded-xl bg-[#e8eef6] px-4 py-3 font-semibold text-[#244a76]"><BookOpen className="size-5" aria-hidden="true" /> Luyện tập</div>
          <a href="/tai-lieu" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-[#f4f7fa]"><FileText className="size-5" aria-hidden="true" /> Tài liệu của tôi</a>
          <a href="/thu-vien" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-[#f4f7fa]"><Library className="size-5" aria-hidden="true" /> Thư viện cộng đồng</a>
        </nav>
        <div className="rounded-2xl bg-[#172f46] p-5 text-white">
          <p className="text-sm font-semibold text-[#b2cadf]">Lộ trình cá nhân</p>
          <p className="mt-2 text-lg font-bold">Một cấp độ, từng ngày</p>
          <p className="mt-2 text-sm leading-6 text-[#c6d3df]">Theo dõi bài đã học, câu cần ôn và mức sẵn sàng trước kỳ thi.</p>
        </div>
      </aside>

      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Bắt đầu luyện</p><h2 className="mt-1 text-2xl font-bold tracking-tight md:text-[2rem]">Câu hỏi mẫu theo cấp độ</h2></div>
          <span className="text-sm text-muted-foreground">5 cấp độ · N5–N1</span>
        </div>
        <div aria-label="Chọn cấp JLPT" className="mt-6 flex flex-wrap gap-2">
          {levels.map(item => <Button key={item} type="button" variant={item === level ? "default" : "outline"} aria-pressed={item === level} onClick={() => chooseLevel(item)} className="h-11 min-w-16 rounded-xl px-5 text-base">{item}</Button>)}
        </div>
        <article className="mt-7 overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_20px_60px_rgba(27,47,69,0.07)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#f6f8fb] px-6 py-5 md:px-8">
            <div><p className="text-sm font-semibold text-[#55728f]">{level} · {sample.area}</p><h3 className="mt-1 text-xl font-bold">{sample.title}</h3></div>
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground">Câu 1 / 1</span>
          </div>
          <div className="px-6 pb-7 pt-7 md:px-8 md:pb-8">
            <p className="text-sm font-semibold text-muted-foreground">Chọn đáp án đúng</p>
            <p lang="ja" className="mt-4 rounded-xl border border-[#dce5ed] bg-[#f8fafc] px-5 py-6 text-[1.35rem] font-medium leading-relaxed md:text-[1.55rem]">{sample.question}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {sample.options.map((option, index) => {
                const chosen = selected === index;
                const stateClass = submitted && index === sample.answer ? "border-[#3a8f69] bg-[#eaf7ef] text-[#1e6847]" : submitted && chosen ? "border-[#d27c66] bg-[#fff0ec] text-[#9e412d]" : chosen ? "border-[#315b85] bg-[#eef5fb]" : "border-border bg-white hover:border-[#7395b6] hover:bg-[#f7fafd]";
                return <Button key={option} type="button" variant="outline" disabled={submitted} aria-pressed={chosen} onClick={() => setSelected(index)} className={`h-auto min-h-[62px] justify-start whitespace-normal rounded-xl border-2 px-4 py-3 text-left text-base font-medium ${stateClass}`}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-current/25 text-sm">{String.fromCharCode(65 + index)}</span><span lang="ja">{option}</span>
                </Button>;
              })}
            </div>
            {submitted && <div role="status" className={`mt-6 rounded-xl border p-5 ${selected === sample.answer ? "border-[#b7dfc7] bg-[#f1faf4]" : "border-[#f0c9bc] bg-[#fff7f3]"}`}>
              <p className="font-bold">{selected === sample.answer ? "Chính xác!" : "Chưa đúng — cùng xem lại nhé."}</p>
              <p className="mt-2 leading-7">{sample.explanation}</p>
              <p className="mt-2 text-sm font-semibold text-[#3b658b]">Ghi nhớ: {sample.point}</p>
            </div>}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Tự kiểm tra để nhớ lâu hơn</span>
              {submitted ? <Button variant="outline" type="button" onClick={() => { setSelected(null); setSubmitted(false); setSaveMessage(""); }} className="h-11 rounded-xl px-5"><RotateCcw aria-hidden="true" /> Làm lại</Button>
                : <Button type="button" disabled={selected === null} onClick={submitAnswer} className="h-11 rounded-xl px-6">Kiểm tra đáp án <ChevronRight aria-hidden="true" /></Button>}
            </div>
            {saveMessage && <p role="status" className="mt-2 text-sm text-muted-foreground">{saveMessage}</p>}
          </div>
        </article>
      </section>

      <aside className="space-y-5 lg:pt-16">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">{stats ? "Tiến độ đã lưu" : "Tiến độ học thử"}</h2><span className="text-sm font-semibold text-[#315b85]">{stats ? `${stats.accuracy}%` : submitted ? "1/1" : "0/1"}</span></div>
          <Progress value={stats ? stats.accuracy : submitted ? 100 : 0} className="mt-4 h-2 bg-[#e5edf4] [&_[data-slot=progress-indicator]]:bg-[#e5593f]" />
          {stats ? <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div><strong className="block text-lg">{stats.attempts}</strong><span className="text-xs text-muted-foreground">Câu đã làm</span></div>
            <div><strong className="block text-lg">{stats.xp}</strong><span className="text-xs text-muted-foreground">XP</span></div>
            <div><strong className="block text-lg">{stats.streak}</strong><span className="text-xs text-muted-foreground">Ngày liên tiếp</span></div>
          </div> : <p className="mt-3 text-sm leading-6 text-muted-foreground">Trả lời câu hỏi để xem lời giải và kiến thức cần ghi nhớ.</p>}
        </div>
        {stats && stats.wrongQuestions.length > 0 && <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-bold">Câu cần ôn</h2>
          <p className="mt-2 text-sm text-muted-foreground">Làm đúng lại để đưa câu ra khỏi danh sách.</p>
          <div className="mt-3 flex flex-wrap gap-2">{stats.wrongQuestions.filter((item): item is Level => levels.includes(item as Level)).map(item =>
            <Button key={item} type="button" variant="outline" size="sm" onClick={() => chooseLevel(item)}>{item} <ChevronRight aria-hidden="true" /></Button>
          )}</div>
        </div>}
        <div className="rounded-2xl border border-[#d8e4ef] bg-[#eef5fb] p-5">
          <p className="text-sm font-bold text-[#315b85]">Mẹo học nhanh</p>
          <p className="mt-2 text-[0.94rem] leading-7">Đọc câu tiếng Nhật trước khi nhìn các phương án. Sau khi làm, xem vì sao đáp án đúng và thử đọc lại cả câu.</p>
        </div>
      </aside>
    </main>
  </div>;
}
