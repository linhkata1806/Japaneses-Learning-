"use client";

import { useState } from "react";
import { getEmailClient } from "@/lib/browser-auth";

type Mode = "login" | "signup" | "recover";

export default function EmailAuthForm({ returnTo, available }: { returnTo: string; available: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const client = await getEmailClient();
      if (!client) throw new Error("Đăng nhập email chưa được cấu hình.");
      const callback = `${window.location.origin}/login?returnTo=${encodeURIComponent(returnTo)}`;
      if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: callback });
        if (error) throw error;
        setMessage("Nếu email đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu.");
      } else if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: callback } });
        if (error) throw error;
        if (data.session) window.location.assign(returnTo);
        else setMessage("Kiểm tra email để xác nhận tài khoản rồi quay lại đăng nhập.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign(returnTo);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đăng nhập lúc này.");
    } finally { setBusy(false); }
  }

  if (!available) return <p className="login-configuration">Email sẽ khả dụng sau khi kết nối dịch vụ xác thực Supabase.</p>;

  return <div className="login-email">
    <div className="login-tabs" role="group" aria-label="Tùy chọn email">
      <button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setMessage(""); }}>Đăng nhập</button>
      <button type="button" aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setMessage(""); }}>Đăng ký</button>
    </div>
    <form onSubmit={submit} className="login-email-form">
      <label>Email<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      {mode !== "recover" && <label>Mật khẩu<input type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} /></label>}
      <button disabled={busy} type="submit" className="login-secondary">{busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập bằng email" : mode === "signup" ? "Tạo tài khoản" : "Gửi liên kết đặt lại"}</button>
    </form>
    {mode === "login" && <button type="button" onClick={() => { setMode("recover"); setMessage(""); }} className="login-text-action">Quên mật khẩu?</button>}
    {mode === "recover" && <button type="button" onClick={() => { setMode("login"); setMessage(""); }} className="login-text-action">Quay lại đăng nhập</button>}
    {message && <p role="status" className="login-form-message">{message}</p>}
  </div>;
}
