"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authFetch, getEmailClient } from "@/lib/browser-auth";
import { signOutAccount } from "@/lib/account-actions";
import EmailAuthForm from "./email-auth-form";

type Account = { displayName: string; email: string; avatarUrl?: string | null };

export default function LoginExperience({ returnTo, chatGPTPath, hostedUser }: { returnTo: string; chatGPTPath: string; hostedUser: Account | null }) {
  const [account, setAccount] = useState<Account | null>(hostedUser);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(!hostedUser);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const client = await getEmailClient();
        if (!active) return;
        const oauthError = new URLSearchParams(window.location.hash.slice(1)).get("error_description");
        if (oauthError) setMessage(oauthError);
        setAvailable(Boolean(client));
        if (client && !hostedUser) {
          const response = await authFetch("/api/me");
          if (!response.ok) throw new Error("Chưa thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.");
          const data = await response.json() as { learner: Account | null };
          if (active) setAccount(data.learner);
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Chưa thể kiểm tra đăng nhập.");
      } finally {
        if (active) { setAvailable(value => value ?? false); setChecking(false); }
      }
    }
    void check();
    return () => { active = false; };
  }, [hostedUser]);

  async function googleLogin() {
    setBusy(true); setMessage("");
    try {
      const client = await getEmailClient();
      if (!client) throw new Error("Google cần cấu hình Supabase trước khi sử dụng.");
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/login?returnTo=${encodeURIComponent(returnTo)}` },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chưa thể tiếp tục với Google.");
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true); setMessage("");
    try { await signOutAccount(); }
    catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đăng xuất. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  if (checking) return <p className="login-status" aria-busy="true">Đang kiểm tra tài khoản…</p>;

  if (account) return <div className="login-signed-in">
    <div className="login-identity">
      {account.avatarUrl ? <Image src={account.avatarUrl} alt="" width={42} height={42} unoptimized referrerPolicy="no-referrer" /> : <span aria-hidden="true">{(account.displayName || account.email).slice(0, 1).toUpperCase()}</span>}
      <div><strong>{account.displayName || account.email}</strong><small>{account.email}</small></div>
    </div>
    <p>Bạn đã đăng nhập. Tiếp tục đến trang đang xem hoặc đăng xuất để đổi tài khoản.</p>
    <Link href={returnTo} className="login-primary">Tiếp tục học <span aria-hidden="true">→</span></Link>
    <button type="button" disabled={busy} onClick={logout} className="login-text-action">{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button>
    {message && <p role="alert" className="login-error">{message}</p>}
  </div>;

  return <div className="login-actions">
    <button type="button" onClick={googleLogin} disabled={!available || busy} className="login-primary">
      {busy ? "Đang kết nối…" : "Tiếp tục với Google"}
      <span aria-hidden="true">↗</span>
    </button>
    {!available && <p className="login-configuration">Google cần kết nối Supabase và bật nhà cung cấp Google.</p>}
    <a href={chatGPTPath} target="_top" className={available ? "login-secondary" : "login-primary"}>Tiếp tục với ChatGPT <span aria-hidden="true">↗</span></a>
    <div className="login-divider"><span />hoặc dùng email<span /></div>
    <EmailAuthForm returnTo={returnTo} available={Boolean(available)} />
    {message && <p role="alert" className="login-error">{message}</p>}
    <p className="login-note">Sau khi đăng nhập, bạn sẽ quay lại trang đã chọn. Tài liệu cá nhân chỉ hiển thị trong tài khoản của bạn.</p>
  </div>;
}
