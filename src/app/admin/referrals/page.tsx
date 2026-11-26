"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Gift, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate, formatINR } from "@/lib/orderFlow";

interface Row {
  orderId: string;
  orderNumber: string;
  date: string;
  friend: string;
  friendDiscount: number;
  total: number;
  status: string;
  paymentStatus: string;
  code: string;
  referrer: { id: string; name?: string; email?: string; phone?: string } | null;
  reward: {
    state: "WAITING" | "SENT" | "USED" | "EXPIRED" | "SKIPPED";
    code?: string;
    note?: string;
    expiresAt?: string | null;
    type?: "FLAT" | "PERCENT";
    value?: number;
    maxDiscount?: number | null;
  };
}

const STATE: Record<Row["reward"]["state"], { label: string; cls: string }> = {
  WAITING: { label: "Waiting", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  SENT: { label: "Sent", cls: "bg-sky-50 text-sky-800 ring-sky-200" },
  USED: { label: "Used", cls: "bg-green-50 text-green-800 ring-green-200" },
  EXPIRED: { label: "Expired", cls: "bg-gray-100 text-gray-600 ring-gray-200" },
  SKIPPED: { label: "Not sent", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const offer = (r: Row["reward"]) =>
  r.type === "PERCENT" ? `${r.value}% off${r.maxDiscount ? ` (up to ₹${r.maxDiscount})` : ""}` : r.value ? `₹${r.value} off` : "";

export default function ReferralsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/referrals");
      setRows(res.data.rows || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () => ({
      orders: rows.length,
      sales: rows.reduce((s, r) => s + (Number(r.total) || 0), 0),
      friendDiscounts: rows.reduce((s, r) => s + (Number(r.friendDiscount) || 0), 0),
      rewardsSent: rows.filter((r) => ["SENT", "USED", "EXPIRED"].includes(r.reward.state)).length,
      rewardsUsed: rows.filter((r) => r.reward.state === "USED").length,
    }),
    [rows]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-bg-dark/10 bg-bg-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-text-primary">
              <Gift className="h-6 w-6" /> Referrals
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Paid orders placed with a friend&apos;s code, and the reward for the customer who shared it. Set the offers in{" "}
              <Link href="/admin/settings" className="underline">
                Settings
              </Link>
              .
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Orders from referrals", String(totals.orders)],
            ["Their sales", formatINR(totals.sales)],
            ["Friends' discounts", formatINR(totals.friendDiscounts)],
            ["Rewards sent / used", `${totals.rewardsSent} / ${totals.rewardsUsed}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-black/5 bg-white p-4">
              <dt className="text-xs text-text-secondary">{k}</dt>
              <dd className="mt-1 text-lg font-semibold text-text-primary">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white p-10 text-center text-sm text-text-secondary">
          No referral orders yet. Turn on Refer a friend in Settings; customers find their code on their account page.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-bg-dark/10 bg-bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-bg-dark/5 text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Friend</th>
                <th className="px-4 py-3">Shared by</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Reward</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = STATE[r.reward.state];
                return (
                  <tr key={r.orderId} className="border-t border-black/5 align-top">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${r.orderId}`} className="font-medium text-text-primary hover:underline">
                        #{r.orderNumber}
                      </Link>
                      <div className="text-xs text-text-secondary">
                        {formatDate(r.date)} · {r.status.replaceAll("_", " ").toLowerCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{r.friend || "—"}</div>
                      <div className="text-xs text-text-secondary">
                        code {r.code} · saved {formatINR(r.friendDiscount)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.referrer ? (
                        <>
                          <Link href={`/admin/customers/${r.referrer.id}`} className="hover:underline">
                            {r.referrer.name || r.referrer.email || r.referrer.phone}
                          </Link>
                          <div className="text-xs text-text-secondary">{r.referrer.email || r.referrer.phone}</div>
                        </>
                      ) : (
                        <span className="text-text-secondary">Account removed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{formatINR(r.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${st.cls}`}>{st.label}</span>
                      {r.reward.code && (
                        <div className="mt-1 font-mono text-xs text-text-primary">
                          {r.reward.code}
                          {r.reward.state === "SENT" && offer(r.reward) ? <span className="font-sans text-text-secondary"> · {offer(r.reward)}</span> : null}
                        </div>
                      )}
                      {r.reward.note && <div className="mt-1 text-xs text-text-secondary">{r.reward.note}</div>}
                      {r.reward.state === "SENT" && r.reward.expiresAt && (
                        <div className="text-xs text-text-secondary">until {formatDate(r.reward.expiresAt)}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
