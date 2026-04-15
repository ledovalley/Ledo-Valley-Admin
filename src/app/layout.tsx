import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ledo Valley Admin",
  description: "Admin Panel",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-(--color-bg-page) text-(--color-text-primary)">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
