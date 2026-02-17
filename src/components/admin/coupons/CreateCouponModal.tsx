"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";

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
  /* ================= STATE ================= */

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] =
    useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState<number | "">("");
  const [minOrderAmount, setMinOrderAmount] =
    useState<number | "">("");
  const [maxDiscount, setMaxDiscount] =
    useState<number | "">("");
  const [usageLimit, setUsageLimit] =
    useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");

  /* ================= ESC CLOSE ================= */

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
    }

    return () =>
      window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  /* ================= VALIDATION ================= */

  const isValid = useMemo(() => {
    if (!code.trim()) return false;
    if (!value || Number(value) <= 0) return false;
    if (!expiresAt) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiresAt);
    if (expiry <= today) return false;

    if (type === "PERCENT" && Number(value) > 100)
      return false;

    return true;
  }, [code, value, expiresAt, type]);

  /* ================= PREVIEW ================= */

  const previewDiscount = useMemo(() => {
    if (!value) return "—";
    return type === "PERCENT"
      ? `${value}%`
      : `₹${value}`;
  }, [value, type]);

  /* ================= RESET ================= */

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

  /* ================= CREATE ================= */

  const handleCreate = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);

      await api.post("/admin/coupons", {
        code: code.trim(),
        type,
        value: Number(value),
        minOrderAmount:
          minOrderAmount === "" ? 0 : Number(minOrderAmount),
        maxDiscount:
          type === "PERCENT" && maxDiscount !== ""
            ? Number(maxDiscount)
            : null,
        usageLimit:
          usageLimit === "" ? null : Number(usageLimit),
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

  /* ================= HOOK SAFE RETURN ================= */

  if (!open) return null;

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8 space-y-6">
        {/* HEADER */}
        <div>
          <h2 className="text-xl font-semibold">
            Create Coupon
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Configure discount rules and expiry
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CODE */}
        <div>
          <label className="text-sm font-medium block mb-1">
            Coupon Code
          </label>
          <input
            placeholder="SUMMER2026"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase())
            }
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-(--color-brand-primary)"
          />
        </div>

        {/* TYPE + VALUE */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Discount Type
            </label>
            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as "PERCENT" | "FLAT"
                )
              }
              className="w-full px-4 py-2.5 border rounded-lg bg-white"
            >
              <option value="PERCENT">Percent (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Value
            </label>
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) =>
                setValue(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              className="w-full px-4 py-2.5 border rounded-lg"
            />
          </div>
        </div>

        {/* MAX DISCOUNT */}
        {type === "PERCENT" && (
          <div>
            <label className="text-sm font-medium block mb-1">
              Max Discount (₹)
            </label>
            <input
              type="number"
              min={0}
              value={maxDiscount}
              onChange={(e) =>
                setMaxDiscount(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              className="w-full px-4 py-2.5 border rounded-lg"
            />
            <p className="text-xs text-text-secondary mt-1">
              Caps percentage discount
            </p>
          </div>
        )}

        {/* RULES */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Min Order Amount
            </label>
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) =>
                setMinOrderAmount(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              className="w-full px-4 py-2.5 border rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Usage Limit
            </label>
            <input
              type="number"
              min={0}
              value={usageLimit}
              onChange={(e) =>
                setUsageLimit(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              className="w-full px-4 py-2.5 border rounded-lg"
            />
          </div>
        </div>

        {/* EXPIRY */}
        <div>
          <label className="text-sm font-medium block mb-1">
            Expiry Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={expiresAt}
            onChange={(e) =>
              setExpiresAt(e.target.value)
            }
            className="w-full px-4 py-2.5 border rounded-lg"
          />
        </div>

        {/* PREVIEW */}
        <div className="rounded-lg bg-(--color-bg-surface) px-4 py-3 text-sm">
          <div className="font-medium mb-1">
            Preview
          </div>
          <div className="text-text-secondary">
            This coupon will apply{" "}
            <span className="font-semibold text-black">
              {previewDiscount}
            </span>{" "}
            discount
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={!isValid || loading}
            className="px-6 py-2.5 rounded-lg cursor-pointer bg-(--color-brand-primary) text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}
