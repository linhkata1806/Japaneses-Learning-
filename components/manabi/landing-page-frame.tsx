"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/browser-auth";
import { signOutAccount } from "@/lib/account-actions";

type Learner = { displayName: string; email: string; avatarUrl?: string | null };
type AuthMessage = { type: "manabi:auth-state"; learner: Learner | null };

export default function ManabiLandingFrame() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [authState, setAuthState] = useState<{ resolved: boolean; learner: Learner | null }>({ resolved: false, learner: null });
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;
    authFetch("/api/me")
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(value => {
        if (active) setAuthState({ resolved: true, learner: (value as { learner?: Learner | null }).learner || null });
      })
      .catch(() => {
        if (active) setAuthState({ resolved: true, learner: null });
      });
    return () => { active = false; };
  }, []);

  const sendAuthState = useCallback(() => {
    if (!authState.resolved) return;
    const message: AuthMessage = { type: "manabi:auth-state", learner: authState.learner };
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, [authState]);

  useEffect(() => { sendAuthState(); }, [sendAuthState]);

  useEffect(() => {
    async function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== "manabi:sign-out") return;
      try { await signOutAccount(); }
      catch (error) { setLogoutError(error instanceof Error ? error.message : "Không thể đăng xuất. Vui lòng thử lại."); }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <main className="kage-preview">
    {logoutError && <div role="alert" className="absolute right-5 top-5 z-50 rounded-lg bg-[#17201e] px-4 py-3 text-sm text-[#dfe7e0]">{logoutError}</div>}
    <iframe
      ref={frame}
      className="shader-frame"
      src="/landing-pages/kage.html"
      title="Manabi — học JLPT N5 đến N1"
      loading="eager"
      onLoad={sendAuthState}
      sandbox="allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
    />
  </main>;
}
