"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import CreateCouponModal from "@/components/admin/coupons/CreateCouponModal";
import CouponsTable from "@/components/admin/coupons/CouponsTable";
import { BadgePercent, CircleOff, Plus, Ticket, TimerReset } from "lucide-react";

export interface AdminCoupon {
  _id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt: string;
  status: "ACTIVE" | "INACTIVE";
  notApplicableOnCOD?: boolean;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get("/admin/coupons");
      setCoupons(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();

    const active = coupons.filter((c) => c.status === "ACTIVE").length;
    const inactive = coupons.filter((c) => c.status === "INACTIVE").length;
    const expiringSoon = coupons.filter((c) => {
      const expires = new Date(c.expiresAt).getTime();
      const diff = expires - now.getTime();
      return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 7;
    }).length;

    return {
      total: coupons.length,
      active,
      inactive,
      expiringSoon,
    };
  }, [coupons]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-text-primary">Coupons</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage discount coupons, activation status, and expiry windows.
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Coupons"
          value={stats.total}
          icon={<Ticket className="h-4 w-4" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<BadgePercent className="h-4 w-4" />}
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          icon={<CircleOff className="h-4 w-4" />}
        />
        <StatCard
          label="Expiring in 7 days"
          value={stats.expiringSoon}
          icon={<TimerReset className="h-4 w-4" />}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <CouponsTable
        coupons={coupons}
        loading={loading}
        onRefresh={fetchCoupons}
      />

      <CreateCouponModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={fetchCoupons}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-bg-surface p-2 text-text-secondary">
          {icon}
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold text-text-primary">{value}</div>
      <div className="mt-1 text-sm text-text-secondary">{label}</div>
    </div>
  );
}