"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  BadgePercent,
  BadgeQuestionMark,
  NewspaperIcon,
  PartyPopper,
  Image as ImageIcon,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const navGroups = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Commerce",
    items: [
      {
        label: "Customers",
        href: "/admin/customers",
        icon: Users,
      },
      {
        label: "Products",
        href: "/admin/products",
        icon: Package,
      },
      {
        label: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        label: "Reviews",
        href: "/admin/reviews",
        icon: Star,
      },
      {
        label: "Coupons",
        href: "/admin/coupons",
        icon: BadgePercent,
      },
    ],
  },
  {
    title: "Promotions",
    items: [
      {
        label: "Marketing",
        href: "/admin/top-banner",
        icon: PartyPopper,
      },
      {
        label: "Banners",
        href: "/admin/shop-banners",
        icon: ImageIcon,
      },
      {
        label: "Hero Banners",
        href: "/admin/home-banners",
        icon: Sparkles,
      },
      {
        label: "Newsletter",
        href: "/admin/newsletter",
        icon: NewspaperIcon,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        label: "Inquiries",
        href: "/admin/inquiries",
        icon: BadgeQuestionMark,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    const isDashboard = href === "/admin";
    return isDashboard
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-(--color-bg-dark) text-(--color-text-on-dark)">
      {/* Brand */}
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm ring-1 ring-white/10">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <div className="text-lg font-semibold tracking-wide text-white">
              Ledo Valley
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/60">
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4">
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
                {group.title}
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActiveRoute(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-all ${active
                          ? "bg-white text-(--color-bg-dark) shadow-sm"
                          : "text-white/80 hover:bg-white/8 hover:text-white"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${active
                              ? "bg-black/5 text-(--color-bg-dark)"
                              : "bg-white/5 text-white/70 group-hover:bg-white/10 group-hover:text-white"
                            }`}
                        >
                          <Icon size={18} strokeWidth={2} />
                        </div>

                        <span className={active ? "font-semibold" : "font-medium"}>
                          {item.label}
                        </span>
                      </div>

                      <ChevronRight
                        className={`h-4 w-4 transition ${active
                            ? "translate-x-0 opacity-100 text-black/40"
                            : "-translate-x-0.5 opacity-0 text-white/40 group-hover:translate-x-0 group-hover:opacity-100"
                          }`}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">
            Store Access
          </div>
          <div className="mt-1 text-sm text-white/80">
            Manage catalog, sales, and customer activity
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Ledo Valley
        </div>
      </div>
    </aside>
  );
}