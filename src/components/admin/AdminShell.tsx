"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import SessionTimer from "./SessionTimer";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // On phones and small tablets the menu slides in from the left.
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="h-screen bg-(--color-bg-page) lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
      {/* Sidebar: fixed column on large screens, drawer on small ones */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <aside
        id="admin-menu"
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-black/5 bg-(--color-bg-dark) transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex h-screen min-h-0 flex-col">
        {/* Topbar */}
        <div className="sticky top-0 z-20">
          <Topbar onMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
        </div>

        {/* Scrollable Content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-400 p-3 sm:p-6 xl:p-8">
            {children}
          </div>
        </main>
      </div>

      <SessionTimer />
    </div>
  );
}
