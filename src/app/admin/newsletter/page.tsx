"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/api";

interface Subscriber {
    _id: string;
    email: string;
    status: "PENDING" | "ACTIVE" | "UNSUBSCRIBED";
    createdAt: string;
}

interface Campaign {
    _id: string;
    subject: string;
    status: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    sentAt?: string;
    createdAt: string;
}

export default function AdminNewsletterPage() {
    const [tab, setTab] = useState<"subscribers" | "campaigns">("subscribers");

    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [subject, setSubject] = useState("");
    const [htmlContent, setHtmlContent] = useState("");

    /* ================= FETCH ================= */
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                if (tab === "subscribers") {
                    const { data } = await axios.get("/admin/newsletter/subscribers");
                    setSubscribers(data.subscribers);
                }

                if (tab === "campaigns") {
                    const { data } = await axios.get("/admin/newsletter/campaigns");
                    setCampaigns(data.campaigns);
                }

            } catch (error) {
                console.error("FETCH ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [tab]);

    /* ================= SEND CAMPAIGN ================= */

    const sendCampaign = async () => {
        try {
            await axios.post("/admin/newsletter/send", {
                subject,
                htmlContent,
            });

            setShowCreate(false);
            setSubject("");
            setHtmlContent("");
        } catch (error) {
            console.error("SEND ERROR:", error);
        }
    };

    return (
        <div className="min-h-screen p-8 space-y-8">

            {/* ================= HEADER ================= */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Newsletter Manager
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage subscribers and email campaigns
                    </p>
                </div>

                {tab === "campaigns" && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-5 py-2.5 bg-bg-dark cursor-pointer text-white rounded-xl text-sm hover:opacity-90 transition"
                    >
                        + New Campaign
                    </button>
                )}
            </div>

            {/* ================= SEGMENTED TABS ================= */}
            <div className="flex bg-bg-surface p-1 border border-border-muted/20 rounded-xl w-fit">
                <button
                    onClick={() => setTab("subscribers")}
                    className={`px-6 py-2 text-sm rounded-lg transition cursor-pointer ${tab === "subscribers"
                        ? "bg-bg-dark text-white"
                        : "text-gray-500 hover:text-black"
                        }`}
                >
                    Subscribers
                </button>

                <button
                    onClick={() => setTab("campaigns")}
                    className={`px-6 py-2 text-sm rounded-lg transition cursor-pointer ${tab === "campaigns"
                        ? "bg-bg-dark text-white"
                        : "text-gray-500 hover:text-black"
                        }`}
                >
                    Campaigns
                </button>
            </div>

            {/* ================= CAMPAIGN STATS ================= */}
            {tab === "campaigns" && (
                <div className="grid grid-cols-4 gap-6">
                    <div className="bg-bg-surface p-5 rounded-2xl border border-border-muted/20">
                        <p className="text-xs text-gray-500">Total Campaigns</p>
                        <h3 className="text-2xl font-semibold mt-2">
                            {campaigns.length}
                        </h3>
                    </div>

                    <div className="bg-bg-surface p-5 rounded-2xl border border-border-muted/20">
                        <p className="text-xs text-gray-500">Total Recipients</p>
                        <h3 className="text-2xl font-semibold mt-2">
                            {campaigns.reduce((a, c) => a + c.totalRecipients, 0)}
                        </h3>
                    </div>

                    <div className="bg-bg-surface p-5 rounded-2xl border border-border-muted/20">
                        <p className="text-xs text-gray-500">Successful Sends</p>
                        <h3 className="text-2xl font-semibold mt-2 text-green-600">
                            {campaigns.reduce((a, c) => a + c.successCount, 0)}
                        </h3>
                    </div>

                    <div className="bg-bg-surface p-5 rounded-2xl border border-border-muted/20">
                        <p className="text-xs text-gray-500">Failures</p>
                        <h3 className="text-2xl font-semibold mt-2 text-red-500">
                            {campaigns.reduce((a, c) => a + c.failureCount, 0)}
                        </h3>
                    </div>
                </div>
            )}

            {/* ================= SUBSCRIBERS ================= */}
            {tab === "subscribers" && (
                <div className="bg-bg-surface rounded-2xl border border-border-muted/20 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-bg-dark/10 text-gray-600 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left">Email</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Subscribed</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                                        Loading subscribers...
                                    </td>
                                </tr>
                            ) : subscribers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                                        No subscribers found
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((sub) => (
                                    <tr
                                        key={sub._id}
                                        className="border-t hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 font-medium">{sub.email}</td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 text-xs font-medium rounded-full ${sub.status === "ACTIVE"
                                                    ? "bg-green-100 text-green-700"
                                                    : sub.status === "PENDING"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-gray-200 text-gray-600"
                                                    }`}
                                            >
                                                {sub.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ================= CAMPAIGNS ================= */}
            {tab === "campaigns" && (
                <div className="bg-bg-surface rounded-2xl border border-border-muted/20 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-bg-dark/10 text-gray-600 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left">Subject</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Recipients</th>
                                <th className="px-6 py-4 text-left">Success</th>
                                <th className="px-6 py-4 text-left">Failure</th>
                                <th className="px-6 py-4 text-left">Sent</th>
                            </tr>
                        </thead>

                        <tbody>
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                        No campaigns created yet
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((c) => (
                                    <tr
                                        key={c._id}
                                        className="border-t hover:bg-gray-50 transition"
                                    >
                                        <td className="px-6 py-4 font-medium">{c.subject}</td>

                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 text-xs rounded-full bg-gray-100">
                                                {c.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">{c.totalRecipients}</td>

                                        <td className="px-6 py-4 text-green-600 font-medium">
                                            {c.successCount}
                                        </td>

                                        <td className="px-6 py-4 text-red-500 font-medium">
                                            {c.failureCount}
                                        </td>

                                        <td className="px-6 py-4 text-gray-500">
                                            {c.sentAt
                                                ? new Date(c.sentAt).toLocaleDateString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ================= CREATE MODAL ================= */}
            {showCreate && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">

                        {/* ================= HEADER ================= */}
                        <div className="flex items-center justify-between px-8 py-6 border-b">
                            <div>
                                <h2 className="text-2xl font-semibold">
                                    Create Newsletter Campaign
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Compose and send an email campaign to subscribers.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowCreate(false)}
                                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition"
                            >
                                ×
                            </button>
                        </div>

                        {/* ================= BODY ================= */}
                        <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email Subject
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter campaign subject..."
                                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            {/* Preview Text */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Preview Text (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Appears in inbox preview..."
                                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition"
                                />
                            </div>

                            {/* Target Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Target Audience
                                </label>
                                <select
                                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition"
                                >
                                    <option value="ALL">All Subscribers</option>
                                    <option value="ACTIVE_ONLY">Active Only</option>
                                </select>
                            </div>

                            {/* HTML Content */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Email HTML Content
                                </label>
                                <textarea
                                    rows={12}
                                    placeholder="<h1>Your HTML content here...</h1>"
                                    className="w-full border border-gray-200 rounded-2xl px-4 py-4 text-sm font-mono focus:ring-2 focus:ring-black outline-none transition"
                                    value={htmlContent}
                                    onChange={(e) => setHtmlContent(e.target.value)}
                                />
                            </div>

                        </div>

                        {/* ================= FOOTER ================= */}
                        <div className="sticky bottom-0 bg-white border-t px-8 py-5 flex justify-between items-center">

                            <button
                                onClick={() => setShowCreate(false)}
                                className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={sendCampaign}
                                className="px-7 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                            >
                                Send Campaign
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
