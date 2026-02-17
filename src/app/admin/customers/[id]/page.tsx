"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/api";
import { useParams } from "next/navigation";

/* ================= TYPES ================= */

interface Customer {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    createdAt: string;
}

interface CustomerStats {
    totalOrders: number;
    totalSpend: number;
    averageOrderValue: number;
    lastOrderDate?: string | null;
}

interface CustomerOrder {
    _id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    grandTotal: number;
}

interface CustomerProfileResponse {
    customer: Customer;
    stats: CustomerStats;
    orders: CustomerOrder[];
}

interface StatCardProps {
    title: string;
    value: string | number;
}

/* ================= PAGE ================= */

export default function CustomerProfilePage() {
    const params = useParams();
    const id = params?.id as string;

    const [data, setData] = useState<CustomerProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get<CustomerProfileResponse>(
                    `/admin/customers/${id}`
                );
                setData(res.data);
            } catch (error) {
                console.error("PROFILE FETCH ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) load();
    }, [id]);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!data) {
        return <div className="p-8">Customer not found</div>;
    }

    const { customer, stats, orders } = data;

    return (
        <div className="min-h-screen p-8 space-y-8">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-semibold">{customer.name}</h1>
                <p className="text-gray-500">{customer.email}</p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard title="Total Orders" value={stats.totalOrders} />
                <StatCard
                    title="Total Spend"
                    value={`₹ ${stats.totalSpend.toFixed(2)}`}
                />
                <StatCard
                    title="Average Order"
                    value={`₹ ${stats.averageOrderValue.toFixed(2)}`}
                />
                <StatCard
                    title="Last Order"
                    value={
                        stats.lastOrderDate
                            ? new Date(stats.lastOrderDate).toLocaleDateString()
                            : "-"
                    }
                />
            </div>

            {/* ORDER HISTORY */}
            <div className="bg-bg-surface rounded-2xl border border-border-muted/30 overflow-hidden">
                <div className="px-6 py-4 border-b border-border-muted/30 font-medium">
                    Order History
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-bg-dark/20 text-xs uppercase text-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-left">Order #</th>
                            <th className="px-6 py-4 text-left">Date</th>
                            <th className="px-6 py-4 text-left">Status</th>
                            <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id} className="border-t border-border-muted/10 hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium">
                                    {order.orderNumber}
                                </td>

                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>

                                <td className="px-6 py-4">
                                    <span className="px-3 py-1 text-xs bg-gray-100 rounded-full">
                                        {order.status}
                                    </span>
                                </td>

                                <td className="px-6 py-4 font-medium text-right">
                                    ₹ {order.grandTotal.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ================= SMALL COMPONENT ================= */

function StatCard({ title, value }: StatCardProps) {
    return (
        <div className="bg-bg-surface p-6 rounded-2xl border border-border-muted/20">
            <p className="text-xs text-gray-500">{title}</p>
            <h3 className="text-2xl font-semibold mt-2">{value}</h3>
        </div>
    );
}
