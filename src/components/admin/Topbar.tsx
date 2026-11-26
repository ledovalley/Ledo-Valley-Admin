"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearToken } from "@/lib/auth";
import GlobalSearch from "./GlobalSearch";
import {
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
} from "lucide-react";

export default function Topbar({ onMenu, menuOpen = false }: { onMenu?: () => void; menuOpen?: boolean }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;

    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    setLoggingOut(true);

    try {
      clearToken();

      await new Promise((r) => setTimeout(r, 300));
      router.replace("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/85 backdrop-blur supports-backdrop-filter:bg-white/75">
      <div className="flex min-h-18 items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
        {/* Menu button (phones and small tablets) */}
        {onMenu && (
          <button
            onClick={onMenu}
            aria-label="Open menu"
            aria-controls="admin-menu"
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 text-text-primary transition hover:bg-black/5 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Left */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 hidden items-center gap-2 sm:flex text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">
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

          <p className="mt-1 hidden text-sm text-text-secondary sm:block">
            Manage products, orders, customers, and store activity
          </p>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <GlobalSearch />
          <div className="hidden xl:flex items-center gap-3 rounded-2xl border border-black/10 bg-black/3 px-3 py-2">
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
            aria-label="Logout"
            className="
              inline-flex items-center gap-2 rounded-xl
              border border-red-200 bg-red-50 px-3 py-2.5 sm:px-4
              text-sm font-medium text-red-700
              transition hover:bg-red-100
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{loggingOut ? "Logging out…" : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}