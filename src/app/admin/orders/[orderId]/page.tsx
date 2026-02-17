"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";

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
    };

    returnInfo?: {
        status: string;
    };
}

export default function OrderDetailsPage() {
    const { orderId } = useParams();
    const router = useRouter();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = useCallback(async () => {
        try {
            setLoading(true);
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

    const updateStatus = async (status: string) => {
        try {
            await api.patch(`/admin/orders/${orderId}/status`, {
                status,
            });
            fetchOrder();
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    const approveReturn = async () => {
        try {
            await api.patch(
                `/admin/orders/${orderId}/approve-return`
            );
            fetchOrder();
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    const completeRefund = async () => {
        try {
            await api.patch(
                `/admin/orders/${orderId}/complete-refund`
            );
            fetchOrder();
        } catch (err) {
            alert(getErrorMessage(err));
        }
    };

    if (loading)
        return <div className="p-6">Loading...</div>;

    if (error)
        return (
            <div className="p-6 text-red-600">{error}</div>
        );

    if (!order)
        return <div className="p-6">Order not found</div>;

    return (
        <div className="space-y-8">

            {/* ================= HEADER ================= */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Order #{order.orderNumber}
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                </div>

                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                    Back
                </button>
            </div>

            {/* ================= STATUS BAR ================= */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-wrap justify-between gap-6">

                <div className="flex gap-10">
                    <div>
                        <div className="text-xs text-text-secondary uppercase tracking-wide">
                            Order Status
                        </div>
                        <div className="mt-2">
                            <span className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs text-text-secondary uppercase tracking-wide">
                            Payment
                        </div>
                        <div className="mt-2">
                            <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-medium">
                                {order.payment.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-wrap gap-3">

                    {order.status === "PAYMENT_SUCCESS" && (
                        <button
                            onClick={() => updateStatus("READY_TO_SHIP")}
                            className="px-4 py-2 rounded-lg bg-(--color-brand-primary) text-white hover:opacity-90"
                        >
                            Ready To Ship
                        </button>
                    )}

                    {order.status === "READY_TO_SHIP" && (
                        <button
                            onClick={() => updateStatus("SHIPPED")}
                            className="px-4 py-2 rounded-lg bg-(--color-brand-primary) text-white hover:opacity-90"
                        >
                            Mark Shipped
                        </button>
                    )}

                    {order.status === "SHIPPED" && (
                        <button
                            onClick={() => updateStatus("DELIVERED")}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:opacity-90"
                        >
                            Mark Delivered
                        </button>
                    )}

                    {order.status === "RETURN_REQUESTED" && (
                        <button
                            onClick={approveReturn}
                            className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:opacity-90"
                        >
                            Approve Return
                        </button>
                    )}

                    {order.status === "RETURN_APPROVED" && (
                        <button
                            onClick={completeRefund}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90"
                        >
                            Complete Refund
                        </button>
                    )}
                </div>
            </div>

            {/* ================= MAIN GRID ================= */}
            <div className="grid grid-cols-3 gap-6">

                {/* LEFT SIDE */}
                <div className="col-span-2 space-y-6">

                    {/* ITEMS */}
                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                        <h2 className="font-semibold mb-6 text-lg">
                            Order Items
                        </h2>

                        <div className="space-y-6">
                            {order.items.map((item) => (
                                <div
                                    key={item.variantId}
                                    className="flex justify-between items-start border-b pb-4"
                                >
                                    <div>
                                        <div className="font-medium text-base">
                                            {item.productName}
                                        </div>

                                        <div className="text-xs text-text-secondary mt-1">
                                            SKU: {item.variantSku}
                                        </div>

                                        <div className="text-xs text-text-secondary">
                                            Qty: {item.quantity}
                                        </div>

                                        <div className="text-xs text-text-secondary">
                                            Unit Price: ₹{item.finalPrice}
                                        </div>
                                    </div>

                                    <div className="font-semibold text-base">
                                        ₹{item.subtotal}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CUSTOMER + SHIPPING */}
                    <div className="bg-white border rounded-2xl p-6 shadow-sm grid grid-cols-2 gap-8">

                        <div>
                            <h3 className="font-semibold mb-4">
                                Customer
                            </h3>
                            <div className="text-sm space-y-2">
                                <div>{order.customerSnapshot.name}</div>
                                <div className="text-text-secondary">
                                    {order.customerSnapshot.email}
                                </div>
                                <div className="text-text-secondary">
                                    {order.customerSnapshot.phone}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">
                                Shipping Address
                            </h3>
                            <div className="text-sm space-y-2">
                                <div>{order.shippingAddress.name}</div>
                                <div>{order.shippingAddress.addressLine1}</div>
                                <div>
                                    {order.shippingAddress.city},{" "}
                                    {order.shippingAddress.state}
                                </div>
                                <div>{order.shippingAddress.pincode}</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT SIDE - SUMMARY */}
                <div className="space-y-6">

                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                        <h2 className="font-semibold mb-6 text-lg">
                            Order Summary
                        </h2>

                        <div className="space-y-3 text-sm">

                            <div className="flex justify-between">
                                <span>Items Total</span>
                                <span>₹{order.itemsTotal}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>GST</span>
                                <span>₹{order.gstAmount}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>₹{order.shippingAmount}</span>
                            </div>

                            {order.discountAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-₹{order.discountAmount}</span>
                                </div>
                            )}

                            <div className="border-t pt-4 flex justify-between font-semibold text-base">
                                <span>Total</span>
                                <span>₹{order.grandTotal}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
