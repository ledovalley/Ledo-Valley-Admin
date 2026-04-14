"use client";

import api from "@/lib/api";
import { AdminCoupon } from "@/app/admin/coupons/page";
import { useState } from "react";
import {
  Loader2,
  Power,
  Trash2,
  TicketPercent,
  CalendarClock,
} from "lucide-react";

interface Props {
  coupons: AdminCoupon[];
  loading: boolean;
  onRefresh: () => void;
}

export default function CouponsTable({
  coupons,
  loading,
  onRefresh,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleStatus = async (id: string) => {
    try {
      setBusyId(id);
      await api.put(`/admin/coupons/${id}/toggle`);
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;

    try {
      setBusyId(id);
      await api.delete(`/admin/coupons/${id}`);
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
        <div className="border-b border-black/5 bg-bg-surface px-6 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-black/5" />
        </div>
        <div className="space-y-3 p-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="grid animate-pulse gap-3 rounded-2xl border border-black/5 p-4 md:grid-cols-6"
            >
              <div className="h-4 rounded bg-black/5 md:col-span-1" />
              <div className="h-4 rounded bg-black/5 md:col-span-1" />
              <div className="h-4 rounded bg-black/5 md:col-span-1" />
              <div className="h-4 rounded bg-black/5 md:col-span-1" />
              <div className="h-4 rounded bg-black/5 md:col-span-1" />
              <div className="h-4 rounded bg-black/5 md:col-span-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!coupons.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-surface text-text-secondary">
          <TicketPercent className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-text-primary">
          No coupons yet
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          Create your first coupon to start offering discounts.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 bg-bg-surface px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">All Coupons</h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            View discount values, usage, expiry, and status.
          </p>
        </div>
        <div className="text-xs text-text-secondary">
          {coupons.length} total
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-black/5 bg-white">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Discount</th>
              <th className="px-6 py-4">Min Order</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Expires</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((c) => {
              const isBusy = busyId === c._id;
              const isExpired = new Date(c.expiresAt).getTime() < Date.now();

              return (
                <tr
                  key={c._id}
                  className="border-b border-black/5 align-middle transition hover:bg-bg-surface/50 last:border-none"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold tracking-wide text-text-primary">
                      {c.code}
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">
                      {c.type === "PERCENT" ? "Percentage" : "Flat discount"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary">
                      {c.type === "PERCENT" ? `${c.value}%` : `₹${c.value}`}
                    </div>
                    {c.maxDiscount ? (
                      <div className="mt-1 text-xs text-text-secondary">
                        Max discount: ₹{c.maxDiscount}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-6 py-4 text-text-primary">
                    ₹{c.minOrderAmount}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-text-primary">
                      {c.usedCount} / {c.usageLimit ?? "∞"}
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">
                      Redemptions used
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-2 text-text-primary">
                      <CalendarClock className="h-4 w-4 text-text-secondary" />
                      {new Date(c.expiresAt).toLocaleDateString()}
                    </div>
                    {isExpired ? (
                      <div className="mt-1 text-xs text-red-600">Expired</div>
                    ) : null}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                        c.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-600",
                      ].join(" ")}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        disabled={isBusy}
                        onClick={() => toggleStatus(c._id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs font-medium text-text-primary transition hover:bg-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                        Toggle
                      </button>

                      <button
                        disabled={isBusy}
                        onClick={() => deleteCoupon(c._id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}