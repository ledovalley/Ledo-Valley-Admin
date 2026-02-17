"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";

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

export default function OrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);

            const res = await api.get("/admin/orders", {
                params: {
                    search,
                    status,
                    paymentStatus,
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
    }, [search, status, paymentStatus, page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
        <div className="space-y-8">

            {/* ================= HEADER ================= */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Orders
                    </h1>
                    <p className="text-sm text-text-secondary">
                        Track, manage and update customer orders
                    </p>
                </div>

                <div className="text-sm text-text-secondary">
                    {orders.length} orders shown
                </div>
            </div>

            {/* ================= FILTERS ================= */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end">

                <div>
                    <label className="text-xs text-text-secondary block mb-1">
                        Search
                    </label>
                    <input
                        placeholder="Order #, name, email..."
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                        className="px-4 py-2 border rounded-lg w-72 focus:ring-2 focus:ring-(--color-brand-primary)"
                    />
                </div>

                <div>
                    <label className="text-xs text-text-secondary block mb-1">
                        Order Status
                    </label>
                    <select
                        value={status}
                        onChange={(e) => {
                            setPage(1);
                            setStatus(e.target.value);
                        }}
                        className="px-4 py-2 border rounded-lg bg-white"
                    >
                        <option value="">All</option>
                        <option value="PAYMENT_SUCCESS">Payment Success</option>
                        <option value="READY_TO_SHIP">Ready To Ship</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="RETURN_REQUESTED">Return Requested</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-text-secondary block mb-1">
                        Payment Status
                    </label>
                    <select
                        value={paymentStatus}
                        onChange={(e) => {
                            setPage(1);
                            setPaymentStatus(e.target.value);
                        }}
                        className="px-4 py-2 border rounded-lg bg-white"
                    >
                        <option value="">All</option>
                        <option value="SUCCESS">Success</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                        <option value="REFUNDED">Refunded</option>
                    </select>
                </div>

            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">

                {loading ? (
                    <div className="p-8 text-sm text-text-secondary">
                        Loading orders...
                    </div>
                ) : error ? (
                    <div className="p-8 text-sm text-red-600">
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-8 text-sm text-text-secondary">
                        No orders found.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-text-secondary">
                            <tr>
                                <th className="p-4">Order</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Order Status</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.map((order) => (
                                <tr
                                    key={order._id}
                                    onClick={() =>
                                        router.push(`/admin/orders/${order._id}`)
                                    }
                                    className="border-t hover:bg-gray-50 cursor-pointer transition"
                                >
                                    <td className="p-4 font-medium">
                                        {order.orderNumber}
                                    </td>

                                    <td className="p-4">
                                        <div>
                                            <div>{order.customerSnapshot.name}</div>
                                            <div className="text-xs text-text-secondary">
                                                {order.customerSnapshot.email}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 font-medium">
                                        ₹{order.grandTotal}
                                    </td>

                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                order.status
                                            )}`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(
                                                order.payment.status
                                            )}`}
                                        >
                                            {order.payment.status}
                                        </span>
                                    </td>

                                    <td className="p-4 text-text-secondary">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ================= PAGINATION ================= */}
            <div className="flex justify-between items-center">
                <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-40"
                >
                    Previous
                </button>

                <div className="text-sm text-text-secondary">
                    Page {page} of {pages}
                </div>

                <button
                    disabled={page === pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
