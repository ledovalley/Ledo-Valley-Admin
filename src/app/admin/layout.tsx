"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { getToken } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check both storages: logins without "Remember me" use sessionStorage.
    if (!getToken()) router.replace("/admin/login");
  }, [router]);

  return <AdminShell>{children}</AdminShell>;
}
