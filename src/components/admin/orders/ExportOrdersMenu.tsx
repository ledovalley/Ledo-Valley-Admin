"use client";

import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { downloadGstSummary, downloadOrdersCsv, type ExportScope, type ExportType } from "@/lib/exportOrders";

interface Props {
  /* The filters of the list on screen (tab, search, status, dates). */
  viewParams: Record<string, string>;
  startDate: string;
  endDate: string;
  disabled?: boolean;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}

const fmt = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* Last month in India time, as YYYY-MM (GST returns are filed for the month gone by). */
const lastMonth = () => {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
};

const rangeLabel = (from: string, to: string) =>
  from && to ? `${fmt(from)} – ${fmt(to)}` : from ? `from ${fmt(from)}` : to ? `up to ${fmt(to)}` : "all dates";

export default function ExportOrdersMenu({ viewParams, startDate, endDate, disabled, onDone, onError }: Props) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [gstMonth, setGstMonth] = useState(lastMonth);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const range = rangeLabel(startDate, endDate);

  const options: { key: string; title: string; hint: string; params: Record<string, string>; type: ExportType; scope: ExportScope }[] = [
    {
      key: "sales",
      title: "Sales report",
      hint: `Paid orders, ${range}. One row per order with GST, discount, shipping and totals.`,
      params: { startDate, endDate },
      type: "orders",
      scope: "sales",
    },
    {
      key: "sales-items",
      title: "Sales by product",
      hint: `Every item sold in paid orders, ${range}, with cost and margin.`,
      params: { startDate, endDate },
      type: "items",
      scope: "sales",
    },
    {
      key: "view",
      title: "Orders in this view",
      hint: "Exactly the orders listed on screen (this tab, search and filters), all pages.",
      params: viewParams,
      type: "orders",
      scope: "all",
    },
  ];

  const run = async (o: (typeof options)[number]) => {
    setOpen(false);
    setWorking(o.key);
    try {
      const count = await downloadOrdersCsv(o.params, o.type, o.scope);
      onDone(
        count === null
          ? `${o.title} downloaded.`
          : `${o.title} downloaded: ${count} order${count === 1 ? "" : "s"}.`
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't download the export.");
    } finally {
      setWorking(null);
    }
  };

  const runGst = async () => {
    if (!/^\d{4}-\d{2}$/.test(gstMonth)) return;
    setOpen(false);
    setWorking("gst");
    try {
      await downloadGstSummary(gstMonth);
      onDone(`GST summary for ${gstMonth} downloaded.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't download the GST summary.");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || !!working}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:opacity-50"
        title="Download orders as a spreadsheet (CSV)"
      >
        {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        {working ? "Preparing…" : "Export"}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl"
        >
          <p className="border-b border-black/5 px-4 py-3 text-xs text-text-secondary">
            Downloads a CSV file that opens in Excel or Google Sheets. Set the From / To dates first to choose the
            period.
          </p>
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              role="menuitem"
              onClick={() => run(o)}
              className="block w-full px-4 py-3 text-left transition hover:bg-black/5 focus:bg-black/5 focus:outline-none"
            >
              <span className="block text-sm font-medium text-text-primary">{o.title}</span>
              <span className="mt-0.5 block text-xs text-text-secondary">{o.hint}</span>
            </button>
          ))}
          <div className="border-t border-black/5 px-4 py-3">
            <span className="block text-sm font-medium text-text-primary">GST summary for your CA</span>
            <span className="mt-0.5 block text-xs text-text-secondary">
              One month, laid out for GSTR-1: sales by state, HSN summary, documents issued, every invoice and credit note.
            </span>
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor="gst-month" className="sr-only">
                Month
              </label>
              <input
                id="gst-month"
                type="month"
                value={gstMonth}
                max={new Date().toISOString().slice(0, 7)}
                onChange={(e) => setGstMonth(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                role="menuitem"
                onClick={runGst}
                disabled={!/^\d{4}-\d{2}$/.test(gstMonth)}
                className="rounded-lg bg-bg-dark px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-bg-dark/90 disabled:opacity-50"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
