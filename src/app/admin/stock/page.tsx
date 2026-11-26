"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Loader2, RefreshCw, Search } from "lucide-react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToast } from "@/components/ui/ToastProvider";

interface StockRow {
  productId: string;
  productName: string;
  productStatus: string;
  variantId: string;
  sku: string;
  weight: string;
  stock: number;
  variantStatus: string;
  onSale: boolean;
  price?: number;
  costPrice?: number | null;
  image?: string | null;
  sold30: number;
  daysLeft: number | null;
  low: boolean;
}

type Filter = "all" | "low" | "soldout" | "offsale";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All packs" },
  { key: "low", label: "Low stock" },
  { key: "soldout", label: "Sold out" },
  { key: "offsale", label: "Not on sale" },
];

export default function StockPage() {
  const { success, error: toastError } = useToast();
  const [rows, setRows] = useState<StockRow[]>([]);
  const [threshold, setThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/stock");
      setRows(res.data.rows || []);
      setThreshold(res.data.threshold ?? 10);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Open with a filter from a link, e.g. /admin/stock?filter=low (dashboard).
    try {
      const f = new URLSearchParams(window.location.search).get("filter") as Filter | null;
      if (f && FILTERS.some((x) => x.key === f)) setFilter(f);
    } catch {
      // ignore
    }
  }, [load]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      low: rows.filter((r) => r.low).length,
      soldout: rows.filter((r) => r.onSale && r.stock === 0).length,
      offsale: rows.filter((r) => !r.onSale).length,
    }),
    [rows]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "low" && !r.low) return false;
      if (filter === "soldout" && !(r.onSale && r.stock === 0)) return false;
      if (filter === "offsale" && r.onSale) return false;
      if (q && !`${r.productName} ${r.sku} ${r.weight}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, filter, query]);

  const saveStock = async (row: StockRow) => {
    const raw = edits[row.variantId];
    const value = Number(raw);
    if (raw === undefined || raw === "" || !Number.isInteger(value) || value < 0) {
      toastError("Stock must be a whole number, 0 or more.");
      return;
    }
    try {
      setSaving(row.variantId);
      await api.put(`/admin/products/${row.productId}/variants/${row.variantId}`, { stock: value });
      setRows((prev) =>
        prev.map((r) =>
          r.variantId === row.variantId
            ? {
                ...r,
                stock: value,
                low: r.onSale && value <= threshold,
                daysLeft: r.sold30 > 0 ? Math.floor(value / (r.sold30 / 30)) : null,
              }
            : r
        )
      );
      setEdits((prev) => {
        const next = { ...prev };
        delete next[row.variantId];
        return next;
      });
      success(`${row.productName} ${row.weight}: stock set to ${value}`);
    } catch (err) {
      toastError(getErrorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-bg-dark/10 bg-bg-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-text-primary">
              <Boxes className="h-6 w-6" /> Stock
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Every pack in one place. Low stock = {threshold} or fewer (change it in Settings). &ldquo;Days left&rdquo; is at the last 30 days&apos; pace.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === f.key ? "bg-bg-dark text-white" : "border border-black/10 bg-white text-text-secondary hover:bg-black/5"
                }`}
              >
                {f.label} <span className="opacity-70">({counts[f.key]})</span>
              </button>
            ))}
          </div>
          <label className="relative block md:w-72">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tea, pack or SKU"
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            />
          </label>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-bg-dark/10 bg-bg-surface">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-bg-dark/5 text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Tea</th>
                <th className="px-4 py-3">Pack</th>
                <th className="px-4 py-3 text-right">Sold (30 days)</th>
                <th className="px-4 py-3 text-right">Days left</th>
                <th className="px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-secondary">
                    Nothing here.
                  </td>
                </tr>
              ) : (
                shown.map((r) => {
                  const editing = edits[r.variantId] !== undefined;
                  const value = editing ? edits[r.variantId] : String(r.stock);
                  return (
                    <tr key={r.variantId} className={`border-t border-black/5 ${r.low ? "bg-amber-50/60" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-bg-dark/5" />
                          )}
                          <div>
                            <Link href={`/admin/products/${r.productId}`} className="font-medium text-text-primary hover:underline">
                              {r.productName}
                            </Link>
                            {!r.onSale && (
                              <div className="text-xs text-text-secondary">
                                Not on sale ({r.productStatus !== "ACTIVE" ? r.productStatus.toLowerCase() : "pack turned off"})
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{r.weight}</div>
                        <div className="font-mono text-xs text-text-secondary">{r.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{r.sold30}</td>
                      <td className="px-4 py-3 text-right">
                        {r.daysLeft === null ? <span className="text-text-secondary">–</span> : (
                          <span className={r.daysLeft <= 7 ? "font-semibold text-amber-800" : ""}>~{r.daysLeft}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveStock(r);
                          }}
                        >
                          <input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            aria-label={`Stock for ${r.productName} ${r.weight}`}
                            value={value}
                            onChange={(e) => setEdits((prev) => ({ ...prev, [r.variantId]: e.target.value }))}
                            className={`w-24 rounded-lg border px-3 py-1.5 text-right ${
                              r.onSale && r.stock === 0 ? "border-red-300 text-red-700" : r.low ? "border-amber-300" : "border-black/10"
                            }`}
                          />
                          {editing && Number(value) !== r.stock ? (
                            <button
                              type="submit"
                              disabled={saving === r.variantId}
                              className="rounded-lg bg-bg-dark px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {saving === r.variantId ? "Saving…" : "Save"}
                            </button>
                          ) : r.onSale && r.stock === 0 ? (
                            <span className="text-xs font-semibold text-red-700">Sold out</span>
                          ) : r.low ? (
                            <span className="text-xs font-semibold text-amber-800">Low</span>
                          ) : null}
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
