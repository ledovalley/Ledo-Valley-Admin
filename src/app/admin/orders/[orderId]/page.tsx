"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
    ArrowLeft,
    BadgeIndianRupee,
    MapPin,
    Package2,
    RefreshCw,
    Truck,
    User,
    Wallet,
    RotateCcw,
    FileText,
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
        addressLine1: string;
        city: string;
        state: string;
        pincode: string;
    };
    items: OrderItem[];
    itemsTotal: number;
    gstAmount: number;
    shippingAmount: number;
    discountAmount: number;
    grandTotal: number;
    payment: {
        status: string;
        method?: string;
    };
    returnInfo?: {
        status: string;
    };
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "DELIVERED":
            return "bg-green-100 text-green-700";
        case "SHIPPED":
            return "bg-blue-100 text-blue-700";
        case "READY_TO_SHIP":
            return "bg-indigo-100 text-indigo-700";
        case "CANCELLED":
            return "bg-red-100 text-red-700";
        case "RETURN_REQUESTED":
            return "bg-orange-100 text-orange-700";
        case "RETURN_APPROVED":
            return "bg-amber-100 text-amber-700";
        case "REFUNDED":
            return "bg-purple-100 text-purple-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
};

const getPaymentColor = (status: string) => {
    switch (status) {
        case "SUCCESS":
            return "bg-green-100 text-green-700";
        case "FAILED":
            return "bg-red-100 text-red-700";
        case "REFUNDED":
            return "bg-purple-100 text-purple-700";
        default:
            return "bg-yellow-100 text-yellow-700";
    }
};

function InfoCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-text-primary">
                {icon}
                <span>{title}</span>
            </div>
            {children}
        </div>
    );
}

export default function OrderDetailsPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const router = useRouter();
    const { success, error: showError } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("Confirm action");
    const [confirmDescription, setConfirmDescription] = useState("");
    const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);

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

    const runAction = useCallback(
        async (request: Promise<unknown>, successMessage: string) => {
            try {
                setActionLoading(true);
                await request;
                success(successMessage);
                setConfirmOpen(false);
                await fetchOrder();
            } catch (err) {
                showError(getErrorMessage(err));
            } finally {
                setActionLoading(false);
            }
        },
        [fetchOrder, showError, success]
    );

    const handleDownloadInvoice = async () => {
        try {
            setDownloadingInvoice(true);
            const response = await api.get(`/admin/orders/${orderId}/invoice`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${order?.orderNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            success("Invoice downloaded successfully");
        } catch (err) {
            showError("Failed to download invoice");
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const openConfirm = useCallback(
        (
            title: string,
            description: string,
            action: () => Promise<void>
        ) => {
            setConfirmTitle(title);
            setConfirmDescription(description);
            setConfirmAction(() => action);
            setConfirmOpen(true);
        },
        []
    );

    const actions = useMemo(() => {
        if (!order) return null;

        return {
            readyToShip:
                order.status === "PAYMENT_SUCCESS" || (order.status === "PLACED" && order.payment.method === "COD")
                    ? () =>
                        openConfirm(
                            "Mark as ready to ship?",
                            "This will move the order into the fulfillment stage.",
                            async () => {
                                await runAction(
                                    api.patch(`/admin/orders/${orderId}/status`, {
                                        status: "READY_TO_SHIP",
                                    }),
                                    "Order marked as ready to ship."
                                );
                            }
                        )
                    : null,
            shipped:
                order.status === "READY_TO_SHIP"
                    ? () =>
                        openConfirm(
                            "Mark as shipped?",
                            "This indicates the package has left your facility.",
                            async () => {
                                await runAction(
                                    api.patch(`/admin/orders/${orderId}/status`, {
                                        status: "SHIPPED",
                                    }),
                                    "Order marked as shipped."
                                );
                            }
                        )
                    : null,
            delivered:
                order.status === "SHIPPED"
                    ? () =>
                        openConfirm(
                            "Mark as delivered?",
                            "Use this only after delivery is confirmed.",
                            async () => {
                                await runAction(
                                    api.patch(`/admin/orders/${orderId}/status`, {
                                        status: "DELIVERED",
                                    }),
                                    "Order marked as delivered."
                                );
                            }
                        )
                    : null,
            approveReturn:
                order.status === "RETURN_REQUESTED"
                    ? () =>
                        openConfirm(
                            "Approve return request?",
                            "This will approve the customer's return workflow.",
                            async () => {
                                await runAction(
                                    api.patch(`/admin/orders/${orderId}/approve-return`),
                                    "Return request approved."
                                );
                            }
                        )
                    : null,
            completeRefund:
                order.status === "RETURN_APPROVED"
                    ? () =>
                        openConfirm(
                            "Complete refund?",
                            "This action should only be used after refund processing is complete.",
                            async () => {
                                await runAction(
                                    api.patch(`/admin/orders/${orderId}/complete-refund`),
                                    "Refund completed successfully."
                                );
                            }
                        )
                    : null,
            markPaymentReceived:
                order.payment.method === "COD" && order.payment.status === "PENDING"
                    ? () =>
                        openConfirm(
                            "Mark payment received?",
                            "Confirm that cash has been collected for this Cash on Delivery order.",
                            async () => {
                                await runAction(
                                    api.patch(`/admin/orders/${orderId}/payment-status`, {
                                        status: "SUCCESS"
                                    }),
                                    "Payment marked as received."
                                );
                            }
                        )
                    : null,
        };
    }, [order, orderId, openConfirm, runAction]);

    if (loading) {
        return (
            <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
                <div className="h-6 w-56 animate-pulse rounded bg-black/5" />
                <div className="mt-4 h-4 w-72 animate-pulse rounded bg-black/5" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                {error}
            </div>
        );
    }

    if (!order) {
        return (
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                Order not found
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8">
                <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-text-secondary">
                                Order Details
                            </div>
                            <h1 className="text-3xl font-semibold text-text-primary md:text-4xl">
                                #{order.orderNumber}
                            </h1>
                            <p className="mt-2 text-sm text-text-secondary">
                                Placed on{" "}
                                {new Date(order.createdAt).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>

                            <button
                                onClick={handleDownloadInvoice}
                                disabled={downloadingInvoice}
                                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                <FileText className={`h-4 w-4 ${downloadingInvoice ? "animate-pulse" : ""}`} />
                                {downloadingInvoice ? "Generating..." : "Download Invoice"}
                            </button>

                            <button
                                onClick={fetchOrder}
                                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-text-secondary">
                            Order Status
                        </div>
                        <div className="mt-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                                {order.status.replaceAll("_", " ")}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-text-secondary">
                            Payment
                        </div>
                        <div className="mt-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentColor(order.payment.status)}`}>
                                {order.payment.status}
                            </span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-text-secondary">
                            Items
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-text-primary">
                            {order.items.length}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                        <div className="text-xs uppercase tracking-wide text-text-secondary">
                            Grand Total
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-text-primary">
                            ₹{order.grandTotal.toLocaleString("en-IN")}
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap gap-3">
                        {actions?.readyToShip && (
                            <button
                                onClick={actions.readyToShip}
                                className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
                            >
                                Ready To Ship
                            </button>
                        )}

                        {actions?.shipped && (
                            <button
                                onClick={actions.shipped}
                                className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
                            >
                                Mark Shipped
                            </button>
                        )}

                        {actions?.delivered && (
                            <button
                                onClick={actions.delivered}
                                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                                Mark Delivered
                            </button>
                        )}

                        {actions?.approveReturn && (
                            <button
                                onClick={actions.approveReturn}
                                className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
                            >
                                Approve Return
                            </button>
                        )}

                        {actions?.completeRefund && (
                            <button
                                onClick={actions.completeRefund}
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                            >
                                Complete Refund
                            </button>
                        )}

                        {actions?.markPaymentReceived && (
                            <button
                                onClick={actions.markPaymentReceived}
                                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                            >
                                Mark Payment Received (COD)
                            </button>
                        )}

                        {!actions?.readyToShip &&
                            !actions?.shipped &&
                            !actions?.delivered &&
                            !actions?.approveReturn &&
                            !actions?.completeRefund &&
                            !actions?.markPaymentReceived && (
                                <div className="text-sm text-text-secondary">
                                    No actions available for the current order state.
                                </div>
                            )}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                    <div className="space-y-6">
                        <InfoCard
                            title="Order Items"
                            icon={<Package2 className="h-4 w-4" />}
                        >
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div
                                        key={item.variantId}
                                        className="flex flex-col gap-4 rounded-2xl border border-black/10 p-4 md:flex-row md:items-start md:justify-between"
                                    >
                                        <div>
                                            <div className="font-semibold text-text-primary">
                                                {item.productName}
                                            </div>
                                            <div className="mt-2 text-xs text-text-secondary">
                                                SKU: {item.variantSku}
                                            </div>
                                            <div className="text-xs text-text-secondary">
                                                Quantity: {item.quantity}
                                            </div>
                                            <div className="text-xs text-text-secondary">
                                                Unit Price: ₹{item.finalPrice.toLocaleString("en-IN")}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs uppercase tracking-wide text-text-secondary">
                                                Line Total
                                            </div>
                                            <div className="mt-1 text-base font-semibold text-text-primary">
                                                ₹{item.subtotal.toLocaleString("en-IN")}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>

                        <div className="grid gap-6 md:grid-cols-2">
                            <InfoCard
                                title="Customer"
                                icon={<User className="h-4 w-4" />}
                            >
                                <div className="space-y-2 text-sm">
                                    <div className="font-medium text-text-primary">
                                        {order.customerSnapshot.name}
                                    </div>
                                    <div className="text-text-secondary">
                                        {order.customerSnapshot.email}
                                    </div>
                                    <div className="text-text-secondary">
                                        {order.customerSnapshot.phone}
                                    </div>
                                </div>
                            </InfoCard>

                            <InfoCard
                                title="Shipping Address"
                                icon={<MapPin className="h-4 w-4" />}
                            >
                                <div className="space-y-2 text-sm">
                                    <div className="font-medium text-text-primary">
                                        {order.shippingAddress.name}
                                    </div>
                                    <div className="text-text-secondary">
                                        {order.shippingAddress.addressLine1}
                                    </div>
                                    <div className="text-text-secondary">
                                        {order.shippingAddress.city}, {order.shippingAddress.state}
                                    </div>
                                    <div className="text-text-secondary">
                                        {order.shippingAddress.pincode}
                                    </div>
                                </div>
                            </InfoCard>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <InfoCard
                            title="Order Summary"
                            icon={<BadgeIndianRupee className="h-4 w-4" />}
                        >
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Items Total</span>
                                    <span className="font-medium text-text-primary">
                                        ₹{order.itemsTotal.toLocaleString("en-IN")}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-text-secondary">GST Included</span>
                                    <span className="font-medium text-text-primary">
                                        ₹{order.gstAmount.toLocaleString("en-IN")}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Shipping</span>
                                    <span className="font-medium text-text-primary">
                                        ₹{order.shippingAmount.toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {order.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                                    </div>
                                )}

                                <div className="border-t border-black/10 pt-4">
                                    <div className="flex justify-between text-base font-semibold text-text-primary">
                                        <span>Total</span>
                                        <span>₹{order.grandTotal.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            </div>
                        </InfoCard>

                        <InfoCard
                            title="Payment & Returns"
                            icon={<Wallet className="h-4 w-4" />}
                        >
                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-text-secondary">
                                        Payment Status
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentColor(order.payment.status)}`}>
                                            {order.payment.status}
                                        </span>
                                        <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-text-secondary">
                                            {order.payment.method || "PAYU"}
                                        </span>
                                    </div>
                                </div>

                                {order.returnInfo?.status && (
                                    <div>
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Return Status
                                        </div>
                                        <div className="mt-2">
                                            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                                                {order.returnInfo.status.replaceAll("_", " ")}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
                                        <Truck className="h-3.5 w-3.5" />
                                        Fulfillment Stage
                                    </div>
                                    <div className="mt-2 text-sm text-text-primary">
                                        {order.status.replaceAll("_", " ")}
                                    </div>
                                </div>
                            </div>
                        </InfoCard>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title={confirmTitle}
                description={confirmDescription}
                confirmText="Confirm"
                cancelText="Cancel"
                loading={actionLoading}
                onClose={() => {
                    if (!actionLoading) setConfirmOpen(false);
                }}
                onConfirm={() => confirmAction?.()}
            />
        </>
    );
}