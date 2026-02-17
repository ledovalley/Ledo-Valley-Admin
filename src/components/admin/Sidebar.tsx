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
  Image,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
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
  {
    label: "Marketing",
    href: "/admin/top-banner",
    icon: PartyPopper,
  },
  {
    label: "Banners",
    href: "/admin/shop-banners",
    icon: Image,
  },
  {
    label: "Inquiries",
    href: "/admin/inquiries",
    icon: BadgeQuestionMark,
  },
  {
    label: "Newsletter",
    href: "/admin/newsletter",
    icon: NewspaperIcon,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-(--color-bg-dark) text-(--color-text-on-dark) flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="text-xl font-playfair tracking-wide">
          Ledo Valley
        </div>
        <div className="text-xs opacity-70 mt-1">
          Admin Panel
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isDashboard = item.href === "/admin";

          const isActive = isDashboard
            ? pathname === "/admin"
            : pathname === item.href ||
            pathname.startsWith(item.href + "/");

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                text-sm font-extralight transition
                ${isActive
                  ? "bg-highlight text-(--color-bg-dark) font-medium"
                  : "text-(--color-text-on-dark) hover:bg-white/10"
                }
              `}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 text-xs opacity-60 border-t border-white/10">
        © {new Date().getFullYear()} Ledo Valley
      </div>
    </aside>
  );
}
