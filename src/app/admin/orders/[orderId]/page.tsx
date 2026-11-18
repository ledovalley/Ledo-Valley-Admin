"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
    PROGRESS_STEPS,
    canCancel,
    formatDate,
    formatINR,
    nextStep,
    paymentBadgeClass,
    paymentLabel,
    progressIndex,
    statusBadgeClass,
    statusLabel,
    trackingUrl,
} from "@/lib/orderFlow";
import { addressLines, openPrintWindow, writePackingSlips } from "@/lib/packingSlip";
import { downloadInvoice } from "@/lib/invoice";
import {
    ArrowLeft,
    BadgeIndianRupee,
    Check,
    Copy,
    FileText,
    Loader2,
    MapPin,
    Package2,
    Phone,
    Printer,
    RefreshCw,
    RotateCcw,
    Truck,
    User,
} from "lucide-react";

interface OrderItem {
    productId: string;
    productName: string;
    productSlug: string;
    variantId: string;
    variantSku: string;
    quantity: number;
    price: number;
    finalPrice: number;
    subtotal: number;
}

interface Order {
    _id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    customerSnapshot: {
        name: string;
        email: string;
        phone: string;
    };
    shippingAddress: {
        name: string;
        phone?: string;
        addressLine1: string;
        addressLine2?: string;
        landmark?: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: OrderItem[];
    itemsTotal: number;
    gstAmount: number;
    shippingAmount: number;
    codCharge?: number;
    discountAmount: number;
    grandTotal: number;
    payment: {
        status: string;
        method?: string;
        failureReason?: string;
        lastCheckedAt?: string;
    };
    attentionNote?: string;
    returnInfo?: {
        status: string;
        reason?: string;
        rejectionReason?: string;
    };
    shipping?: {
        shiprocketOrderId?: string;
        shipmentId?: string;
        awbCode?: string;
        courierName?: string;
        status?: string;
        shippedAt?: string;
        deliveredAt?: string;
    };
    cancellationReason?: string;
}

interface ConfirmState {
    title: string;
    description: string;
    confirmText: string;
    tone: "danger" | "default";
    request: () => Promise<unknown>;
    successMessage: string;
}

function Card({
    title,
    icon,
    action,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    {icon}
                    <span>{title}</span>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

export default function OrderDetailsPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const { success, error: showError, info } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [confirm, setConfirm] = useState<ConfirmState | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);
    const [copied, setCopied] = useState(false);

    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelRemarks, setCancelRemarks] = useState("");
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectRemarks, setRejectRemarks] = useState("");

    const fetchOrder = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/admin/orders/${orderId}`);
            setOrder(res.data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) fetchOrder();
    }, [orderId, fetchOrder]);

    const runConfirm = async () => {
        if (!confirm) return;
        try {
            setActionLoading(true);
            await confirm.request();
            success(confirm.successMessage);
            setConfirm(null);
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setActionLoading(false);
        }
    };

    const submitCancel = async () => {
        if (!order || !cancelRemarks.trim()) return;
        try {
            setActionLoading(true);
            await api.patch(`/admin/orders/${order._id}/status`, {
                status: "CANCELLED",
                remarks: cancelRemarks.trim(),
            });
            success(`Order #${order.orderNumber} cancelled.`);
            setCancelOpen(false);
            setCancelRemarks("");
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setActionLoading(false);
        }
    };

    const checkPayment = async () => {
        if (!order) return;
        try {
            setCheckingPayment(true);
            const res = await api.post(`/admin/orders/${order._id}/verify-payment`);
            const { result, message } = res.data || {};
            if (result === "paid") success(message, "Payment found");
            else if (result === "mismatch") showError(message);
            else info(message);
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setCheckingPayment(false);
        }
    };

    const submitReject = async () => {
        if (!order || !rejectRemarks.trim()) return;
        try {
            setActionLoading(true);
            await api.patch(`/admin/orders/${order._id}/reject-return`, {
                remarks: rejectRemarks.trim(),
            });
            success("Return rejected.");
            setRejectOpen(false);
            setRejectRemarks("");
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        if (!order) return;
        try {
            setDownloadingInvoice(true);
            await downloadInvoice(order._id, order.orderNumber);
        } catch {
            showError("Couldn't download the invoice.");
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const handlePrintSlip = () => {
        if (!order) return;
        const w = openPrintWindow();
        if (!w) {
            showError("Your browser blocked the print window. Allow pop-ups for this site.");
            return;
        }
        writePackingSlips(w, [order]);
    };

    const copyAddress = async () => {
        if (!order) return;
        const a = order.shippingAddress;
        const phone = a.phone || order.customerSnapshot.phone;
        const text = [a.name, ...addressLines(a), phone ? `Phone: ${phone}` : ""]
            .filter(Boolean)
            .join("\n");
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            showError("Couldn't copy. Select the address and copy it manually.");
        }
    };

    if (loading && !order) {
        return (
            <div className="space-y-4">
                <div className="h-28 animate-pulse rounded-3xl bg-black/5" />
                <div className="h-24 animate-pulse rounded-2xl bg-black/5" />
                <div className="h-72 animate-pulse rounded-2xl bg-black/5" />
            </div>
        );
    }

    if (error && !order) {
        return (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
                <span>{error}</span>
                <button onClick={fetchOrder} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-medium hover:bg-red-100">
                    Try again
                </button>
            </div>
        );
    }

    if (!order) {
        return <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">Order not found</div>;
    }

    const step = nextStep(order);
    const progress = progressIndex(order);
    const cancelled = order.status === "CANCELLED";
    const addr = order.shippingAddress;
    const shipPhone = addr.phone || order.customerSnapshot.phone;
    const isCodPending = order.payment.method === "COD" && order.payment.status === "PENDING";
    const refundPending = cancelled && order.payment.status === "REFUND_PENDING";
    const canCheckPayment =
        order.payment.method !== "COD" && ["PENDING", "FAILED"].includes(order.payment.status);

    const secondaryActions: { label: string; className: string; onClick: () => void }[] = [];
    if (refundPending) {
        secondaryActions.push({
            label: `Refund ${formatINR(order.grandTotal)} now`,
            className: "bg-red-600 text-white hover:bg-red-700",
            onClick: () =>
                setConfirm({
                    title: `Refund ${formatINR(order.grandTotal)} to the customer?`,
                    description: "The customer cancelled this paid order. This sends the full amount back through PayU.",
                    confirmText: "Refund now",
                    tone: "danger",
                    request: () => api.patch(`/admin/orders/${order._id}/refund-cancelled`),
                    successMessage: "Refund started.",
                }),
        });
    }
    if (order.status === "RETURN_REQUESTED") {
        secondaryActions.push({
            label: "Reject return",
            className: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
            onClick: () => setRejectOpen(true),
        });
        secondaryActions.push({
            label: "Approve return",
            className: "bg-orange-600 text-white hover:bg-orange-700",
            onClick: () =>
                setConfirm({
                    title: "Approve this return?",
                    description: "The customer's return will be approved so you can arrange pickup.",
                    confirmText: "Approve return",
                    tone: "default",
                    request: () => api.patch(`/admin/orders/${order._id}/approve-return`),
                    successMessage: "Return approved.",
                }),
        });
    }
    if (order.status === "RETURN_APPROVED") {
        secondaryActions.push({
            label: "Complete refund",
            className: "bg-red-600 text-white hover:bg-red-700",
            onClick: () =>
                setConfirm({
                    title: "Complete the refund?",
                    description: "Only do this after the returned item has been received and checked.",
                    confirmText: "Complete refund",
                    tone: "danger",
                    request: () => api.patch(`/admin/orders/${order._id}/complete-refund`),
                    successMessage: "Refund completed.",
                }),
        });
    }
    if (isCodPending) {
        secondaryActions.push({
            label: "Cash received (COD)",
            className: "bg-teal-600 text-white hover:bg-teal-700",
            onClick: () =>
                setConfirm({
                    title: "Mark cash as received?",
                    description: "Confirm the cash for this Cash on Delivery order has been collected.",
                    confirmText: "Cash received",
                    tone: "default",
                    request: () => api.patch(`/admin/orders/${order._id}/payment-status`, { status: "SUCCESS" }),
                    successMessage: "Payment marked as received.",
                }),
        });
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                    <Link
                        href="/admin/orders"
                        className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        All orders
                    </Link>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-semibold text-text-primary">#{order.orderNumber}</h1>
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(order.status)}`}>
                                    {statusLabel(order.status)}
                                </span>
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${paymentBadgeClass(order.payment.status)}`}>
                                    {paymentLabel(order.payment.status)} · {order.payment.method || "Online"}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-text-secondary">
                                Placed {formatDate(order.createdAt, true)} · {order.items.length} item
                                {order.items.length === 1 ? "" : "s"} · {formatINR(order.grandTotal)}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handlePrintSlip}
                                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5"
                            >
                                <Printer className="h-4 w-4" />
                                Packing slip
                            </button>
                            <button
                                onClick={handleDownloadInvoice}
                                disabled={downloadingInvoice}
                                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                {downloadingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                Invoice
                            </button>
                            <button
                                onClick={fetchOrder}
                                aria-label="Refresh order"
                                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {order.attentionNote && (
                    <section role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                        <span className="font-semibold">Needs attention: </span>
                        {order.attentionNote}
                    </section>
                )}

                {canCheckPayment && (
                    <section className="flex flex-col gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-yellow-900">
                            <div className="font-semibold">
                                Payment shows as {paymentLabel(order.payment.status).toLowerCase()}
                                {order.payment.failureReason ? ` (${order.payment.failureReason})` : ""}.
                            </div>
                            <div className="mt-0.5">
                                If the customer says they paid, check with PayU. The site also checks automatically every 15 minutes
                                {order.payment.lastCheckedAt ? ` (last checked ${formatDate(order.payment.lastCheckedAt, true)})` : ""}.
                            </div>
                        </div>
                        <button
                            onClick={checkPayment}
                            disabled={checkingPayment}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yellow-700 disabled:opacity-60"
                        >
                            {checkingPayment && <Loader2 className="h-4 w-4 animate-spin" />}
                            Check payment with PayU
                        </button>
                    </section>
                )}

                {/* Progress + next step */}
                <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                    {cancelled ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="text-sm font-semibold text-red-800">This order was cancelled</div>
                            {order.cancellationReason && (
                                <p className="mt-1 text-sm text-red-700">Reason: {order.cancellationReason}</p>
                            )}
                            {refundPending && (
                                <p className="mt-1 text-sm font-medium text-red-800">
                                    The customer paid {formatINR(order.grandTotal)} and hasn&apos;t been refunded yet.
                                </p>
                            )}
                            {order.payment.status === "REFUNDED" && (
                                <p className="mt-1 text-sm text-red-700">Refund sent to the customer.</p>
                            )}
                        </div>
                    ) : (
                        <ol className="grid grid-cols-4 gap-2">
                            {PROGRESS_STEPS.map((s, i) => {
                                const done = i <= progress;
                                const current = i === progress + 1;
                                return (
                                    <li key={s.key} className="flex flex-col items-center gap-2 text-center">
                                        <div className="flex w-full items-center">
                                            <div className={`h-0.5 flex-1 ${i === 0 ? "invisible" : done ? "bg-green-500" : "bg-black/10"}`} />
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done
                                                    ? "bg-green-500 text-white"
                                                    : current
                                                        ? "border-2 border-brand-primary bg-white text-brand-primary"
                                                        : "border border-black/15 bg-white text-text-secondary"
                                                    }`}
                                            >
                                                {done ? <Check className="h-4 w-4" /> : i + 1}
                                            </div>
                                            <div
                                                className={`h-0.5 flex-1 ${i === PROGRESS_STEPS.length - 1 ? "invisible" : i < progress ? "bg-green-500" : "bg-black/10"}`}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${done || current ? "text-text-primary" : "text-text-secondary"}`}>
                                            {s.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    <div className="mt-6 flex flex-col gap-4 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-text-secondary">
                            {step
                                ? <>Next: <span className="font-medium text-text-primary">{step.hint}</span></>
                                : refundPending
                                    ? "Refund the customer for this cancelled order."
                                : order.status === "RETURN_REQUESTED"
                                    ? `The customer has asked to return this order${order.returnInfo?.reason ? `: “${order.returnInfo.reason}”` : "."}`
                                    : order.status === "PAYMENT_PENDING"
                                        ? "Waiting for the customer's payment. Nothing to do yet."
                                        : secondaryActions.length
                                            ? "Choose an action."
                                            : "Nothing left to do for this order."}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {canCancel(order.status) && (
                                <button
                                    onClick={() => setCancelOpen(true)}
                                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                                >
                                    Cancel order
                                </button>
                            )}
                            {secondaryActions.map((a) => (
                                <button
                                    key={a.label}
                                    onClick={a.onClick}
                                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${a.className}`}
                                >
                                    {a.label}
                                </button>
                            ))}
                            {step && (
                                <button
                                    onClick={() =>
                                        setConfirm({
                                            title: `${step.label}?`,
                                            description: step.hint,
                                            confirmText: step.label,
                                            tone: step.to === "DELIVERED" ? "danger" : "default",
                                            request: () => api.patch(`/admin/orders/${order._id}/status`, { status: step.to }),
                                            successMessage: `Order marked ${step.done}.`,
                                        })
                                    }
                                    className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition ${step.to === "DELIVERED" ? "bg-green-600 hover:bg-green-700" : "bg-brand-primary hover:bg-brand-primary/90"}`}
                                >
                                    {step.label}
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
                    {/* Left */}
                    <div className="space-y-6">
                        <Card title="Items to pack" icon={<Package2 className="h-4 w-4" />}>
                            <div className="divide-y divide-black/10">
                                {order.items.map((item) => (
                                    <div key={`${item.variantId}-${item.variantSku}`} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-start gap-3">
                                            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-brand-primary/10 px-2 text-sm font-bold text-brand-primary">
                                                ×{item.quantity}
                                            </span>
                                            <div>
                                                <div className="font-medium text-text-primary">{item.productName}</div>
                                                <div className="mt-0.5 text-xs text-text-secondary">
                                                    SKU {item.variantSku} · {formatINR(item.finalPrice)} each
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-semibold text-text-primary">{formatINR(item.subtotal)}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card title="Order summary" icon={<BadgeIndianRupee className="h-4 w-4" />}>
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Items</span>
                                    <span className="font-medium text-text-primary">{formatINR(order.itemsTotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Shipping</span>
                                    <span className="font-medium text-text-primary">
                                        {order.shippingAmount ? formatINR(order.shippingAmount) : "Free"}
                                    </span>
                                </div>
                                {order.codCharge ? (
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">COD charge</span>
                                        <span className="font-medium text-text-primary">{formatINR(order.codCharge)}</span>
                                    </div>
                                ) : null}
                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-700">
                                        <span>Discount</span>
                                        <span>−{formatINR(order.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold text-text-primary">
                                    <span>Total</span>
                                    <span>{formatINR(order.grandTotal)}</span>
                                </div>
                                <div className="text-right text-xs text-text-secondary">
                                    Includes GST of {formatINR(order.gstAmount)}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right */}
                    <div className="space-y-6">
                        <Card
                            title="Ship to"
                            icon={<MapPin className="h-4 w-4" />}
                            action={
                                <button
                                    onClick={copyAddress}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-text-primary transition hover:bg-black/5"
                                >
                                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            }
                        >
                            <div className="space-y-1 text-sm">
                                <div className="font-semibold text-text-primary">{addr.name}</div>
                                {addressLines(addr).map((line) => (
                                    <div key={line} className="text-text-primary">{line}</div>
                                ))}
                                {shipPhone && (
                                    <a href={`tel:${shipPhone}`} className="mt-2 inline-flex items-center gap-1.5 font-medium text-brand-primary hover:underline">
                                        <Phone className="h-3.5 w-3.5" />
                                        {shipPhone}
                                    </a>
                                )}
                            </div>
                        </Card>

                        {order.shipping?.shipmentId && (
                            <Card title="Shipment (Shiprocket)" icon={<Truck className="h-4 w-4" />}>
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-text-secondary">Courier</dt>
                                        <dd className="font-medium text-text-primary">{order.shipping.courierName || "Not assigned yet"}</dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-text-secondary">AWB</dt>
                                        <dd className="font-mono font-medium text-text-primary">{order.shipping.awbCode || "Not assigned yet"}</dd>
                                    </div>
                                    {order.shipping.status && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-text-secondary">Shiprocket status</dt>
                                            <dd className="font-medium text-text-primary">{order.shipping.status.replaceAll("_", " ").toLowerCase()}</dd>
                                        </div>
                                    )}
                                    {order.shipping.shippedAt && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-text-secondary">Shipped</dt>
                                            <dd className="text-text-primary">{formatDate(order.shipping.shippedAt, true)}</dd>
                                        </div>
                                    )}
                                    {order.shipping.deliveredAt && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-text-secondary">Delivered</dt>
                                            <dd className="text-text-primary">{formatDate(order.shipping.deliveredAt, true)}</dd>
                                        </div>
                                    )}
                                </dl>
                                {order.shipping.awbCode ? (
                                    <a
                                        href={trackingUrl(order.shipping.awbCode)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
                                    >
                                        Track parcel ↗
                                    </a>
                                ) : (
                                    <p className="mt-3 text-xs text-text-secondary">
                                        No AWB yet. Check the order in your Shiprocket dashboard.
                                    </p>
                                )}
                            </Card>
                        )}

                        <Card title="Customer" icon={<User className="h-4 w-4" />}>
                            <div className="space-y-1 text-sm">
                                <div className="font-medium text-text-primary">{order.customerSnapshot.name}</div>
                                {order.customerSnapshot.email && (
                                    <a href={`mailto:${order.customerSnapshot.email}`} className="block text-text-secondary hover:underline">
                                        {order.customerSnapshot.email}
                                    </a>
                                )}
                                {order.customerSnapshot.phone && (
                                    <a href={`tel:${order.customerSnapshot.phone}`} className="block text-text-secondary hover:underline">
                                        {order.customerSnapshot.phone}
                                    </a>
                                )}
                            </div>
                        </Card>

                        {order.returnInfo?.status && (
                            <Card title="Return" icon={<RotateCcw className="h-4 w-4" />}>
                                <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                    {order.returnInfo.status.replaceAll("_", " ").toLowerCase()}
                                </span>
                                {order.returnInfo.reason && (
                                    <p className="mt-3 text-sm text-text-primary">Customer&apos;s reason: {order.returnInfo.reason}</p>
                                )}
                                {order.returnInfo.rejectionReason && (
                                    <p className="mt-2 text-sm text-text-secondary">Rejected because: {order.returnInfo.rejectionReason}</p>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!confirm}
                title={confirm?.title}
                description={confirm?.description}
                confirmText={confirm?.confirmText}
                cancelText="Not now"
                tone={confirm?.tone ?? "default"}
                loading={actionLoading}
                onClose={() => {
                    if (!actionLoading) setConfirm(null);
                }}
                onConfirm={runConfirm}
            />

            {cancelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-text-primary">Cancel order #{order.orderNumber}?</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                            This can&apos;t be undone.
                            {order.shipping?.shipmentId && " A Shiprocket shipment already exists for this order, so also cancel it in Shiprocket."}
                            {order.payment.status === "SUCCESS" && " A refund will be started automatically for this prepaid order."}
                        </p>
                        <label className="mb-2 mt-4 block text-sm font-medium text-text-primary">Reason</label>
                        <textarea
                            autoFocus
                            value={cancelRemarks}
                            onChange={(e) => setCancelRemarks(e.target.value)}
                            placeholder="E.g. out of stock, customer asked to cancel"
                            rows={3}
                            className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setCancelOpen(false);
                                    setCancelRemarks("");
                                }}
                                disabled={actionLoading}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                Keep order
                            </button>
                            <button
                                onClick={submitCancel}
                                disabled={!cancelRemarks.trim() || actionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Cancel order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rejectOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-text-primary">Reject return for #{order.orderNumber}?</h3>
                        <p className="mt-1 text-sm text-text-secondary">The customer won&apos;t be refunded. Tell them why.</p>
                        <label className="mb-2 mt-4 block text-sm font-medium text-text-primary">Reason</label>
                        <textarea
                            autoFocus
                            value={rejectRemarks}
                            onChange={(e) => setRejectRemarks(e.target.value)}
                            placeholder="E.g. no photos of damage, outside the return window"
                            rows={3}
                            className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setRejectOpen(false);
                                    setRejectRemarks("");
                                }}
                                disabled={actionLoading}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={!rejectRemarks.trim() || actionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Reject return
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
