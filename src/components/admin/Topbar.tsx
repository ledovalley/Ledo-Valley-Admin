"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Topbar() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    if (loggingOut) return;

    const confirmed = window.confirm(
      "Are you sure you want to logout?"
    );
    if (!confirmed) return;

    setLoggingOut(true);

    try {
      // Clear both storages (remember-me support)
      localStorage.removeItem("admin_token");
      sessionStorage.removeItem("admin_token");

      // Small delay so UI feedback is visible
      await new Promise((r) => setTimeout(r, 300));

      // Replace so back button can't return to admin
      router.replace("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      {/* Left */}
      <div>
        <h1 className="text-lg font-medium text-(--color-text-primary)">
          Admin Dashboard
        </h1>
        <p className="text-xs text-text-secondary">
          Manage products, orders & customers
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Admin label (future: avatar / dropdown) */}
        <div className="text-sm text-text-secondary">
          Admin
        </div>

        <button
          onClick={logout}
          disabled={loggingOut}
          className="
            px-4 py-2 text-sm rounded-lg
            bg-(--color-brand-primary)
            text-white
            hover:opacity-90
            disabled:opacity-60
            disabled:cursor-not-allowed
            transition
          "
        >
          {loggingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </header>
  );
}
