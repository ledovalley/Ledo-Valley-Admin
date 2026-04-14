"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function Topbar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;

    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    setLoggingOut(true);

    try {
      localStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token");

      await new Promise((r) => setTimeout(r, 300));
      router.replace("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/85 backdrop-blur supports-backdrop-filter:bg-white/75">
      <div className="flex min-h-18 items-center justify-between gap-4 px-4 py-4 sm:px-6">
        {/* Left */}
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure Admin
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-black/20" />
            <span>Dashboard</span>
          </div>

          <h1 className="truncate text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-text-secondary">
            Manage products, orders, customers, and store activity
          </p>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-black/10 bg-black/3 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--color-brand-primary) text-sm font-semibold text-white">
              A
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium text-text-primary">Admin</div>
              <div className="text-xs text-text-secondary">
                Super Admin
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            disabled={loggingOut}
            className="
              inline-flex items-center gap-2 rounded-xl
              border border-red-200 bg-red-50 px-4 py-2.5
              text-sm font-medium text-red-700
              transition hover:bg-red-100
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}