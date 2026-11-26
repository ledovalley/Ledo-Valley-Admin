"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Search, ShoppingCart, User, X } from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatINR, statusLabel } from "@/lib/orderFlow";

interface Results {
  orders: { id: string; orderNumber: string; date: string; status: string; total: number; name: string; phone: string; awb: string; invoice: string }[];
  customers: { id: string; name: string; email: string; phone: string }[];
  products: { id: string; name: string; status: string; packs: string }[];
}

interface Item {
  key: string;
  href: string;
  icon: "order" | "customer" | "product";
  title: string;
  sub: string;
}

const EMPTY: Results = { orders: [], customers: [], products: [] };

/**
 * Search box in the top bar: order number, invoice, tracking number,
 * customer name / phone / email, or a tea. Press "/" to jump to it.
 */
export default function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // "/" focuses the search (unless typing somewhere else).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setMobileOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close when clicking elsewhere.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Search while typing (after a short pause).
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    let live = true;
    const id = window.setTimeout(async () => {
      try {
        const res = await api.get<Results>("/admin/search", { params: { q: text } });
        if (live) {
          setResults(res.data);
          setActive(0);
          setOpen(true);
        }
      } catch {
        if (live) setResults(EMPTY);
      } finally {
        if (live) setLoading(false);
      }
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(id);
    };
  }, [q]);

  const items: Item[] = useMemo(
    () => [
      ...results.orders.map((o) => ({
        key: `o${o.id}`,
        href: `/admin/orders/${o.id}`,
        icon: "order" as const,
        title: `#${o.orderNumber} · ${o.name || "—"}`,
        sub: [formatDate(o.date), statusLabel(o.status), formatINR(o.total), o.awb && `AWB ${o.awb}`].filter(Boolean).join(" · "),
      })),
      ...results.customers.map((c) => ({
        key: `c${c.id}`,
        href: `/admin/customers/${c.id}`,
        icon: "customer" as const,
        title: c.name || c.email || c.phone,
        sub: [c.phone, c.email].filter(Boolean).join(" · "),
      })),
      ...results.products.map((p) => ({
        key: `p${p.id}`,
        href: `/admin/products/${p.id}`,
        icon: "product" as const,
        title: p.name,
        sub: [p.packs, p.status !== "ACTIVE" ? p.status.toLowerCase() : ""].filter(Boolean).join(" · "),
      })),
    ],
    [results]
  );

  const go = (item?: Item) => {
    if (!item) return;
    setOpen(false);
    setMobileOpen(false);
    setQ("");
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setMobileOpen(false);
      inputRef.current?.blur();
    }
  };

  const Icon = ({ kind }: { kind: Item["icon"] }) =>
    kind === "order" ? <ShoppingCart className="h-4 w-4" /> : kind === "customer" ? <User className="h-4 w-4" /> : <Package className="h-4 w-4" />;

  const groups: { label: string; icon: Item["icon"] }[] = [
    { label: "Orders", icon: "order" },
    { label: "Customers", icon: "customer" },
    { label: "Teas", icon: "product" },
  ];

  return (
    <>
      {/* Small screens: a search button that opens the box */}
      <button
        type="button"
        onClick={() => {
          setMobileOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        aria-label="Search"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-text-primary transition hover:bg-black/5 md:hidden"
      >
        <Search className="h-5 w-5" />
      </button>

      <div
        ref={boxRef}
        className={`${
          mobileOpen ? "fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white p-3 shadow-lg" : "hidden"
        } md:relative md:inset-auto md:z-auto md:block md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
      >
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 md:w-72 lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={open && items.length > 0}
              aria-controls="admin-search-results"
              aria-label="Search orders, customers and teas"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => q.trim().length >= 2 && setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Order no., name, phone, AWB…"
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-secondary" />
            ) : (
              <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-black/10 px-1.5 text-[11px] text-text-secondary md:block">
                /
              </kbd>
            )}
          </div>
          {mobileOpen && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setOpen(false);
              }}
              aria-label="Close search"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-black/5 md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {open && q.trim().length >= 2 && !loading && (
          <div
            id="admin-search-results"
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-black/10 bg-white py-2 shadow-xl md:right-auto md:w-[26rem]"
          >
            {items.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-secondary">Nothing found for “{q.trim()}”.</p>
            ) : (
              groups.map((g) => {
                const list = items.filter((i) => i.icon === g.icon);
                if (!list.length) return null;
                return (
                  <div key={g.label} className="py-1">
                    <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{g.label}</p>
                    {list.map((item) => {
                      const index = items.indexOf(item);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          role="option"
                          aria-selected={index === active}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(item)}
                          className={`flex w-full items-start gap-3 px-4 py-2 text-left ${index === active ? "bg-black/5" : ""}`}
                        >
                          <span className="mt-0.5 text-text-secondary">
                            <Icon kind={item.icon} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-text-primary">{item.title}</span>
                            {item.sub && <span className="block truncate text-xs text-text-secondary">{item.sub}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}
