"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import {
    Search,
    RefreshCw,
    PackageSearch,
    ShoppingBag,
    CircleDollarSign,
    Truck,
    ChevronLeft,
    ChevronRight,
    Download,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

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
            return "bg-gray-100 text-gray-600";
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

function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
                {icon}
                <span>{title}</span>
            </div>
            <div className="mt-3 text-2xl font-semibold text-text-primary">
                {value}
            </div>
        </div>
    );
}

function OrdersTableSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="border-b border-black/10 px-6 py-4">
                <div className="h-5 w-48 animate-pulse rounded bg-black/5" />
            </div>
            <div className="space-y-3 p-6">
                {Array.from({ length: 7 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl bg-black/5"
                    />
                ))}
            </div>
        </div>
    );
}

export default function OrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    const { success, error: toastError } = useToast();
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
    const [cancelRemarks, setCancelRemarks] = useState("");

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await api.get("/admin/orders", {
                params: {
                    search,
                    status,
                    paymentStatus,
                    startDate,
                    endDate,
                    page,
                    limit: 20,
                },
            });

            setOrders(res.data.orders);
            setPages(res.data.pages);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [search, status, paymentStatus, startDate, endDate, page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const stats = useMemo(() => {
        const delivered = orders.filter((o) => o.status === "DELIVERED").length;
        const inTransit = orders.filter(
            (o) => o.status === "SHIPPED" || o.status === "READY_TO_SHIP"
        ).length;
        const paid = orders.filter((o) => o.payment.status === "SUCCESS").length;
        const revenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);

        return { delivered, inTransit, paid, revenue };
    }, [orders]);

    const handleUpdateStatus = async (orderId: string, status: string, remarks?: string) => {
        if (status === "CANCELLED" && !remarks) {
            const order = orders.find(o => o._id === orderId);
            if (order) {
                setCancelModalOrder(order);
                setCancelRemarks("");
            }
            return;
        }

        try {
            setUpdatingOrderId(orderId);
            await api.patch(`/admin/orders/${orderId}/status`, { status, remarks });
            success("Order status updated");
            
            if (cancelModalOrder) {
                setCancelModalOrder(null);
                setCancelRemarks("");
            }
            fetchOrders();
        } catch (err) {
            toastError(getErrorMessage(err));
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
        try {
            setUpdatingOrderId(orderId);
            await api.patch(`/admin/orders/${orderId}/payment-status`, { status });
            success("Payment status updated");
            fetchOrders();
        } catch (err) {
            toastError(getErrorMessage(err));
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleDownloadInvoice = async (e: React.MouseEvent, orderId: string, orderNumber: string) => {
        e.stopPropagation();
        try {
            setUpdatingOrderId(orderId);
            const res = await api.get(`/admin/orders/${orderId}/invoice`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Invoice-${orderNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            success("Invoice downloaded");
        } catch (err) {
            toastError("Failed to download invoice");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleBulkDownload = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/orders/bulk-invoice`, {
                params: {
                    search,
                    status,
                    paymentStatus,
                    startDate,
                    endDate
                },
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Bulk-Invoices-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            success("Bulk invoices downloaded");
        } catch (err) {
            toastError("Failed to bulk download invoices (Ensure there are matching orders)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-text-secondary">
                            Order Management
                        </div>
                        <h1 className="text-3xl font-semibold text-text-primary md:text-4xl">
                            Orders
                        </h1>
                        <p className="mt-2 text-sm text-text-secondary">
                            Track, review, and manage customer orders across fulfillment stages.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleBulkDownload}
                            disabled={loading || orders.length === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-primary/90 disabled:opacity-50"
                        >
                            {loading && !updatingOrderId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            Bulk Download
                        </button>
                        <button
                            onClick={fetchOrders}
                            className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Orders On Page"
                    value={orders.length}
                    icon={<ShoppingBag className="h-4 w-4" />}
                />
                <StatCard
                    title="Delivered"
                    value={stats.delivered}
                    icon={<PackageSearch className="h-4 w-4" />}
                />
                <StatCard
                    title="In Transit"
                    value={stats.inTransit}
                    icon={<Truck className="h-4 w-4" />}
                />
                <StatCard
                    title="Visible Revenue"
                    value={`₹${stats.revenue.toLocaleString("en-IN")}`}
                    icon={<CircleDollarSign className="h-4 w-4" />}
                />
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_200px_200px]">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                            <input
                                placeholder="Order #, customer name, email..."
                                value={search}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearch(e.target.value);
                                }}
                                className="w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-text-secondary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            Order Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => {
                                setPage(1);
                                setStatus(e.target.value);
                            }}
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        >
                            <option value="">All statuses</option>
                            <option value="PLACED">Placed (COD)</option>
                            <option value="PAYMENT_SUCCESS">Payment Success</option>
                            <option value="READY_TO_SHIP">Ready To Ship</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="RETURN_REQUESTED">Return Requested</option>
                            <option value="RETURN_APPROVED">Return Approved</option>
                            <option value="REFUNDED">Refunded</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            Payment Status
                        </label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => {
                                setPage(1);
                                setPaymentStatus(e.target.value);
                            }}
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        >
                            <option value="">All payments</option>
                            <option value="SUCCESS">Success</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                            <option value="REFUNDED">Refunded</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setPage(1);
                                setStartDate(e.target.value);
                            }}
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setPage(1);
                                setEndDate(e.target.value);
                            }}
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setStatus("");
                                setPaymentStatus("");
                                setStartDate("");
                                setEndDate("");
                                setPage(1);
                            }}
                            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-black/5"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            </section>

            {loading ? (
                <OrdersTableSkeleton />
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                    {error}
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-black/10 bg-white px-6 py-14 text-center shadow-sm">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5">
                        <PackageSearch className="h-5 w-5 text-text-secondary" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-text-primary">
                        No orders found
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary">
                        Try changing your search or filter selections.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-black/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
                                Order List
                            </h2>
                            <p className="mt-1 text-sm text-text-secondary">
                                Click any row to open the full order details.
                            </p>
                        </div>

                        <div className="text-xs text-text-secondary">
                            {orders.length} order{orders.length > 1 ? "s" : ""} shown
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-225 text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-text-secondary">
                                <tr>
                                    <th className="px-6 py-4">Order</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Order Status</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        onClick={() => router.push(`/admin/orders/${order._id}`)}
                                        className="cursor-pointer border-t border-black/10 transition hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-text-primary">
                                                #{order.orderNumber}
                                            </div>
                                            <div className="mt-1 text-xs text-text-secondary">
                                                ID: {order._id.slice(-8).toUpperCase()}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="font-medium text-text-primary">
                                                {order.customerSnapshot.name}
                                            </div>
                                            <div className="mt-1 text-xs text-text-secondary">
                                                {order.customerSnapshot.email}
                                            </div>
                                            <div className="text-xs text-text-secondary">
                                                {order.customerSnapshot.phone}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-text-primary">
                                            ₹{order.grandTotal.toLocaleString("en-IN")}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                                                    disabled={updatingOrderId === order._id || ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)}
                                                    className={`appearance-none rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer pr-8 focus:ring-2 focus:ring-black/10 disabled:opacity-70 ${getStatusColor(order.status)}`}
                                                >
                                                    <option value="PLACED">PLACED</option>
                                                    <option value="PAYMENT_PENDING">PAYMENT PENDING</option>
                                                    <option value="PAYMENT_SUCCESS">PAYMENT SUCCESS</option>
                                                    <option value="READY_TO_SHIP">READY TO SHIP</option>
                                                    <option value="SHIPPED">SHIPPED</option>
                                                    <option value="DELIVERED">DELIVERED</option>
                                                    <option value="CANCELLED">CANCELLED</option>
                                                    <option value="RETURN_REQUESTED">RETURN REQUESTED</option>
                                                    <option value="RETURN_APPROVED">RETURN APPROVED</option>
                                                    <option value="REFUNDED">REFUNDED</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                                    <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative inline-block">
                                                    <select
                                                        value={order.payment.status}
                                                        onChange={(e) => handleUpdatePaymentStatus(order._id, e.target.value)}
                                                        disabled={updatingOrderId === order._id || order.payment.method !== "COD" || order.payment.status === "SUCCESS"}
                                                        className={`appearance-none rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer pr-8 focus:ring-2 focus:ring-black/10 disabled:opacity-70 ${getPaymentColor(order.payment.status)}`}
                                                    >
                                                        <option value="PENDING">PENDING</option>
                                                        <option value="SUCCESS">SUCCESS</option>
                                                        <option value="FAILED">FAILED</option>
                                                        <option value="REFUNDED">REFUNDED</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                                                        <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                    </div>
                                                </div>
                                                <span className="inline-flex rounded text-xs font-semibold text-text-secondary bg-gray-100 px-2 py-0.5">
                                                    {order.payment.method || "PAYU"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-text-secondary">
                                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => handleDownloadInvoice(e, order._id, order.orderNumber)}
                                                disabled={updatingOrderId === order._id}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-text-secondary transition hover:bg-black/5 hover:text-text-primary disabled:opacity-50"
                                                title="Download Invoice"
                                            >
                                                {updatingOrderId === order._id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Cancel Order Modal */}
            {cancelModalOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-text-primary">Cancel Order #{cancelModalOrder.orderNumber}</h3>
                        <p className="mt-1 text-sm text-text-secondary">
                            Please provide a reason for cancelling this order.
                            {cancelModalOrder.payment.status === "SUCCESS" && " A refund will be automatically initiated for this prepaid order."}
                        </p>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-text-primary">Cancellation Remarks</label>
                            <textarea
                                value={cancelRemarks}
                                onChange={(e) => setCancelRemarks(e.target.value)}
                                placeholder="E.g., Out of stock, customer requested, etc."
                                className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                rows={3}
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setCancelModalOrder(null);
                                    setCancelRemarks("");
                                }}
                                disabled={updatingOrderId === cancelModalOrder._id}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(cancelModalOrder._id, "CANCELLED", cancelRemarks)}
                                disabled={!cancelRemarks.trim() || updatingOrderId === cancelModalOrder._id}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {updatingOrderId === cancelModalOrder._id && <Loader2 className="h-4 w-4 animate-spin" />}
                                Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </button>

                <div className="text-sm text-text-secondary">
                    Page <span className="font-medium text-text-primary">{page}</span> of{" "}
                    <span className="font-medium text-text-primary">{pages}</span>
                </div>

                <button
                    disabled={page === pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}