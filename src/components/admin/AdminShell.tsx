"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Right Side */}
      <div className="flex-1 flex flex-col ml-64">

        {/* Topbar */}
        <div className="fixed top-0 left-64 right-0 h-16 z-20">
          <Topbar />
        </div>

        {/* Scrollable Content */}
        <main className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto p-6 bg-(--color-bg-page)">
          {children}
        </main>

      </div>
    </div>
  );
}
