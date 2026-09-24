import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser, sanitizeReturnTo } from "@/app/chatgpt-auth";
import LoginExperience from "./login-experience";
import "./login.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[] }> }) {
  const params = await searchParams;
  const requested = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = sanitizeReturnTo(requested || "/learn", "/learn");
  const chatgpt = await getChatGPTUser();

  return <main className="login-shell">
    <div className="login-atmosphere" aria-hidden="true" />
    <div className="login-content">
      <header className="login-topbar">
        <Link href="/" className="login-brand" aria-label="Manabi — về trang chủ">
          <span className="login-mark" aria-hidden="true"><span /></span>
          <span className="login-wordmark">MANABI<span>.</span></span>
        </Link>
        <Link href="/" className="login-home">Về trang chủ <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel-head">
          <span className="login-panel-rule" aria-hidden="true" />
          <h1 id="login-title">Tài khoản học viên</h1>
          <p>Tiếp tục hành trình học tiếng Nhật.</p>
        </div>
        <LoginExperience returnTo={returnTo} chatGPTPath={chatGPTSignInPath(returnTo)} hostedUser={chatgpt ? { displayName: chatgpt.displayName, email: chatgpt.email } : null} />
      </section>

      <footer className="login-footer">
        <span>Manabi · Học từng câu một</span>
        <span>Tiến độ được lưu trong tài khoản của bạn.</span>
      </footer>
    </div>
  </main>;
}
