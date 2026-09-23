"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GeneratedContent } from "@/lib/generated-content";

export default function LessonView({ content, author }: { content: GeneratedContent; author?: string | null }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const item = content.questions[questionIndex];
  const next = () => { setQuestionIndex(Math.min(content.questions.length - 1, questionIndex + 1)); setSelected(null); setChecked(false); };

  return <article className="rounded-2xl border border-border bg-white p-6 md:p-8">
    <div className="flex flex-wrap items-center gap-3"><span className="rounded-lg bg-[#e8eef6] px-3 py-1 text-sm font-bold text-[#315b85]">{content.level}</span>{author && <span className="text-sm text-muted-foreground">Do {author} chia sẻ</span>}</div>
    <h1 className="mt-4 text-2xl font-bold">{content.title}</h1>
    <p className="mt-4 whitespace-pre-wrap leading-8">{content.summary}</p>
    <div className="mt-8 border-t border-border pt-7">
      <p className="text-sm font-semibold text-muted-foreground">Câu {questionIndex + 1} / {content.questions.length}</p>
      <h2 lang="ja" className="mt-2 text-xl font-semibold leading-8">{item.question}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{item.options.map((option, index) => <Button key={index} type="button" variant="outline" disabled={checked} aria-pressed={selected === index} onClick={() => setSelected(index)}
        className={`h-auto min-h-14 justify-start whitespace-normal rounded-xl p-4 text-left ${checked && index === item.answerIndex ? "border-[#3a8f69] bg-[#eaf7ef]" : selected === index ? "border-[#315b85] bg-[#eef5fb]" : ""}`}>
        <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span><span lang="ja">{option}</span>
      </Button>)}</div>
      {checked && <div role="status" className="mt-5 rounded-xl bg-[#eef5fb] p-4 leading-7"><strong>{selected === item.answerIndex ? "Đúng rồi." : "Chưa đúng."}</strong><p className="mt-1">{item.explanation}</p><p className="mt-2 text-sm text-muted-foreground">Nguồn trong tài liệu: {item.sourceHint}</p></div>}
      <div className="mt-6 flex justify-end">{!checked ? <Button disabled={selected === null} onClick={() => setChecked(true)}>Kiểm tra</Button>
        : questionIndex < content.questions.length - 1 ? <Button onClick={next}>Câu tiếp theo</Button> : <span className="font-semibold text-[#1e6847]">Đã hoàn thành bài luyện</span>}</div>
    </div>
  </article>;
}
