"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import CreateCouponModal from "@/components/admin/coupons/CreateCouponModal";
import CouponsTable from "@/components/admin/coupons/CouponsTable";

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
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-playfair">Coupons</h1>
          <p className="text-sm text-text-secondary">
            Manage discount coupons
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 cursor-pointer rounded-lg bg-(--color-brand-primary) text-white"
        >
          Create Coupon
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

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
