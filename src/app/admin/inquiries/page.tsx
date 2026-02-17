"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/api";

interface Inquiry {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: "PENDING" | "IN_PROGRESS" | "RESPONDED" | "CLOSED";
    adminNote?: string;
    createdAt: string;
}

export default function AdminContactPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const [selected, setSelected] = useState<Inquiry | null>(null);
    const [adminNote, setAdminNote] = useState("");

    /* ================= FETCH ================= */
    const fetchInquiries = async () => {
        try {
            setLoading(true);

            const { data } = await axios.get("/admin/contact", {
                params: { page, search, status },
            });

            setInquiries(data.inquiries);
            setPages(data.pages);

        } catch (error) {
            console.error("FETCH INQUIRIES ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [page, search, status]);

    /* ================= UPDATE STATUS ================= */
    const updateStatus = async (newStatus: string) => {
        if (!selected) return;

        try {
            await axios.patch(`/admin/contact/${selected._id}`, {
                status: newStatus,
                adminNote,
            });

            setSelected(null);
            fetchInquiries();

        } catch (error) {
            console.error("UPDATE ERROR:", error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold mb-6">
                Contact Inquiries
            </h1>

            {/* ================= FILTER BAR ================= */}
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Search..."
                    className="border px-3 py-2 rounded-lg w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select
                    className="border px-3 py-2 rounded-lg"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESPONDED">Responded</option>
                    <option value="CLOSED">Closed</option>
                </select>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-4">Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-6 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : inquiries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-6 text-center">
                                    No inquiries found
                                </td>
                            </tr>
                        ) : (
                            inquiries.map((item) => (
                                <tr key={item._id} className="border-t">
                                    <td className="p-4">{item.fullName}</td>
                                    <td>{item.email}</td>
                                    <td>{item.subject}</td>
                                    <td>
                                        <span className="px-2 py-1 text-xs rounded bg-gray-200">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => {
                                                setSelected(item);
                                                setAdminNote(item.adminNote || "");
                                            }}
                                            className="text-blue-600 hover:underline"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ================= PAGINATION ================= */}
            <div className="flex justify-end gap-2 mt-6">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 border rounded"
                >
                    Prev
                </button>

                <span className="px-3 py-1">
                    Page {page} of {pages}
                </span>

                <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 border rounded"
                >
                    Next
                </button>
            </div>

            {/* ================= PREMIUM MODAL ================= */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border animate-fadeIn">

                        {/* HEADER */}
                        <div className="flex justify-between items-start p-6 border-b">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Inquiry Details
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Received on{" "}
                                    {new Date(selected.createdAt).toLocaleString()}
                                </p>
                            </div>

                            <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${selected.status === "PENDING"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : selected.status === "IN_PROGRESS"
                                            ? "bg-blue-100 text-blue-700"
                                            : selected.status === "RESPONDED"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-700"
                                    }`}
                            >
                                {selected.status.replace("_", " ")}
                            </span>
                        </div>

                        {/* BODY */}
                        <div className="p-6 space-y-6">

                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Name</p>
                                    <p className="font-medium text-gray-900">
                                        {selected.fullName}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Email</p>
                                    <p className="font-medium text-gray-900 break-all">
                                        {selected.email}
                                    </p>
                                </div>

                                {selected.phone && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Phone</p>
                                        <p className="font-medium text-gray-900">
                                            {selected.phone}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs text-gray-500 uppercase">Subject</p>
                                    <p className="font-medium text-gray-900">
                                        {selected.subject}
                                    </p>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-2">
                                    Customer Message
                                </p>
                                <div className="bg-gray-50 border rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-gray-800 leading-relaxed">
                                    {selected.message}
                                </div>
                            </div>

                            {/* Admin Note */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-2">
                                    Admin Note
                                </p>
                                <textarea
                                    className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    rows={4}
                                    placeholder="Write internal notes here..."
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* FOOTER ACTIONS */}
                        <div className="flex justify-between items-center p-6 border-t bg-gray-50 rounded-b-2xl">

                            <button
                                onClick={() => setSelected(null)}
                                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition"
                            >
                                Close
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => updateStatus("IN_PROGRESS")}
                                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                >
                                    In Progress
                                </button>

                                <button
                                    onClick={() => updateStatus("RESPONDED")}
                                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                                >
                                    Mark Responded
                                </button>

                                <button
                                    onClick={() => updateStatus("CLOSED")}
                                    className="px-4 py-2 text-sm bg-gray-800 hover:bg-black text-white rounded-lg transition"
                                >
                                    Close Inquiry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
