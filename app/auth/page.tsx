import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import EmailAuthForm from "./email-auth-form";

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const chatgpt = await getChatGPTUser();
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
    <Link href="/" className="mb-8 text-sm font-semibold text-study-link">← Về trang học thử</Link>
    <div className="rounded-2xl border border-border bg-white p-7 shadow-[0_20px_60px_rgba(27,47,69,0.07)]">
      <p className="eyebrow">Tài khoản học viên</p>
      <h1 className="mt-2 text-2xl font-bold">Lưu tiến độ học của bạn</h1>
      <p className="mt-2 leading-7 text-muted-foreground">Đăng nhập để giữ lịch sử câu trả lời và tiếp tục học trên thiết bị khác.</p>
      {chatgpt ? <p className="mt-6 rounded-xl bg-[#eaf7ef] p-4 text-[#1e6847]">Đã đăng nhập bằng ChatGPT: {chatgpt.email}</p>
        : <a href={chatGPTSignInPath("/")} target="_top" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-[#1c456b] px-5 font-semibold text-white hover:bg-[#173855]">Tiếp tục với ChatGPT</a>}
      <div className="my-6 flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" /> hoặc dùng email <span className="h-px flex-1 bg-border" /></div>
      <EmailAuthForm />
    </div>
  </main>;
}
