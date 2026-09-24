"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authFetch } from "@/lib/browser-auth";
import { signOutAccount } from "@/lib/account-actions";

type Account = { displayName: string; email: string; avatarUrl?: string | null };

export function AccountControl({ inverse = false }: { inverse?: boolean }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    authFetch("/api/me").then(async response => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<{ learner: Account | null }>;
    }).then(data => { if (active) setAccount(data.learner); })
      .catch(() => { if (active) setError("Chưa xác minh được tài khoản."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function logout() {
    setBusy(true); setError("");
    try { await signOutAccount(); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đăng xuất. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  if (checking) return <span aria-label="Đang kiểm tra tài khoản" className="inline-block h-9 w-24 animate-pulse rounded-full bg-current opacity-10" />;
  if (error && !account) return <button type="button" onClick={() => window.location.reload()} className={`text-xs underline underline-offset-4 ${inverse ? "text-[#dfe7e0]" : "text-study-link"}`}>Chưa xác minh tài khoản · Tải lại</button>;
  if (!account) return <Link href="/login" className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${inverse ? "border-white/20 text-[#dfe7e0] hover:bg-white/10 focus-visible:outline-[#e5593f]" : "border-border text-primary hover:bg-study-tint focus-visible:outline-ring"}`}>Đăng nhập</Link>;

  return <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-sm">
    <span className={`inline-flex min-w-0 max-w-[48vw] items-center gap-2 rounded-full border px-2 py-1 ${inverse ? "border-white/15 text-[#dfe7e0]" : "border-border text-foreground"}`} title={account.email}>
      {account.avatarUrl ? <Image src={account.avatarUrl} alt="" width={28} height={28} unoptimized referrerPolicy="no-referrer" className="size-7 shrink-0 rounded-full object-cover" />
        : <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${inverse ? "bg-white/10 text-[#dfe7e0]" : "bg-study-tint text-primary"}`}>{(account.displayName || account.email).slice(0, 1).toUpperCase()}</span>}
      <span className="truncate">{account.displayName || account.email}</span>
    </span>
    <button type="button" onClick={logout} disabled={busy} className={`min-h-10 rounded-full px-3 font-semibold underline-offset-4 hover:underline disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${inverse ? "text-[#dfe7e0] focus-visible:outline-[#e5593f]" : "text-study-link focus-visible:outline-ring"}`}>{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button>
    {error && <span role="alert" className="w-full text-right text-xs text-[#e58b80]">{error}</span>}
  </div>;
}
