"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/api";
import {
    Search,
    Filter,
    Mail,
    Clock3,
    CheckCircle2,
    Archive,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    NotebookPen,
    Phone,
    User,
} from "lucide-react";

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

const statusStyles: Record<Inquiry["status"], string> = {
    PENDING: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    RESPONDED: "bg-green-100 text-green-700",
    CLOSED: "bg-zinc-200 text-zinc-700",
};

export default function AdminContactPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const [selected, setSelected] = useState<Inquiry | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [saving, setSaving] = useState(false);

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

    const updateStatus = async (newStatus: Inquiry["status"]) => {
        if (!selected) return;

        try {
            setSaving(true);

            await axios.patch(`/admin/contact/${selected._id}`, {
                status: newStatus,
                adminNote,
            });

            setSelected(null);
            fetchInquiries();
        } catch (error) {
            console.error("UPDATE ERROR:", error);
        } finally {
            setSaving(false);
        }
    };

    const stats = useMemo(() => {
        return {
            total: inquiries.length,
            pending: inquiries.filter((i) => i.status === "PENDING").length,
            inProgress: inquiries.filter((i) => i.status === "IN_PROGRESS").length,
            responded: inquiries.filter((i) => i.status === "RESPONDED").length,
            closed: inquiries.filter((i) => i.status === "CLOSED").length,
        };
    }, [inquiries]);

    return (
        <div className="space-y-6 p-6 md:p-8">
            <div className="flex flex-col gap-4 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">
                        Contact Inquiries
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Review customer messages, track progress, and manage follow-ups.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <StatChip icon={<Mail className="h-4 w-4" />} label="Total" value={stats.total} />
                    <StatChip icon={<Clock3 className="h-4 w-4" />} label="Pending" value={stats.pending} />
                    <StatChip icon={<Filter className="h-4 w-4" />} label="In Progress" value={stats.inProgress} />
                    <StatChip icon={<CheckCircle2 className="h-4 w-4" />} label="Responded" value={stats.responded} />
                    <StatChip icon={<Archive className="h-4 w-4" />} label="Closed" value={stats.closed} />
                </div>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or subject..."
                            className="w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            value={search}
                            onChange={(e) => {
                                setPage(1);
                                setSearch(e.target.value);
                            }}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <select
                            className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            value={status}
                            onChange={(e) => {
                                setPage(1);
                                setStatus(e.target.value);
                            }}
                        >
                            <option value="">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESPONDED">Responded</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-black/5 bg-bg-surface px-5 py-4">
                    <div>
                        <h2 className="text-sm font-semibold text-text-primary">All Inquiries</h2>
                        <p className="mt-0.5 text-xs text-text-secondary">
                            Search, review, and update customer conversations.
                        </p>
                    </div>
                    <div className="text-xs text-text-secondary">
                        {inquiries.length} items
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="border-b border-black/5 bg-white">
                            <tr className="text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                                <th className="px-5 py-4">Customer</th>
                                <th className="px-5 py-4">Subject</th>
                                <th className="px-5 py-4">Status</th>
                                <th className="px-5 py-4">Received</th>
                                <th className="px-5 py-4 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i} className="border-b border-black/5 last:border-none">
                                        <td className="px-5 py-4" colSpan={5}>
                                            <div className="grid animate-pulse gap-3 md:grid-cols-5">
                                                <div className="h-4 rounded bg-black/5 md:col-span-1" />
                                                <div className="h-4 rounded bg-black/5 md:col-span-1" />
                                                <div className="h-4 rounded bg-black/5 md:col-span-1" />
                                                <div className="h-4 rounded bg-black/5 md:col-span-1" />
                                                <div className="h-4 rounded bg-black/5 md:col-span-1" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-surface text-text-secondary">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-4 text-base font-semibold text-text-primary">
                                            No inquiries found
                                        </h3>
                                        <p className="mt-1 text-sm text-text-secondary">
                                            Try a different search term or clear the status filter.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                inquiries.map((item) => (
                                    <tr
                                        key={item._id}
                                        className="border-b border-black/5 transition hover:bg-bg-surface/50 last:border-none"
                                    >
                                        <td className="px-5 py-4 align-top">
                                            <div className="font-medium text-text-primary">{item.fullName}</div>
                                            <div className="mt-1 text-xs text-text-secondary">{item.email}</div>
                                            {item.phone ? (
                                                <div className="mt-1 text-xs text-text-secondary">{item.phone}</div>
                                            ) : null}
                                        </td>

                                        <td className="px-5 py-4 align-top">
                                            <div className="font-medium text-text-primary">{item.subject}</div>
                                            <div className="mt-1 line-clamp-2 max-w-md text-xs text-text-secondary">
                                                {item.message}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 align-top">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}
                                            >
                                                {item.status.replace("_", " ")}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 align-top text-text-secondary">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>

                                        <td className="px-5 py-4 text-right align-top">
                                            <button
                                                onClick={() => {
                                                    setSelected(item);
                                                    setAdminNote(item.adminNote || "");
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs font-medium text-text-primary transition hover:bg-bg-surface"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-text-secondary">
                    Page {page} of {pages}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm text-text-primary transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                    </button>

                    <button
                        disabled={page === pages}
                        onClick={() => setPage(page + 1)}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm text-text-primary transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm md:p-6">
                    <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-semibold text-text-primary">
                                    Inquiry Details
                                </h2>
                                <p className="mt-1 text-sm text-text-secondary">
                                    Received on {new Date(selected.createdAt).toLocaleString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selected.status]}`}
                                >
                                    {selected.status.replace("_", " ")}
                                </span>

                                <button
                                    onClick={() => setSelected(null)}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-text-secondary transition hover:bg-bg-surface hover:text-text-primary"
                                    aria-label="Close inquiry details"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
                            <aside className="border-b border-black/5 bg-bg-surface p-6 lg:border-b-0 lg:border-r">
                                <div className="space-y-5">
                                    <div className="rounded-2xl border border-black/5 bg-white p-5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                                            <User className="h-4 w-4 text-text-secondary" />
                                            Customer
                                        </div>

                                        <div className="mt-4 space-y-4 text-sm">
                                            <InfoRow label="Name" value={selected.fullName} />
                                            <InfoRow label="Email" value={selected.email} />
                                            {selected.phone ? (
                                                <InfoRow label="Phone" value={selected.phone} icon={<Phone className="h-3.5 w-3.5" />} />
                                            ) : null}
                                            <InfoRow label="Subject" value={selected.subject} />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-black/5 bg-white p-5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                                            <NotebookPen className="h-4 w-4 text-text-secondary" />
                                            Internal Note
                                        </div>

                                        <textarea
                                            className="mt-4 min-h-40 w-full rounded-xl border border-black/10 bg-white p-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                            placeholder="Write internal notes here..."
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </aside>

                            <div className="p-6">
                                <div className="rounded-2xl border border-black/5 bg-white">
                                    <div className="border-b border-black/5 px-5 py-4">
                                        <p className="text-sm font-medium text-text-primary">
                                            Customer Message
                                        </p>
                                        <p className="mt-1 text-xs text-text-secondary">
                                            Review the inquiry before updating the status.
                                        </p>
                                    </div>

                                    <div className="max-h-90 overflow-y-auto px-5 py-5 text-sm leading-7 text-text-primary">
                                        {selected.message}
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <button
                                        disabled={saving}
                                        onClick={() => updateStatus("IN_PROGRESS")}
                                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Mark In Progress
                                    </button>

                                    <button
                                        disabled={saving}
                                        onClick={() => updateStatus("RESPONDED")}
                                        className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Mark Responded
                                    </button>

                                    <button
                                        disabled={saving}
                                        onClick={() => updateStatus("CLOSED")}
                                        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
                                    >
                                        Close Inquiry
                                    </button>

                                    <button
                                        onClick={() => setSelected(null)}
                                        className="ml-auto rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-surface"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatChip({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-bg-surface px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-text-secondary shadow-sm">
                {icon}
            </div>
            <div>
                <div className="text-sm font-semibold text-text-primary">{value}</div>
                <div className="text-xs text-text-secondary">{label}</div>
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <div className="text-xs uppercase tracking-wide text-text-secondary">
                {label}
            </div>
            <div className="mt-1 flex items-center gap-2 break-all font-medium text-text-primary">
                {icon ? <span className="text-text-secondary">{icon}</span> : null}
                <span>{value}</span>
            </div>
        </div>
    );
}