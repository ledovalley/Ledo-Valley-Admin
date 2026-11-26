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
import { downloadInvoice, downloadCreditNote } from "@/lib/invoice";
import { openShiprocketPdf } from "@/lib/shiprocketPrint";
import OrderNotes, { type OrderNote } from "@/components/admin/orders/OrderNotes";
import OrderTimeline, { type HistoryEvent } from "@/components/admin/orders/OrderTimeline";
import ContactCustomer from "@/components/admin/orders/ContactCustomer";
import MissedPickup from "@/components/admin/orders/MissedPickup";
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
    Pencil,
    MessageCircle,
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
    tax?: {
        goodsTaxable?: number;
        goodsGst?: number;
        shippingGst?: number;
        totalTaxable?: number;
        totalGst?: number;
        intraState?: boolean;
    };
    invoice?: { number?: string; date?: string };
    creditNotes?: { number: string; date: string; amount: number; gst: number; reason?: string }[];
    shippingAmount: number;
    codCharge?: number;
    discountAmount: number;
    grandTotal: number;
    payment: {
        status: string;
        method?: string;
        failureReason?: string;
        lastCheckedAt?: string;
        paidAt?: string;
    };
    attentionNote?: string;
    notes?: OrderNote[];
    history?: HistoryEvent[];
    returnInfo?: {
        requestedAt?: string;
        approvedAt?: string;
        rejectedAt?: string;
        status: string;
        reason?: string;
        rejectionReason?: string;
        refundAmount?: number;
        refundedAt?: string;
    };
    shipping?: {
        shiprocketOrderId?: string;
        shipmentId?: string;
        awbCode?: string;
        courierName?: string;
        status?: string;
        pickupScheduledAt?: string;
        shippedAt?: string;
        deliveredAt?: string;
        manual?: boolean;
        trackingUrl?: string;
        labelPrintedAt?: string;
        pickupDate?: string;
    };
    cancellationReason?: string;
    rto?: {
        startedAt?: string;
        backAt?: string;
        closedAt?: string;
        restocked?: boolean;
        refundAmount?: number;
    };
}

interface ConfirmState {
    title: string;
    description: string;
    confirmText: string;
    tone: "danger" | "default";
    request: () => Promise<unknown>;
    successMessage: string;
}

const OTHER_COURIER = "Other courier";
const OWN_DELIVERY = "Delivered by us (by hand)";
const COURIER_CHOICES = ["India Post – Speed Post", "India Post – Registered Parcel", OTHER_COURIER, OWN_DELIVERY];
// Once the Shiprocket courier has collected the parcel it can't be sent another way.
const ORDER_PICKED_UP = ["PICKED_UP", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

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
    const [qualityOpen, setQualityOpen] = useState(false);
    const [qualityReason, setQualityReason] = useState("");
    const [qualityAmount, setQualityAmount] = useState("");
    const [shipOpen, setShipOpen] = useState(false);
    const [chooseOpen, setChooseOpen] = useState(false);
    const [rtoOpen, setRtoOpen] = useState(false);
    const [editShipOpen, setEditShipOpen] = useState(false);
    const [editCourier, setEditCourier] = useState("");
    const [editNumber, setEditNumber] = useState("");
    const [editLink, setEditLink] = useState("");
    const [editNotify, setEditNotify] = useState(true);
    const [rtoAmount, setRtoAmount] = useState("");
    const [rtoRestock, setRtoRestock] = useState(true);
    const [rtoNote, setRtoNote] = useState("");
    const [booking, setBooking] = useState(false);
    const [shipCourier, setShipCourier] = useState(COURIER_CHOICES[0]);
    const [shipOtherCourier, setShipOtherCourier] = useState("");
    const [shipNumber, setShipNumber] = useState("");
    const [shipLink, setShipLink] = useState("");
    const [printing, setPrinting] = useState<"labels" | "manifest" | null>(null);
    const [clearingNote, setClearingNote] = useState(false);

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

    const closeQuality = () => {
        setQualityOpen(false);
        setQualityReason("");
        setQualityAmount("");
    };

    const submitQualityRefund = async () => {
        if (!order || !qualityReason.trim()) return;
        try {
            setActionLoading(true);
            const res = await api.patch(`/admin/orders/${order._id}/quality-refund`, {
                reason: qualityReason.trim(),
                amount: qualityAmount.trim() === "" ? undefined : Number(qualityAmount),
            });
            success(`${res.data?.message || "Refunded"}. The customer has been emailed.`);
            closeQuality();
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setActionLoading(false);
        }
    };

    const closeShip = () => {
        setShipOpen(false);
        setShipCourier(COURIER_CHOICES[0]);
        setShipOtherCourier("");
        setShipNumber("");
        setShipLink("");
    };

    const shipCourierName = shipCourier === OTHER_COURIER ? shipOtherCourier.trim() : shipCourier;

    const ownDelivery = shipCourier === OWN_DELIVERY;

    const openEditShipping = () => {
        if (!order) return;
        setEditCourier(order.shipping?.courierName || "");
        setEditNumber(order.shipping?.awbCode || "");
        setEditLink(order.shipping?.trackingUrl || "");
        setEditNotify(order.status === "SHIPPED");
        setEditShipOpen(true);
    };

    const saveEditShipping = async () => {
        if (!order || !editCourier.trim()) return;
        try {
            setActionLoading(true);
            const res = await api.patch(`/admin/orders/${order._id}/shipping-details`, {
                courierName: editCourier.trim(),
                trackingNumber: editNumber.trim(),
                trackingUrl: editLink.trim() || undefined,
                notifyCustomer: editNotify,
            });
            success(res.data?.message || "Saved");
            setEditShipOpen(false);
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setActionLoading(false);
        }
    };

    const openReturned = () => {
        if (!order) return;
        setRtoAmount(String(order.grandTotal));
        setRtoRestock(true);
        setRtoNote("");
        setRtoOpen(true);
    };

    const submitReturned = async () => {
        if (!order) return;
        const prepaid = order.payment.method !== "COD" && order.payment.status === "SUCCESS";
        try {
            setActionLoading(true);
            const res = await api.patch(`/admin/orders/${order._id}/returned-to-us`, {
                refundAmount: prepaid ? Number(rtoAmount) : 0,
                restock: rtoRestock,
                note: rtoNote.trim() || undefined,
            });
            success(res.data?.message || "Marked as returned");
            setRtoOpen(false);
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setActionLoading(false);
        }
    };

    const bookShiprocketPickup = async () => {
        if (!order) return;
        try {
            setBooking(true);
            await api.patch(`/admin/orders/${order._id}/status`, { status: "READY_TO_SHIP" });
            success("Shiprocket pickup booked.");
            setChooseOpen(false);
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
            setChooseOpen(false);
            await fetchOrder();
        } finally {
            setBooking(false);
        }
    };

    const submitShip = async () => {
        if (!order || !shipCourierName) return;
        try {
            setActionLoading(true);
            await api.patch(`/admin/orders/${order._id}/ship-manually`, {
                courierName: ownDelivery ? "Delivered by Ledo Valley" : shipCourierName,
                trackingNumber: ownDelivery ? "" : shipNumber.trim(),
                trackingUrl: ownDelivery ? undefined : shipLink.trim() || undefined,
            });
            success(`Order #${order.orderNumber} marked as shipped by ${shipCourierName}. The customer has been emailed.`);
            closeShip();
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setActionLoading(false);
        }
    };

    const printShiprocket = async (kind: "labels" | "manifest") => {
        if (!order) return;
        try {
            setPrinting(kind);
            await openShiprocketPdf(kind, [order._id]);
            if (kind === "labels") await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setPrinting(null);
        }
    };

    const markAttentionHandled = async () => {
        if (!order) return;
        const comment = window.prompt("Mark this as handled? Add a short note of what you did (optional):", "");
        if (comment === null) return;
        try {
            setClearingNote(true);
            await api.patch(`/admin/orders/${order._id}/attention-handled`, { comment });
            success("Marked as handled");
            await fetchOrder();
        } catch (err) {
            showError(getErrorMessage(err));
        } finally {
            setClearingNote(false);
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

    // The courier is bringing the parcel back (customer didn't accept it).
    const rtoUnderway =
        ["SHIPPED", "READY_TO_SHIP"].includes(order.status) &&
        (!!order.rto?.startedAt || (order.shipping?.status || "").startsWith("RTO"));
    const step = rtoUnderway ? null : nextStep(order);
    const progress = progressIndex(order);
    const cancelled = order.status === "CANCELLED";
    const addr = order.shippingAddress;
    const shipPhone = addr.phone || order.customerSnapshot.phone;
    const isCodPending = order.payment.method === "COD" && order.payment.status === "PENDING";
    const refundPending = cancelled && order.payment.status === "REFUND_PENDING";
    const canCheckPayment =
        order.payment.method !== "COD" && ["PENDING", "FAILED"].includes(order.payment.status);

    const secondaryActions: { label: string; className: string; onClick: () => void }[] = [];
    if (["DELIVERED", "RETURN_REJECTED"].includes(order.status) && order.payment.status === "SUCCESS") {
        secondaryActions.push({
            label: "Quality issue refund",
            className: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
            onClick: () => setQualityOpen(true),
        });
    }

    const canShipManually =
        (["PAYMENT_SUCCESS", "READY_TO_SHIP"].includes(order.status) ||
            (order.status === "PLACED" && order.payment.method === "COD")) &&
        (order.payment.status === "SUCCESS" || order.payment.method === "COD") &&
        !ORDER_PICKED_UP.includes(order.shipping?.status || "");
    // Before pickup is booked, "Ship this order" asks how; after, this lets you switch.
    const choosesHow = step?.to === "READY_TO_SHIP";
    const noShiprocketCourier = /No Shiprocket courier delivers/i.test(order.attentionNote || "");
    if (canShipManually && !choosesHow) {
        secondaryActions.push({
            label: "Ship another way instead",
            className: "border border-black/10 bg-white text-text-primary hover:bg-black/5",
            onClick: () => setShipOpen(true),
        });
    }
    if (order.status === "SHIPPED" || rtoUnderway) {
        secondaryActions.push({
            label: "Returned to us",
            className: rtoUnderway
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "border border-black/10 bg-white text-text-primary hover:bg-black/5",
            onClick: openReturned,
        });
    }
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
                    <section role="alert" className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <span className="font-semibold">Needs attention: </span>
                            {order.attentionNote}
                        </div>
                        <button
                            onClick={markAttentionHandled}
                            disabled={clearingNote}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
                        >
                            {clearingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Mark handled
                        </button>
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
                            {rtoUnderway
                                ? <>The customer didn&apos;t accept this parcel and it&apos;s coming back{order.rto?.backAt ? " (it has reached you)" : ""}. When you have it, click <span className="font-medium text-text-primary">Returned to us</span>.</>
                                : choosesHow
                                ? <>Next: <span className="font-medium text-text-primary">pack it, then choose how to send it: a Shiprocket pickup, or another way (India Post, another courier, by hand).</span></>
                                : step
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
                            {step && choosesHow && (
                                <button
                                    onClick={() => setChooseOpen(true)}
                                    className="rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
                                >
                                    Ship this order
                                </button>
                            )}
                            {step && !choosesHow && (
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
                                    {order.tax?.totalGst !== undefined &&
                                        (order.tax.intraState
                                            ? ` (CGST ${formatINR(order.tax.totalGst / 2)} + SGST ${formatINR(order.tax.totalGst / 2)})`
                                            : " (IGST)")}
                                </div>
                            </div>
                        </Card>

                        {(order.invoice?.number || (order.creditNotes?.length ?? 0) > 0) && (
                            <Card title="GST invoice" icon={<BadgeIndianRupee className="h-4 w-4" />}>
                                <dl className="space-y-2 text-sm">
                                    {order.invoice?.number && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-text-secondary">Invoice</dt>
                                            <dd className="font-mono font-medium text-text-primary">
                                                {order.invoice.number}
                                                {order.invoice.date && (
                                                    <span className="ml-2 font-sans text-xs font-normal text-text-secondary">
                                                        {new Date(order.invoice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                                {(order.creditNotes?.length ?? 0) > 0 && (
                                    <div className="mt-4 border-t border-black/10 pt-3">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Credit notes</p>
                                        <ul className="space-y-2">
                                            {order.creditNotes!.map((note, i) => (
                                                <li key={note.number} className="flex items-center justify-between gap-3 text-sm">
                                                    <span>
                                                        <span className="font-mono">{note.number}</span>
                                                        <span className="ml-2 text-text-secondary">{formatINR(note.amount)}</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                await downloadCreditNote(order._id, i, note.number);
                                                            } catch (err) {
                                                                showError(getErrorMessage(err));
                                                            }
                                                        }}
                                                        className="text-sm font-medium text-brand-primary hover:underline"
                                                    >
                                                        Download
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </Card>
                        )}
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

                        {(order.shipping?.shipmentId || order.shipping?.manual) && (
                            <Card
                                title={order.shipping.manual ? `Shipment (${order.shipping.courierName || "own courier"})` : "Shipment (Shiprocket)"}
                                icon={<Truck className="h-4 w-4" />}
                                action={
                                    order.shipping.manual && ["SHIPPED", "DELIVERED"].includes(order.status) ? (
                                        <button
                                            onClick={openEditShipping}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-text-primary transition hover:bg-black/5"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </button>
                                    ) : undefined
                                }
                            >
                                <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-text-secondary">Courier</dt>
                                        <dd className="font-medium text-text-primary">{order.shipping.courierName || "Not assigned yet"}</dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-text-secondary">{order.shipping.manual ? "Tracking no." : "AWB"}</dt>
                                        <dd className="font-mono font-medium text-text-primary">{order.shipping.awbCode || (order.shipping.manual ? "None" : "Not assigned yet")}</dd>
                                    </div>
                                    {order.shipping.status && !order.shipping.manual && (
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
                                {order.shipping.manual ? (
                                    order.shipping.trackingUrl ? (
                                        <a
                                            href={order.shipping.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline"
                                        >
                                            Open {order.shipping.courierName || "courier"} tracking ↗
                                        </a>
                                    ) : null
                                ) : order.shipping.awbCode ? (
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
                                {!order.shipping.manual &&
                                    order.shipping.awbCode &&
                                    order.shipping.status !== "CANCELLED" &&
                                    order.status !== "CANCELLED" && (
                                        <div className="mt-4 border-t border-black/5 pt-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => printShiprocket("labels")}
                                                    disabled={!!printing}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-bg-dark px-3 py-2 text-xs font-semibold text-white transition hover:bg-bg-dark/90 disabled:opacity-60"
                                                >
                                                    {printing === "labels" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                                                    Print shipping label
                                                </button>
                                                <button
                                                    onClick={() => printShiprocket("manifest")}
                                                    disabled={!!printing}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-black/5 disabled:opacity-60"
                                                >
                                                    {printing === "manifest" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                                                    Manifest
                                                </button>
                                            </div>
                                            <p className="mt-2 text-xs text-text-secondary">
                                                {order.shipping.labelPrintedAt
                                                    ? `Label last printed ${formatDate(order.shipping.labelPrintedAt, true)}.`
                                                    : "Label not printed yet."}{" "}
                                                Stick the label on the parcel; the courier signs the manifest at pickup.
                                            </p>
                                        </div>
                                    )}
                                {order.status === "READY_TO_SHIP" &&
                                    !order.shipping.manual &&
                                    order.shipping.status !== "CANCELLED" &&
                                    !(order.shipping.status || "").startsWith("RTO") && (
                                        <>
                                            {order.shipping.pickupDate && (
                                                <p className="mt-3 text-xs text-text-secondary">Pickup requested for {formatDate(order.shipping.pickupDate)}.</p>
                                            )}
                                            <MissedPickup orderId={order._id} orderNumber={order.orderNumber} onDone={fetchOrder} />
                                        </>
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

                        <Card title="Contact customer" icon={<MessageCircle className="h-4 w-4" />}>
                            <ContactCustomer
                                key={order.status}
                                phone={shipPhone}
                                name={addr.name || order.customerSnapshot.name}
                                orderNumber={order.orderNumber}
                                status={order.status}
                                courierName={order.shipping?.courierName}
                                trackingNumber={order.shipping?.awbCode}
                                trackingUrl={order.shipping?.trackingUrl || undefined}
                            />
                        </Card>

                        {order.returnInfo?.status && order.returnInfo.status !== "NONE" && (
                            <Card title="Return" icon={<RotateCcw className="h-4 w-4" />}>
                                <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                    {order.returnInfo.status.replaceAll("_", " ").toLowerCase()}
                                </span>
                                {order.returnInfo.reason && (
                                    <p className="mt-3 text-sm text-text-primary">
                                        {order.returnInfo.reason.startsWith("Quality issue:") ? order.returnInfo.reason : <>Customer&apos;s reason: {order.returnInfo.reason}</>}
                                    </p>
                                )}
                                {order.returnInfo.refundAmount !== undefined && order.returnInfo.status === "COMPLETED" && (
                                    <p className="mt-2 text-sm text-text-secondary">
                                        Refunded {formatINR(order.returnInfo.refundAmount)}
                                        {order.returnInfo.refundAmount < order.grandTotal && ` of ${formatINR(order.grandTotal)}`}
                                    </p>
                                )}
                                {order.returnInfo.rejectionReason && (
                                    <p className="mt-2 text-sm text-text-secondary">Rejected because: {order.returnInfo.rejectionReason}</p>
                                )}
                            </Card>
                        )}

                        {order.status === "RETURNED" && order.rto && (
                            <Card title="Returned to us" icon={<RotateCcw className="h-4 w-4" />}>
                                <dl className="space-y-2 text-sm">
                                    {order.rto.backAt && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-text-secondary">Back with us</dt>
                                            <dd className="text-text-primary">{formatDate(order.rto.backAt, true)}</dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-text-secondary">Stock</dt>
                                        <dd className="text-text-primary">{order.rto.restocked ? "Put back" : "Not put back"}</dd>
                                    </div>
                                    {order.payment.method !== "COD" && (
                                        <div className="flex justify-between gap-3">
                                            <dt className="text-text-secondary">Refund</dt>
                                            <dd className="text-text-primary">
                                                {order.rto.refundAmount ? `${formatINR(order.rto.refundAmount)} of ${formatINR(order.grandTotal)}` : "None"}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </Card>
                        )}

                        <OrderNotes
                            orderId={order._id}
                            notes={order.notes || []}
                            onChange={(notes) => setOrder((prev) => (prev ? { ...prev, notes } : prev))}
                        />

                        <OrderTimeline order={order} />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
                    <div role="dialog" aria-modal="true" className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
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

            {qualityOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="quality-title" className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
                        <h3 id="quality-title" className="text-lg font-semibold text-text-primary">Quality issue refund · #{order.orderNumber}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                            Use this after you&apos;ve checked the customer&apos;s email and photos. The money goes back through PayU straight away
                            and the customer is emailed. Stock is not added back.
                        </p>

                        <label htmlFor="quality-reason" className="mb-2 mt-4 block text-sm font-medium text-text-primary">What was wrong</label>
                        <textarea
                            id="quality-reason"
                            autoFocus
                            rows={3}
                            value={qualityReason}
                            onChange={(e) => setQualityReason(e.target.value)}
                            placeholder="e.g. Pouch torn, tea damp — photos received by email on 23 Nov"
                            className="w-full resize-none rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />

                        <label htmlFor="quality-amount" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
                            Refund amount <span className="font-normal text-text-secondary">(order total {formatINR(order.grandTotal)})</span>
                        </label>
                        <input
                            id="quality-amount"
                            type="number"
                            inputMode="decimal"
                            min={1}
                            max={order.grandTotal}
                            step="0.01"
                            value={qualityAmount}
                            onChange={(e) => setQualityAmount(e.target.value)}
                            placeholder={`Leave empty for the full ${formatINR(order.grandTotal)}`}
                            className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        <p className="mt-1.5 text-xs text-text-secondary">For part of an order (e.g. one damaged pack), enter just that amount.</p>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={closeQuality}
                                disabled={actionLoading}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={submitQualityRefund}
                                disabled={
                                    !qualityReason.trim() ||
                                    actionLoading ||
                                    (qualityAmount.trim() !== "" &&
                                        (!(Number(qualityAmount) > 0) || Number(qualityAmount) > order.grandTotal))
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Refund {qualityAmount.trim() !== "" && Number(qualityAmount) > 0 ? formatINR(Number(qualityAmount)) : formatINR(order.grandTotal)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editShipOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="edit-ship-title" className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
                        <h3 id="edit-ship-title" className="text-lg font-semibold text-text-primary">Correct shipping details</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                            Fix a wrong courier name or tracking number for #{order.orderNumber}. The old details are kept in the order history.
                        </p>

                        <label htmlFor="edit-courier" className="mb-2 mt-4 block text-sm font-medium text-text-primary">Courier</label>
                        <input
                            id="edit-courier"
                            list="edit-courier-choices"
                            value={editCourier}
                            onChange={(e) => setEditCourier(e.target.value)}
                            maxLength={60}
                            className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        <datalist id="edit-courier-choices">
                            {COURIER_CHOICES.filter((c) => c !== OTHER_COURIER && c !== OWN_DELIVERY).map((c) => (
                                <option key={c} value={c} />
                            ))}
                            <option value="Delivered by Ledo Valley" />
                        </datalist>

                        <label htmlFor="edit-number" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
                            Tracking number <span className="font-normal text-text-secondary">(optional)</span>
                        </label>
                        <input
                            id="edit-number"
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value.toUpperCase())}
                            maxLength={40}
                            className="w-full rounded-xl border border-black/10 p-3 font-mono text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />

                        <label htmlFor="edit-link" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
                            Tracking link <span className="font-normal text-text-secondary">(optional)</span>
                        </label>
                        <input
                            id="edit-link"
                            type="url"
                            value={editLink}
                            onChange={(e) => setEditLink(e.target.value)}
                            placeholder="https://"
                            className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        {editLink.trim() && !/^https?:\/\//i.test(editLink.trim()) && (
                            <p className="mt-1 text-xs text-red-600">The link must start with https://</p>
                        )}

                        {order.status === "SHIPPED" && (
                            <label className="mt-4 flex items-start gap-2 text-sm text-text-primary">
                                <input
                                    type="checkbox"
                                    checked={editNotify}
                                    onChange={(e) => setEditNotify(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-black/20"
                                />
                                <span>
                                    Email the customer the corrected details
                                    <span className="block text-xs text-text-secondary">Subject: “Updated delivery details”.</span>
                                </span>
                            </label>
                        )}

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setEditShipOpen(false)}
                                disabled={actionLoading}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={saveEditShipping}
                                disabled={!editCourier.trim() || (!!editLink.trim() && !/^https?:\/\//i.test(editLink.trim())) || actionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-bg-dark/90 disabled:opacity-50"
                            >
                                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rtoOpen && (() => {
                const prepaid = order.payment.method !== "COD" && order.payment.status === "SUCCESS";
                const amount = Number(rtoAmount);
                const amountOk = !prepaid || (rtoAmount.trim() !== "" && Number.isFinite(amount) && amount >= 0 && amount <= order.grandTotal);
                const chips = [
                    { label: "Full", value: order.grandTotal },
                    ...(order.shippingAmount ? [{ label: "Minus shipping", value: order.grandTotal - order.shippingAmount }] : []),
                    { label: "No refund", value: 0 },
                ];
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
                        <div role="dialog" aria-modal="true" aria-labelledby="rto-title" className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
                            <h3 id="rto-title" className="text-lg font-semibold text-text-primary">#{order.orderNumber} returned to us</h3>
                            <p className="mt-1 text-sm text-text-secondary">
                                Use this when the parcel has come back because the customer didn&apos;t accept it. The order is closed as Returned.
                            </p>

                            {prepaid ? (
                                <>
                                    <label htmlFor="rto-amount" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
                                        Refund to the customer (₹)
                                    </label>
                                    <input
                                        id="rto-amount"
                                        type="number"
                                        min={0}
                                        max={order.grandTotal}
                                        step="0.01"
                                        inputMode="decimal"
                                        value={rtoAmount}
                                        onChange={(e) => setRtoAmount(e.target.value)}
                                        className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                    />
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {chips.map((c) => (
                                            <button
                                                key={c.label}
                                                type="button"
                                                onClick={() => setRtoAmount(String(Math.round(c.value * 100) / 100))}
                                                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                                    Number(rtoAmount) === Math.round(c.value * 100) / 100
                                                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                                                        : "border-black/10 text-text-secondary hover:bg-black/5"
                                                }`}
                                            >
                                                {c.label} · {formatINR(c.value)}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1.5 text-xs text-text-secondary">
                                        Any amount from ₹0 to {formatINR(order.grandTotal)}. It goes back through PayU, with a credit note and an email to the customer.
                                    </p>
                                    {!amountOk && <p className="mt-1 text-xs text-red-600">Enter an amount between ₹0 and {formatINR(order.grandTotal)}.</p>}
                                </>
                            ) : (
                                <p className="mt-4 rounded-lg bg-black/5 px-3 py-2 text-xs text-text-secondary">This order wasn&apos;t paid online, so there&apos;s nothing to refund.</p>
                            )}

                            {order.payment.method !== "COD" && (
                                <label className="mt-4 flex items-start gap-2 text-sm text-text-primary">
                                    <input
                                        type="checkbox"
                                        checked={rtoRestock}
                                        onChange={(e) => setRtoRestock(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-black/20"
                                    />
                                    <span>
                                        Put the tea back in stock
                                        <span className="block text-xs text-text-secondary">Untick if the packs are damaged and can&apos;t be sold.</span>
                                    </span>
                                </label>
                            )}

                            <label htmlFor="rto-note" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
                                Note <span className="font-normal text-text-secondary">(optional, staff only)</span>
                            </label>
                            <input
                                id="rto-note"
                                value={rtoNote}
                                onChange={(e) => setRtoNote(e.target.value)}
                                maxLength={300}
                                placeholder="e.g. Customer refused, said they ordered by mistake"
                                className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            />

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    onClick={() => setRtoOpen(false)}
                                    disabled={actionLoading}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={submitReturned}
                                    disabled={!amountOk || actionLoading}
                                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                                >
                                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {prepaid && amount > 0 ? `Mark returned & refund ${formatINR(amount)}` : "Mark returned"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {chooseOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="choose-title" className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
                        <h3 id="choose-title" className="text-lg font-semibold text-text-primary">How are you sending #{order.orderNumber}?</h3>
                        <p className="mt-1 text-sm text-text-secondary">Have the parcel packed first.</p>

                        <div className="mt-5 grid gap-3">
                            <button
                                onClick={bookShiprocketPickup}
                                disabled={booking}
                                className="flex items-start gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:border-brand-primary hover:bg-brand-primary/5 disabled:opacity-60"
                            >
                                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                                <span>
                                    <span className="flex items-center gap-2 font-semibold text-text-primary">
                                        Shiprocket pickup
                                        {booking && <Loader2 className="h-4 w-4 animate-spin" />}
                                    </span>
                                    <span className="mt-0.5 block text-sm text-text-secondary">
                                        Creates the shipment, assigns a courier and books the pickup. Tracking updates automatically.
                                    </span>
                                    {noShiprocketCourier && (
                                        <span className="mt-1.5 block text-xs font-medium text-amber-700">
                                            No Shiprocket courier was found for this pincode, so this will probably fail.
                                        </span>
                                    )}
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    setChooseOpen(false);
                                    setShipOpen(true);
                                }}
                                disabled={booking}
                                className="flex items-start gap-3 rounded-2xl border border-black/10 p-4 text-left transition hover:border-brand-primary hover:bg-brand-primary/5 disabled:opacity-60"
                            >
                                <Package2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                                <span>
                                    <span className="block font-semibold text-text-primary">Another way</span>
                                    <span className="mt-0.5 block text-sm text-text-secondary">
                                        India Post, another courier, or delivered by hand. Tracking number optional; you mark it delivered.
                                    </span>
                                </span>
                            </button>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={() => setChooseOpen(false)}
                                disabled={booking}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {shipOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
                    <div role="dialog" aria-modal="true" aria-labelledby="ship-title" className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
                        <h3 id="ship-title" className="text-lg font-semibold text-text-primary">Ship #{order.orderNumber} another way</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                            Send the parcel first, then record it here. The order is marked Shipped and the customer is emailed
                            (with the tracking number, if you have one). Mark it Delivered yourself once it arrives.
                            {order.shipping?.shiprocketOrderId && order.shipping?.status !== "CANCELLED" && " The Shiprocket shipment created for this order will be cancelled."}
                        </p>

                        <label htmlFor="ship-courier" className="mb-2 mt-4 block text-sm font-medium text-text-primary">Sent by</label>
                        <select
                            id="ship-courier"
                            value={shipCourier}
                            onChange={(e) => setShipCourier(e.target.value)}
                            className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        >
                            {COURIER_CHOICES.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                        {shipCourier === OTHER_COURIER && (
                            <input
                                aria-label="Courier name"
                                value={shipOtherCourier}
                                onChange={(e) => setShipOtherCourier(e.target.value)}
                                placeholder="Courier name, e.g. DTDC"
                                className="mt-2 w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            />
                        )}

                        {!ownDelivery && (<>
                        <label htmlFor="ship-number" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
                            Tracking number <span className="font-normal text-text-secondary">(optional)</span>
                        </label>
                        <input
                            id="ship-number"
                            autoFocus
                            value={shipNumber}
                            onChange={(e) => setShipNumber(e.target.value.toUpperCase())}
                            placeholder={shipCourier.startsWith("India Post") ? "e.g. EM123456789IN" : "Tracking / consignment number"}
                            className="w-full rounded-xl border border-black/10 p-3 font-mono text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        {shipCourier.startsWith("India Post") &&
                            shipNumber.trim() !== "" &&
                            !/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(shipNumber.trim()) && (
                                <p className="mt-1.5 text-xs text-amber-700">
                                    India Post numbers usually look like EM123456789IN (2 letters, 9 digits, 2 letters). Please double-check.
                                </p>
                            )}

                        <label htmlFor="ship-link" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
                            Tracking link <span className="font-normal text-text-secondary">(optional)</span>
                        </label>
                        <input
                            id="ship-link"
                            value={shipLink}
                            onChange={(e) => setShipLink(e.target.value)}
                            placeholder={shipCourier.startsWith("India Post") ? "Leave empty to use indiapost.gov.in" : "https://… (leave empty if you don't have one)"}
                            className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                        <p className="mt-1.5 text-xs text-text-secondary">
                            {shipCourier.startsWith("India Post")
                                ? "India Post has no link per parcel; the customer is sent to indiapost.gov.in to enter the number."
                                : "Not needed. Without a link, the customer gets the courier name and tracking number, and is told to check them on the courier's website."}
                        </p>
                        {!shipNumber.trim() && (
                            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                No tracking number: the customer is told it&apos;s been sent by {shipCourierName || "the courier"}, without a number to track.
                            </p>
                        )}
                        </>)}
                        {ownDelivery && (
                            <p className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-xs text-text-secondary">
                                The customer is told their order is on its way with us. No tracking number is needed.
                            </p>
                        )}

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={closeShip}
                                disabled={actionLoading}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={submitShip}
                                disabled={!shipCourierName || actionLoading}
                                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
                            >
                                {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Mark shipped &amp; email customer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rejectOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
                    <div role="dialog" aria-modal="true" className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
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
