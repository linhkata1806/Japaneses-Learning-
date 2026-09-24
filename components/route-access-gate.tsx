"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/browser-auth";

type RouteAccessGateProps = {
  children: React.ReactNode;
  admin?: boolean;
};

export function RouteAccessGate({ children, admin = false }: RouteAccessGateProps) {
  const [state, setState] = useState<"checking" | "allowed" | "forbidden" | "error">("checking");

  useEffect(() => {
    let active = true;
    async function authorize() {
      try {
        const response = await authFetch("/api/me");
        if (!response.ok) throw new Error("Unable to verify the current account.");
        const data = await response.json() as { learner?: unknown };
        if (!data.learner) {
          const returnTo = window.location.pathname + window.location.search;
          window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        if (admin) {
          const adminResponse = await authFetch("/api/admin/reviews");
          if (adminResponse.status === 401) {
            const returnTo = window.location.pathname + window.location.search;
            window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
            return;
          }
          if (adminResponse.status === 403) {
            if (active) setState("forbidden");
            return;
          }
          if (!adminResponse.ok) throw new Error("Quyền truy cập chưa thể xác minh.");
        }
        if (active) setState("allowed");
      } catch {
        if (active) setState("error");
      }
    }
    void authorize();
    return () => { active = false; };
  }, [admin]);

  if (state === "allowed") return children;
  if (state === "forbidden") return <main className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-2xl font-semibold">Bạn không có quyền truy cập trang này.</h1><Link href="/" className="mt-4 inline-block font-semibold text-study-link underline">Về trang chủ</Link></main>;
  if (state === "error") return <main role="alert" className="mx-auto max-w-3xl px-5 py-16"><p>Không thể xác minh quyền truy cập lúc này. Vui lòng thử tải lại trang.</p></main>;
  return <main aria-busy="true" className="mx-auto max-w-3xl px-5 py-16"><p className="text-sm text-muted-foreground">Đang xác minh quyền truy cập…</p></main>;
}
