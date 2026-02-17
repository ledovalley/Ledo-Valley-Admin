"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";

/* -----------------------------
   Types
----------------------------- */
interface VariantSummary {
  _id: string;
  variantSku: string;
  sellingPrice: number;
  finalPrice: number;
  status: "ACTIVE" | "INACTIVE";
}

interface ProductSummary {
  _id: string;
  name: string;
  sku: string;
  teaType: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  featured: boolean;
  tags?: string[];
  bestFor?: string[];
  variants: VariantSummary[];
}

interface Props {
  productId: string;
  onFinish: () => void;
}

/* -----------------------------
   Component
----------------------------- */
export default function StepReviewFinish({
  productId,
  onFinish,
}: Props) {
  const [product, setProduct] =
    useState<ProductSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -----------------------------
     Fetch product
  ----------------------------- */
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(
        `/admin/products/${productId}`
      );

      setProduct(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  /* -----------------------------
     Publish
  ----------------------------- */
  const publishProduct = async () => {
    if (!product || product.variants.length === 0) return;

    try {
      setPublishing(true);
      setError(null);

      await api.put(`/admin/products/${productId}`, {
        status: "ACTIVE",
      });

      onFinish();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPublishing(false);
    }
  };

  /* -----------------------------
     Derived
  ----------------------------- */
  const variants = product?.variants || [];
  const canPublish = variants.length > 0;
  const hasActiveVariant = variants.some(
    (v) => v.status === "ACTIVE"
  );

  /* -----------------------------
     States
  ----------------------------- */
  if (loading) {
    return (
      <div className="text-sm text-text-secondary">
        Loading product review…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-sm text-warning">
        {error || "Unable to load product"}
      </div>
    );
  }

  /* -----------------------------
     UI
  ----------------------------- */
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* ================= SUMMARY ================= */}
      <div className="border rounded-xl p-4 bg-(--color-bg-surface)">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-medium">
              {product.name}
            </div>
            <div className="text-sm text-text-secondary mt-1">
              SKU: {product.sku} • {product.teaType}
            </div>
          </div>

          <span
            className={`text-xs px-2 py-1 rounded-lg font-medium ${
              product.status === "DRAFT"
                ? "bg-yellow-100 text-yellow-700"
                : product.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {product.status}
          </span>
        </div>
      </div>

      {/* ================= META ================= */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-xs text-text-secondary mb-1">
            Featured
          </div>
          <div className="font-medium">
            {product.featured ? "Yes" : "No"}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-xs text-text-secondary mb-1">
            Tags
          </div>
          {product.tags?.length ? (
            <div className="flex flex-wrap gap-1">
              {product.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-xs border rounded-md"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-text-secondary">—</span>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-xs text-text-secondary mb-1">
            Best For
          </div>
          {product.bestFor?.length ? (
            <div className="flex flex-wrap gap-1">
              {product.bestFor.map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 text-xs border rounded-md"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-text-secondary">—</span>
          )}
        </div>
      </div>

      {/* ================= VARIANTS ================= */}
      <div>
        <div className="text-sm font-medium mb-2">
          Variants ({variants.length})
        </div>

        {variants.length === 0 ? (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            You must add at least one variant before publishing.
          </div>
        ) : (
          <div className="space-y-2">
            {variants.map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between border rounded-lg px-4 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {v.variantSku}
                  </div>
                  <div className="text-text-secondary">
                    ₹{v.sellingPrice} → ₹{v.finalPrice}
                  </div>
                </div>

                <span
                  className={`text-xs font-medium ${
                    v.status === "ACTIVE"
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {!hasActiveVariant && variants.length > 0 && (
          <div className="mt-3 text-xs text-yellow-700">
            ⚠ Product will be published but no variants are active.
          </div>
        )}
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onFinish}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-(--color-bg-surface)"
        >
          Save as draft & exit
        </button>

        <button
          onClick={publishProduct}
          disabled={!canPublish || publishing}
          className="px-6 py-2.5 rounded-lg text-white bg-(--color-brand-primary) disabled:opacity-50"
        >
          {publishing ? "Publishing…" : "Publish Product"}
        </button>
      </div>
    </div>
  );
}
