"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getEmailClient } from "@/lib/browser-auth";

type Mode = "login" | "signup" | "recover";

export default function EmailAuthForm() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { getEmailClient().then(client => setAvailable(Boolean(client))).catch(() => setAvailable(false)); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const client = await getEmailClient();
      if (!client) throw new Error("Đăng nhập email chưa được cấu hình.");
      if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
        if (error) throw error;
        setMessage("Nếu email đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu.");
      } else if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/" } });
        if (error) throw error;
        if (data.session) window.location.assign("/");
        else setMessage("Kiểm tra email để xác nhận tài khoản rồi quay lại đăng nhập.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign("/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đăng nhập lúc này.");
    } finally { setBusy(false); }
  }

  if (available === null) return <p className="text-sm text-muted-foreground">Đang kiểm tra đăng nhập email…</p>;
  if (!available) return <p className="rounded-xl bg-[#f5f7f9] p-4 text-sm leading-6 text-muted-foreground">Đăng nhập email sẽ hoạt động sau khi kết nối dịch vụ xác thực. Bạn có thể dùng ChatGPT để thử trước.</p>;

  return <div>
    <div className="mb-5 flex gap-2">
      <Button type="button" variant={mode === "login" ? "default" : "outline"} onClick={() => { setMode("login"); setMessage(""); }}>Đăng nhập</Button>
      <Button type="button" variant={mode === "signup" ? "default" : "outline"} onClick={() => { setMode("signup"); setMessage(""); }}>Đăng ký</Button>
    </div>
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-semibold">Email
        <Input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 h-11" />
      </label>
      {mode !== "recover" && <label className="block text-sm font-semibold">Mật khẩu
        <Input type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 h-11" />
      </label>}
      <Button disabled={busy} type="submit" className="h-11 w-full">{busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập bằng email" : mode === "signup" ? "Tạo tài khoản" : "Gửi liên kết đặt lại"}</Button>
    </form>
    {mode === "login" && <button type="button" onClick={() => { setMode("recover"); setMessage(""); }} className="mt-4 text-sm font-semibold text-study-link">Quên mật khẩu?</button>}
    {mode === "recover" && <button type="button" onClick={() => { setMode("login"); setMessage(""); }} className="mt-4 text-sm font-semibold text-study-link">Quay lại đăng nhập</button>}
    {message && <p role="status" className="mt-4 rounded-xl bg-study-tint p-3 text-sm leading-6">{message}</p>}
  </div>;
}
