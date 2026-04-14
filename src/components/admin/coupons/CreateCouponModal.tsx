"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import {
  CalendarClock,
  IndianRupee,
  Percent,
  TicketPercent,
  X,
  Sparkles,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCouponModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState<number | "">("");
  const [minOrderAmount, setMinOrderAmount] = useState<number | "">("");
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
      setTimeout(() => firstInputRef.current?.focus(), 0);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const isValid = useMemo(() => {
    if (!code.trim()) return false;
    if (!value || Number(value) <= 0) return false;
    if (!expiresAt) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiresAt);
    if (expiry <= today) return false;

    if (type === "PERCENT" && Number(value) > 100) return false;

    return true;
  }, [code, value, expiresAt, type]);

  const previewDiscount = useMemo(() => {
    if (!value) return "—";
    return type === "PERCENT" ? `${value}%` : `₹${value}`;
  }, [value, type]);

  const expiresLabel = useMemo(() => {
    if (!expiresAt) return "No expiry selected";
    return new Date(expiresAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [expiresAt]);

  const validationMessage = useMemo(() => {
    if (!code.trim()) return "Enter a coupon code.";
    if (!value || Number(value) <= 0) return "Enter a valid discount value.";
    if (type === "PERCENT" && Number(value) > 100) {
      return "Percentage discount cannot exceed 100.";
    }
    if (!expiresAt) return "Choose an expiry date.";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    if (expiry <= today) return "Expiry date must be in the future.";

    return null;
  }, [code, value, type, expiresAt]);

  const resetForm = () => {
    setCode("");
    setValue("");
    setMinOrderAmount("");
    setMaxDiscount("");
    setUsageLimit("");
    setExpiresAt("");
    setType("PERCENT");
    setError(null);
  };

  const handleCreate = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);

      await api.post("/admin/coupons", {
        code: code.trim(),
        type,
        value: Number(value),
        minOrderAmount: minOrderAmount === "" ? 0 : Number(minOrderAmount),
        maxDiscount:
          type === "PERCENT" && maxDiscount !== ""
            ? Number(maxDiscount)
            : null,
        usageLimit: usageLimit === "" ? null : Number(usageLimit),
        expiresAt,
      });

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-coupon-title"
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 sm:px-8">
          <div>
            <h2
              id="create-coupon-title"
              className="text-xl font-semibold text-text-primary"
            >
              Create Coupon
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Configure discount rules, eligibility, and expiration.
            </p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-text-secondary transition hover:bg-bg-surface hover:text-text-primary"
            aria-label="Close create coupon modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid max-h-[85vh] overflow-y-auto lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6 px-6 py-6 sm:px-8">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Coupon Code
              </label>
              <input
                ref={firstInputRef}
                placeholder="SUMMER2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
              <p className="text-xs text-text-secondary">
                Use a short, readable code customers can type easily.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Discount Type
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-bg-surface p-1">
                  <button
                    type="button"
                    onClick={() => setType("PERCENT")}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${type === "PERCENT"
                        ? "bg-white text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                      }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Percent
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("FLAT")}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${type === "FLAT"
                        ? "bg-white text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                      }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Flat
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Discount Value
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                    {type === "PERCENT" ? "%" : "₹"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(e) =>
                      setValue(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-black/10 bg-white py-3 pl-10 pr-4 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  />
                </div>
                <p className="text-xs text-text-secondary">
                  {type === "PERCENT"
                    ? "Enter a percentage from 1 to 100."
                    : "Enter the fixed amount to discount."}
                </p>
              </div>
            </div>

            {type === "PERCENT" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Max Discount
                </label>
                <input
                  type="number"
                  min={0}
                  value={maxDiscount}
                  onChange={(e) =>
                    setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
                <p className="text-xs text-text-secondary">
                  Optional cap for percentage discounts.
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Minimum Order Amount
                </label>
                <input
                  type="number"
                  min={0}
                  value={minOrderAmount}
                  onChange={(e) =>
                    setMinOrderAmount(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
                <p className="text-xs text-text-secondary">
                  Optional threshold before the coupon becomes valid.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min={0}
                  value={usageLimit}
                  onChange={(e) =>
                    setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
                <p className="text-xs text-text-secondary">
                  Leave empty for unlimited redemptions.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Expiry Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
              <p className="text-xs text-text-secondary">
                Customers will no longer be able to redeem this coupon after this date.
              </p>
            </div>

            {validationMessage ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {validationMessage}
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Looks good. This coupon is ready to be created.
              </div>
            )}
          </div>

          <aside className="border-t border-black/5 bg-bg-surface px-6 py-6 sm:px-8 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live Preview
                </div>
                <h3 className="mt-3 text-base font-semibold text-text-primary">
                  Coupon Summary
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Preview how this coupon will be configured before saving.
                </p>
              </div>

              <div className="rounded-3xl border border-brand-primary/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-text-secondary">
                      Coupon code
                    </div>
                    <div className="mt-2 text-2xl font-semibold tracking-wide text-text-primary">
                      {code.trim() || "NEWCOUPON"}
                    </div>
                  </div>

                  <div className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
                    {type === "PERCENT" ? "Percent" : "Flat"}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-bg-surface p-4">
                  <div className="text-xs text-text-secondary">
                    Discount
                  </div>
                  <div className="mt-1 text-xl font-semibold text-text-primary">
                    {previewDiscount}
                  </div>

                  {type === "PERCENT" && maxDiscount !== "" ? (
                    <div className="mt-2 text-xs text-text-secondary">
                      Capped at ₹{maxDiscount}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary">Min order</span>
                    <span className="font-medium text-text-primary">
                      {minOrderAmount === "" ? "None" : `₹${minOrderAmount}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary">Usage limit</span>
                    <span className="font-medium text-text-primary">
                      {usageLimit === "" ? "Unlimited" : usageLimit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary">Expires</span>
                    <span className="font-medium text-text-primary">
                      {expiresLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-black/5 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <CalendarClock className="h-4 w-4 text-text-secondary" />
                  Current rule
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  This coupon will apply{" "}
                  <span className="font-semibold text-text-primary">
                    {previewDiscount}
                  </span>{" "}
                  discount
                  {minOrderAmount !== "" ? ` on orders above ₹${minOrderAmount}` : ""}
                  {expiresAt ? ` until ${expiresLabel}` : ""}.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-black/5 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-surface"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={!isValid || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <TicketPercent className="h-4 w-4" />
            {loading ? "Creating..." : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}