"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { clearToken, loginUrl, replaceToken, tokenExpiresAt } from "@/lib/auth";

const WARN_MS = 3 * 60 * 1000;

/**
 * A few minutes before the admin login runs out, offer "Stay logged in"
 * so nothing being typed is lost. When it does run out, go to the login
 * page and come back here afterwards.
 */
export default function SessionTimer() {
  const [left, setLeft] = useState<number | null>(null);
  const [extending, setExtending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const tick = () => {
      const exp = tokenExpiresAt();
      if (!exp) return setLeft(null);
      const ms = exp - Date.now();
      if (ms <= 0) {
        clearToken();
        window.location.href = loginUrl();
        return;
      }
      setLeft(ms);
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  const extend = async () => {
    try {
      setExtending(true);
      setFailed(false);
      const res = await api.post("/auth/admin/refresh");
      replaceToken(res.data.token);
      const exp = tokenExpiresAt();
      setLeft(exp ? exp - Date.now() : null);
    } catch {
      setFailed(true);
    } finally {
      setExtending(false);
    }
  };

  if (left === null || left > WARN_MS) return null;
  const minutes = Math.max(1, Math.ceil(left / 60000));

  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-lg sm:flex-row sm:items-center"
    >
      <Clock className="hidden h-5 w-5 shrink-0 sm:block" />
      <p className="flex-1">
        Your login ends in about {minutes} minute{minutes === 1 ? "" : "s"}.
        {failed ? " Couldn't extend it: save your work and log in again." : " Save your work, or stay logged in."}
      </p>
      <button
        onClick={extend}
        disabled={extending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-2 font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
      >
        {extending && <Loader2 className="h-4 w-4 animate-spin" />}
        Stay logged in
      </button>
    </div>
  );
}
