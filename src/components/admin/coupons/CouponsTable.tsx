"use client";

import api from "@/lib/api";
import { AdminCoupon } from "@/app/admin/coupons/page";
import { useState } from "react";

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
    setBusyId(id);
    await api.put(`/admin/coupons/${id}/toggle`);
    onRefresh();
    setBusyId(null);
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;

    setBusyId(id);
    await api.delete(`/admin/coupons/${id}`);
    onRefresh();
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        Loading coupons…
      </div>
    );
  }

  if (!coupons.length) {
    return (
      <div className="border rounded-lg p-6 bg-white text-center">
        No coupons created yet.
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-(--color-bg-surface)">
          <tr>
            <th className="px-6 py-3 text-left">Code</th>
            <th className="px-6 py-3 text-left">Discount</th>
            <th className="px-6 py-3 text-left">Usage</th>
            <th className="px-6 py-3 text-left">Expires</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {coupons.map((c) => (
            <tr key={c._id} className="border-b last:border-none">
              <td className="px-6 py-4 font-medium">
                {c.code}
              </td>

              <td className="px-6 py-4">
                {c.type === "PERCENT"
                  ? `${c.value}%`
                  : `₹${c.value}`}
              </td>

              <td className="px-6 py-4">
                {c.usedCount} /{" "}
                {c.usageLimit ?? "∞"}
              </td>

              <td className="px-6 py-4">
                {new Date(c.expiresAt).toLocaleDateString()}
              </td>

              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    c.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {c.status}
                </span>
              </td>

              <td className="px-6 py-4 text-right space-x-3">
                <button
                  disabled={busyId === c._id}
                  onClick={() => toggleStatus(c._id)}
                  className="text-xs text-(--color-brand-primary) cursor-pointer hover:underline"
                >
                  Toggle
                </button>

                <button
                  disabled={busyId === c._id}
                  onClick={() => deleteCoupon(c._id)}
                  className="text-xs text-red-600 cursor-pointer hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
