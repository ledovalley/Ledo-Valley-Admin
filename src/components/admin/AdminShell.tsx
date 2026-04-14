"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid h-screen grid-cols-[288px_minmax(0,1fr)] bg-(--color-bg-page)">
      {/* Sidebar */}
      <aside className="border-r border-black/5 bg-(--color-bg-dark)">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-h-0 flex-col">
        {/* Topbar */}
        <div className="sticky top-0 z-20">
          <Topbar />
        </div>

        {/* Scrollable Content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-400 p-4 sm:p-6 xl:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}