"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/api";
import Link from "next/link";

/* ================= TYPES ================= */

interface Customer {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    totalOrders: number;
    totalSpend: number;
    lastOrderDate?: string;
    createdAt: string;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    /* ================= FILTER STATE ================= */

    const [search, setSearch] = useState("");

    const [minSpend, setMinSpend] = useState("");
    const [maxSpend, setMaxSpend] = useState("");

    const [minOrders, setMinOrders] = useState("");
    const [maxOrders, setMaxOrders] = useState("");

    const [emailVerified, setEmailVerified] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [sort, setSort] = useState("newest");

    /* ================= FETCH ================= */

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);

                const { data } = await axios.get("/admin/customers", {
                    params: {
                        page,
                        search,
                        minSpend,
                        maxSpend,
                        minOrders,
                        maxOrders,
                        emailVerified,
                        startDate,
                        endDate,
                        sort,
                    },
                });

                setCustomers(data.customers);
                setPages(data.pages);
            } catch (error) {
                console.error("FETCH CUSTOMERS ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [
        page,
        search,
        minSpend,
        maxSpend,
        minOrders,
        maxOrders,
        emailVerified,
        startDate,
        endDate,
        sort,
    ]);

    const resetFilters = () => {
        setSearch("");
        setMinSpend("");
        setMaxSpend("");
        setMinOrders("");
        setMaxOrders("");
        setEmailVerified("");
        setStartDate("");
        setEndDate("");
        setSort("newest");
        setPage(1);
    };

    return (
        <div className="min-h-screen p-8 space-y-8">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-semibold">Customers</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Advanced customer analytics & segmentation
                </p>
            </div>

            {/* ================= FILTER PANEL ================= */}
            <div className="bg-bg-surface/80 rounded-2xl border shadow-sm p-6 space-y-6">

                <div className="flex h-fit gap-4 w-full">

                    <input
                        type="text"
                        placeholder="Search name, email, phone..."
                        className="px-4 py-3 border rounded-xl text-sm w-full h-fit"
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                    />

                    <select
                        className="px-4 py-3 border rounded-xl text-sm w-fit h-fit"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="highSpend">Highest Spend</option>
                        <option value="mostOrders">Most Orders</option>
                    </select>

                    <select
                        className="px-4 py-3 border rounded-xl text-sm w-fit h-fit"
                        value={emailVerified}
                        onChange={(e) => setEmailVerified(e.target.value)}
                    >
                        <option value="">All Emails</option>
                        <option value="true">Verified</option>
                        <option value="false">Not Verified</option>
                    </select>

                    <button
                        onClick={resetFilters}
                        className="bg-bg-dark text-text-on-dark hover:bg-bg-dark/90 cursor-pointer w-1/3 h-fit rounded-xl text-sm px-4 py-3"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Spend + Orders + Date Filters */}
                <div className="grid grid-cols-6 gap-4">

                    <input
                        type="number"
                        placeholder="Min Spend ₹"
                        className="px-4 py-3 border rounded-xl text-sm"
                        value={minSpend}
                        onChange={(e) => setMinSpend(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Max Spend ₹"
                        className="px-4 py-3 border rounded-xl text-sm"
                        value={maxSpend}
                        onChange={(e) => setMaxSpend(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Min Orders"
                        className="px-4 py-3 border rounded-xl text-sm"
                        value={minOrders}
                        onChange={(e) => setMinOrders(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Max Orders"
                        className="px-4 py-3 border rounded-xl text-sm"
                        value={maxOrders}
                        onChange={(e) => setMaxOrders(e.target.value)}
                    />

                    <input
                        type="date"
                        className="px-4 py-3 border rounded-xl text-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />

                    <input
                        type="date"
                        className="px-4 py-3 border rounded-xl text-sm"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-bg-surface rounded-2xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-bg-dark/10 text-xs uppercase text-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-left">Customer</th>
                            <th className="px-6 py-4 text-left">Orders</th>
                            <th className="px-6 py-4 text-left">Total Spend</th>
                            <th className="px-6 py-4 text-left">Last Order</th>
                            <th className="px-6 py-4 text-left">Joined</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                    Loading customers...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                    No customers found
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer) => (
                                <tr
                                    key={customer._id}
                                    className="border-t hover:bg-bg-page/40 transition"
                                >
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/customers/${customer._id}`}
                                            className="block"
                                        >
                                            <div className="font-medium text-black hover:underline">
                                                {customer.name}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {customer.email}
                                            </div>
                                        </Link>
                                    </td>

                                    <td className="px-6 py-4">{customer.totalOrders}</td>

                                    <td className="px-6 py-4 font-medium">
                                        ₹ {customer.totalSpend.toFixed(2)}
                                    </td>

                                    <td className="px-6 py-4 text-gray-500">
                                        {customer.lastOrderDate
                                            ? new Date(customer.lastOrderDate).toLocaleDateString()
                                            : "-"}
                                    </td>

                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ================= PAGINATION ================= */}
            <div className="flex justify-end gap-4 items-center">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-40"
                >
                    Prev
                </button>

                <span className="text-sm">
                    Page {page} of {pages}
                </span>

                <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
