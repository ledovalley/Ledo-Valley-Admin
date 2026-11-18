"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
    ORDER_TABS,
    formatDate,
    formatINR,
    nextStep,
    paymentBadgeClass,
    paymentLabel,
    statusBadgeClass,
    statusLabel,
    STATUS_LABEL,
    type NextStep,
} from "@/lib/orderFlow";
import { openPrintWindow, writePackingSlips, type SlipOrder } from "@/lib/packingSlip";
import { downloadBulkInvoices, downloadInvoice } from "@/lib/invoice";
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Loader2,
    PackageSearch,
    Printer,
    RefreshCw,
    Search,
    X,
} from "lucide-react";

interface Order {
    _id: string;
    orderNumber: string;
    customerSnapshot: {
        name: string;
        email: string;
        phone: string;
    };
    grandTotal: number;
    status: string;
    payment: {
        status: string;
        method?: string;
    };
    createdAt: string;
    attentionNote?: string;
}

interface ConfirmState {
    title: string;
    description: string;
    confirmText: string;
    tone: "danger" | "default";
    run: () => Promise<void>;
}

const PAGE_SIZE = 20;

export default function OrdersPage() {
    const router = useRouter();
    const { success, error: toastError, info } = useToast();

    const [tabKey, setTabKey] = useState(ORDER_TABS[0].key);
    const tab = ORDER_TABS.find((t) => t.key === tabKey) ?? ORDER_TABS[0];
    const [counts, setCounts] = useState<Record<string, number | null>>({});

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [statusAll, setStatusAll] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [rowBusy, setRowBusy] = useState<string | null>(null);
    const [bulk, setBulk] = useState<{ label: string; done: number; total: number } | null>(null);
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const requestId = useRef(0);

    const statusParam = tab.status || statusAll;
    const filterParams = useMemo(
        () => ({
            search,
            status: statusParam,
            paymentStatus: tab.paymentStatus ?? (tab.key === "all" ? paymentStatus : ""),
            startDate,
            endDate,
        }),
        [search, statusParam, tab.key, paymentStatus, startDate, endDate]
    );

    /* ---------- data ---------- */

    const fetchOrders = useCallback(async () => {
        const id = ++requestId.current;
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/admin/orders", {
                params: { ...filterParams, page, limit: PAGE_SIZE },
            });
            if (id !== requestId.current) return; // a newer search has started
            setOrders(res.data.orders ?? []);
            setPages(Math.max(1, Number(res.data.pages) || 1));
        } catch (err) {
            if (id === requestId.current) setError(getErrorMessage(err));
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [filterParams, page]);

    const fetchCounts = useCallback(async () => {
        const counted = ORDER_TABS.filter((t) => t.counted);
        const results = await Promise.all(
            counted.map(async (t) => {
                try {
                    const res = await api.get("/admin/orders", {
                        params: { status: t.status, paymentStatus: t.paymentStatus ?? "", page: 1, limit: 1 },
                    });
                    const d = res.data;
                    // With limit=1, "pages" equals the number of matching orders.
                    const n =
                        typeof d.total === "number"
                            ? d.total
                            : (d.orders?.length ?? 0) === 0
                                ? 0
                                : Number(d.pages) || 0;
                    return [t.key, n] as const;
                } catch {
                    return [t.key, null] as const;
                }
            })
        );
        setCounts(Object.fromEntries(results));
    }, []);

    const refreshAll = useCallback(() => {
        fetchOrders();
        fetchCounts();
    }, [fetchOrders, fetchCounts]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

    // Wait until typing pauses before searching.
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Clear the selection whenever the visible list changes.
    useEffect(() => {
        setSelected(new Set());
    }, [filterParams, page]);

    const switchTab = (key: string) => {
        setTabKey(key);
        setStatusAll("");
        setPaymentStatus("");
        setPage(1);
    };

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setStatusAll("");
        setPaymentStatus("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    const hasFilters = !!(searchInput || statusAll || paymentStatus || startDate || endDate);

    /* ---------- selection ---------- */

    const selectedOrders = orders.filter((o) => selected.has(o._id));
    const allOnPageSelected = orders.length > 0 && orders.every((o) => selected.has(o._id));

    const toggleOne = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const toggleAll = () =>
        setSelected(allOnPageSelected ? new Set() : new Set(orders.map((o) => o._id)));

    // A bulk step is offered only when every selected order has the same next step.
    const bulkStep: NextStep | null = useMemo(() => {
        if (selectedOrders.length === 0) return null;
        const first = nextStep(selectedOrders[0]);
        if (!first) return null;
        return selectedOrders.every((o) => nextStep(o)?.to === first.to) ? first : null;
    }, [selectedOrders]);

    /* ---------- actions ---------- */

    const advanceOne = (order: Order, step: NextStep) => {
        setConfirm({
            title: `${step.label}: #${order.orderNumber}?`,
            description: step.hint,
            confirmText: step.label,
            tone: step.to === "DELIVERED" ? "danger" : "default",
            run: async () => {
                try {
                    setRowBusy(order._id);
                    await api.patch(`/admin/orders/${order._id}/status`, { status: step.to });
                    success(`Order #${order.orderNumber} marked ${step.done}.`);
                    refreshAll();
                } catch (err) {
                    toastError(getErrorMessage(err));
                } finally {
                    setRowBusy(null);
                }
            },
        });
    };

    const advanceSelected = (step: NextStep) => {
        const targets = [...selectedOrders];
        setConfirm({
            title: `${step.label}: ${targets.length} order${targets.length > 1 ? "s" : ""}?`,
            description: `${step.hint} Orders: ${targets.map((o) => `#${o.orderNumber}`).join(", ")}`,
            confirmText: `${step.label} (${targets.length})`,
            tone: step.to === "DELIVERED" ? "danger" : "default",
            run: async () => {
                const failed: string[] = [];
                setBulk({ label: step.label, done: 0, total: targets.length });
                for (let i = 0; i < targets.length; i++) {
                    try {
                        await api.patch(`/admin/orders/${targets[i]._id}/status`, { status: step.to });
                    } catch (err) {
                        failed.push(`#${targets[i].orderNumber} (${getErrorMessage(err)})`);
                    }
                    setBulk({ label: step.label, done: i + 1, total: targets.length });
                }
                setBulk(null);
                const ok = targets.length - failed.length;
                if (ok > 0) success(`${ok} order${ok > 1 ? "s" : ""} marked ${step.done}.`);
                if (failed.length) toastError(`Couldn't update: ${failed.join(", ")}`);
                setSelected(new Set());
                refreshAll();
            },
        });
    };

    const runConfirm = async () => {
        if (!confirm) return;
        setConfirmLoading(true);
        // Close first so bulk progress is visible.
        const task = confirm.run;
        setConfirm(null);
        try {
            await task();
        } finally {
            setConfirmLoading(false);
        }
    };

    const invoiceOne = async (order: Order) => {
        try {
            setRowBusy(order._id);
            await downloadInvoice(order._id, order.orderNumber);
        } catch {
            toastError(`Couldn't download the invoice for #${order.orderNumber}.`);
        } finally {
            setRowBusy(null);
        }
    };

    const invoicesSelected = async () => {
        const targets = [...selectedOrders];
        if (targets.length > 1) info("Your browser may ask to allow multiple downloads. Choose Allow.");
        setBulk({ label: "Downloading invoices", done: 0, total: targets.length });
        const failed: string[] = [];
        for (let i = 0; i < targets.length; i++) {
            try {
                await downloadInvoice(targets[i]._id, targets[i].orderNumber);
            } catch {
                failed.push(`#${targets[i].orderNumber}`);
            }
            setBulk({ label: "Downloading invoices", done: i + 1, total: targets.length });
            await new Promise((r) => setTimeout(r, 350));
        }
        setBulk(null);
        if (failed.length) toastError(`Couldn't download: ${failed.join(", ")}`);
    };

    const invoicesForView = async () => {
        try {
            setBulk({ label: "Preparing invoices", done: 0, total: 1 });
            await downloadBulkInvoices(filterParams);
        } catch {
            toastError("Couldn't download invoices. Check that this view has orders.");
        } finally {
            setBulk(null);
        }
    };

    const printSlips = async (targets: Order[]) => {
        const w = openPrintWindow(); // must open inside the click
        if (!w) {
            toastError("Your browser blocked the print window. Allow pop-ups for this site.");
            return;
        }
        try {
            setBulk({ label: "Preparing packing slips", done: 0, total: targets.length });
            const full: SlipOrder[] = [];
            for (let i = 0; i < targets.length; i++) {
                const res = await api.get(`/admin/orders/${targets[i]._id}`);
                full.push(res.data);
                setBulk({ label: "Preparing packing slips", done: i + 1, total: targets.length });
            }
            writePackingSlips(w, full);
        } catch (err) {
            w.close();
            toastError(getErrorMessage(err));
        } finally {
            setBulk(null);
        }
    };

    /* ---------- render ---------- */

    const busy = !!bulk;

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold text-text-primary">Orders</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Pack the orders in "To pack" and book their pickup. Shiprocket then moves them to Shipped and Delivered automatically.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={invoicesForView}
                        disabled={busy || loading || orders.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:opacity-50"
                        title="Download one PDF with invoices for every order in this tab and filter"
                    >
                        <Download className="h-4 w-4" />
                        Invoices for this view
                    </button>
                    <button
                        onClick={refreshAll}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </section>

            {/* Tabs */}
            <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Order stages">
                {ORDER_TABS.map((t) => {
                    const active = t.key === tab.key;
                    const n = counts[t.key];
                    return (
                        <button
                            key={t.key}
                            onClick={() => switchTab(t.key)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${active
                                ? "border-brand-primary bg-brand-primary text-white"
                                : "border-black/10 bg-white text-text-primary hover:bg-black/5"
                                }`}
                        >
                            {t.label}
                            {t.counted && typeof n === "number" && (
                                <span
                                    className={`min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${active
                                        ? "bg-white/20 text-white"
                                        : n > 0
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-black/5 text-text-secondary"
                                        }`}
                                >
                                    {n}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Filters */}
            <section className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:flex-row lg:items-end">
                <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">Search</label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <input
                            placeholder="Order number, name, phone or email"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-text-secondary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                    </div>
                </div>

                {tab.key === "all" && (
                    <>
                        <div className="lg:w-48">
                            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Status</label>
                            <select
                                value={statusAll}
                                onChange={(e) => {
                                    setStatusAll(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            >
                                <option value="">Any status</option>
                                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:w-44">
                            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Payment</label>
                            <select
                                value={paymentStatus}
                                onChange={(e) => {
                                    setPaymentStatus(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            >
                                <option value="">Any payment</option>
                                <option value="SUCCESS">Paid</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                                <option value="REFUNDED">Refunded</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="grid grid-cols-2 gap-3 lg:w-80">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-text-secondary">From</label>
                        <input
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-text-secondary">To</label>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                    </div>
                </div>

                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-black/5"
                    >
                        <X className="h-4 w-4" />
                        Clear
                    </button>
                )}
            </section>

            {/* Bulk bar */}
            {(selected.size > 0 || bulk) && (
                <section className="sticky top-2 z-10 flex flex-col gap-3 rounded-2xl border border-brand-primary/30 bg-brand-primary/5 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    {bulk ? (
                        <div className="flex items-center gap-3 text-sm font-medium text-text-primary">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {bulk.label}… {bulk.total > 1 ? `${bulk.done} of ${bulk.total}` : ""}
                        </div>
                    ) : (
                        <>
                            <div className="text-sm font-medium text-text-primary">
                                {selected.size} selected
                                <button
                                    onClick={() => setSelected(new Set())}
                                    className="ml-3 text-xs font-normal text-text-secondary underline-offset-2 hover:underline"
                                >
                                    Clear selection
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {bulkStep && (
                                    <button
                                        onClick={() => advanceSelected(bulkStep)}
                                        className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
                                    >
                                        {bulkStep.label} ({selected.size})
                                    </button>
                                )}
                                <button
                                    onClick={() => printSlips(selectedOrders)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-black/5"
                                >
                                    <Printer className="h-4 w-4" />
                                    Packing slips
                                </button>
                                <button
                                    onClick={invoicesSelected}
                                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-black/5"
                                >
                                    <Download className="h-4 w-4" />
                                    Invoices
                                </button>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* List */}
            {loading && orders.length === 0 ? (
                <div className="space-y-3 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-xl bg-black/5" />
                    ))}
                </div>
            ) : error ? (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                    <span>{error}</span>
                    <button onClick={fetchOrders} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-medium hover:bg-red-100">
                        Try again
                    </button>
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-black/10 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5">
                        <PackageSearch className="h-5 w-5 text-text-secondary" />
                    </div>
                    <p className="mt-4 text-base font-semibold text-text-primary">
                        {hasFilters ? "No orders match these filters." : tab.empty}
                    </p>
                </div>
            ) : (
                <div className={`overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition ${loading ? "opacity-60" : ""}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-200 text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-text-secondary">
                                <tr>
                                    <th className="w-12 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all orders on this page"
                                            checked={allOnPageSelected}
                                            onChange={toggleAll}
                                            disabled={busy}
                                            className="h-4 w-4 cursor-pointer accent-(--color-brand-primary)"
                                        />
                                    </th>
                                    <th className="px-4 py-3">Order</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Next step</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => {
                                    const step = nextStep(order);
                                    const isSelected = selected.has(order._id);
                                    const isBusy = rowBusy === order._id;
                                    return (
                                        <tr
                                            key={order._id}
                                            onClick={() => router.push(`/admin/orders/${order._id}`)}
                                            className={`cursor-pointer border-t border-black/10 transition hover:bg-gray-50 ${isSelected ? "bg-brand-primary/5" : ""}`}
                                        >
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select order ${order.orderNumber}`}
                                                    checked={isSelected}
                                                    onChange={() => toggleOne(order._id)}
                                                    disabled={busy}
                                                    className="h-4 w-4 cursor-pointer accent-(--color-brand-primary)"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-text-primary">#{order.orderNumber}</div>
                                                <div className="mt-0.5 text-xs text-text-secondary">{formatDate(order.createdAt)}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-text-primary">{order.customerSnapshot.name}</div>
                                                <div className="mt-0.5 text-xs text-text-secondary">{order.customerSnapshot.phone}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-text-primary">{formatINR(order.grandTotal)}</div>
                                                <div className="mt-0.5 text-xs text-text-secondary">{order.payment.method || "Online"}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusBadgeClass(order.status)}`}>
                                                        {statusLabel(order.status)}
                                                    </span>
                                                    {order.attentionNote && (
                                                        <span title={order.attentionNote} className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-300">
                                                            ⚠ Needs attention
                                                        </span>
                                                    )}
                                                    {order.payment.status !== "SUCCESS" && (
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${paymentBadgeClass(order.payment.status)}`}>
                                                            {paymentLabel(order.payment.status)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {step ? (
                                                        <button
                                                            onClick={() => advanceOne(order, step)}
                                                            disabled={isBusy || busy}
                                                            className={`inline-flex min-w-32 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition disabled:opacity-50 ${step.to === "DELIVERED" ? "bg-green-600 hover:bg-green-700" : "bg-brand-primary hover:bg-brand-primary/90"}`}
                                                        >
                                                            {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                                            {step.label}
                                                        </button>
                                                    ) : order.payment.status === "REFUND_PENDING" ? (
                                                        <button
                                                            onClick={() => router.push(`/admin/orders/${order._id}`)}
                                                            className="min-w-32 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                                                        >
                                                            Refund
                                                        </button>
                                                    ) : order.status === "RETURN_REQUESTED" ? (
                                                        <button
                                                            onClick={() => router.push(`/admin/orders/${order._id}`)}
                                                            className="min-w-32 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
                                                        >
                                                            Review return
                                                        </button>
                                                    ) : (
                                                        <span className="min-w-32 text-center text-xs text-text-secondary">—</span>
                                                    )}
                                                    <button
                                                        onClick={() => printSlips([order])}
                                                        disabled={busy}
                                                        title="Print packing slip"
                                                        aria-label={`Print packing slip for ${order.orderNumber}`}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-text-secondary transition hover:bg-black/5 hover:text-text-primary disabled:opacity-50"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => invoiceOne(order)}
                                                        disabled={isBusy || busy}
                                                        title="Download invoice"
                                                        aria-label={`Download invoice for ${order.orderNumber}`}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-text-secondary transition hover:bg-black/5 hover:text-text-primary disabled:opacity-50"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between gap-3">
                    <button
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </button>
                    <div className="text-sm text-text-secondary">
                        Page <span className="font-medium text-text-primary">{page}</span> of{" "}
                        <span className="font-medium text-text-primary">{pages}</span>
                    </div>
                    <button
                        disabled={page >= pages || loading}
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            <ConfirmDialog
                open={!!confirm}
                title={confirm?.title}
                description={confirm?.description}
                confirmText={confirm?.confirmText}
                cancelText="Not now"
                tone={confirm?.tone ?? "default"}
                loading={confirmLoading}
                onClose={() => {
                    if (!confirmLoading) setConfirm(null);
                }}
                onConfirm={runConfirm}
            />
        </div>
    );
}
