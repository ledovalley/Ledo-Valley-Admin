"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import {
  BadgeCheck,
  CircleAlert,
  Package2,
  Tags,
  Star,
  Leaf,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

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
   Helpers
----------------------------- */
function StatusBadge({
  status,
}: {
  status: ProductSummary["status"];
}) {
  const styles =
    status === "ACTIVE"
      ? "bg-success/10 text-success border-success/20"
      : status === "DRAFT"
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}

function VariantStatusBadge({
  status,
}: {
  status: VariantSummary["status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${status === "ACTIVE"
          ? "bg-success/10 text-success"
          : "bg-gray-100 text-text-secondary"
        }`}
    >
      {status}
    </span>
  );
}

function InfoChip({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center rounded-lg border border-border bg-bg-surface px-2.5 py-1 text-xs text-text-secondary">
      {children}
    </span>
  );
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

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get(`/admin/products/${productId}`);
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

  const publishProduct = useCallback(async () => {
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
  }, [onFinish, product, productId]);

  const variants = product?.variants || [];
  const canPublish = variants.length > 0;
  const hasActiveVariant = variants.some(
    (v) => v.status === "ACTIVE"
  );

  const discountedVariants = useMemo(() => {
    return variants.filter((v) => v.finalPrice < v.sellingPrice).length;
  }, [variants]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-bg-surface" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-2xl bg-bg-surface" />
          <div className="h-24 animate-pulse rounded-2xl bg-bg-surface" />
          <div className="h-24 animate-pulse rounded-2xl bg-bg-surface" />
        </div>
        <div className="h-56 animate-pulse rounded-2xl bg-bg-surface" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
        {error || "Unable to load product review."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Header */}
      <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-text-secondary">
              <BadgeCheck className="h-4 w-4" />
              Final Review
            </div>

            <h2 className="text-xl font-semibold text-text-primary">
              {product.name}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <InfoChip>SKU: {product.sku}</InfoChip>
              <InfoChip>{product.teaType}</InfoChip>
              <StatusBadge status={product.status} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-surface px-4 py-3 md:min-w-65">
            <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Publish Readiness
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              {canPublish ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-text-primary">
                    Ready to publish
                  </span>
                </>
              ) : (
                <>
                  <CircleAlert className="h-4 w-4 text-warning" />
                  <span className="text-text-primary">
                    Add at least one variant
                  </span>
                </>
              )}
            </div>
            {!hasActiveVariant && variants.length > 0 && (
              <p className="mt-2 text-xs text-warning">
                Product can be published, but no variants are active yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <ShoppingBag className="h-4 w-4 text-brand-primary" />
            Variants
          </div>
          <div className="mt-3 text-2xl font-semibold text-text-primary">
            {variants.length}
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Total purchasable options configured.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Package2 className="h-4 w-4 text-brand-primary" />
            Active Variants
          </div>
          <div className="mt-3 text-2xl font-semibold text-text-primary">
            {variants.filter((v) => v.status === "ACTIVE").length}
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Variants visible for purchase after publish.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Tags className="h-4 w-4 text-brand-primary" />
            Discounted Variants
          </div>
          <div className="mt-3 text-2xl font-semibold text-text-primary">
            {discountedVariants}
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Variants with a reduced final price.
          </p>
        </div>
      </section>

      {/* Metadata */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Star className="h-4 w-4 text-brand-primary" />
            Featured
          </div>
          <div
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${product.featured
                ? "bg-success/10 text-success"
                : "bg-bg-surface text-text-secondary"
              }`}
          >
            {product.featured ? "Yes, featured" : "Not featured"}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Tags className="h-4 w-4 text-brand-primary" />
            Tags
          </div>

          {product.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-border bg-bg-surface px-2.5 py-1 text-xs text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              No tags added.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Leaf className="h-4 w-4 text-brand-primary" />
            Best For
          </div>

          {product.bestFor?.length ? (
            <div className="flex flex-wrap gap-2">
              {product.bestFor.map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-border bg-bg-surface px-2.5 py-1 text-xs text-text-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              No usage highlights added.
            </p>
          )}
        </div>
      </section>

      {/* Variants */}
      <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
              Variants Review
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Check pricing and active status before publishing.
            </p>
          </div>

          <div className="rounded-full bg-bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            {variants.length} total
          </div>
        </div>

        {variants.length === 0 ? (
          <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-4 text-sm text-warning">
            You must add at least one variant before publishing.
          </div>
        ) : (
          <div className="space-y-3">
            {variants.map((v) => {
              const discounted = v.finalPrice < v.sellingPrice;

              return (
                <div
                  key={v._id}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-surface/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-text-primary">
                        {v.variantSku}
                      </h4>
                      <VariantStatusBadge status={v.status} />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                      <span>MRP ₹{v.sellingPrice}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="font-medium text-text-primary">
                        ₹{v.finalPrice}
                      </span>
                      {discounted && (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                          Discounted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-text-secondary">
                    {v.status === "ACTIVE"
                      ? "Available after publish"
                      : "Will remain inactive"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <section className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-text-secondary">
          You can save now and publish later, or publish immediately if the product is ready.
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onFinish}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-surface"
          >
            Save as draft & exit
          </button>

          <button
            onClick={publishProduct}
            disabled={!canPublish || publishing}
            className="rounded-xl bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? "Publishing…" : "Publish Product"}
          </button>
        </div>
      </section>
    </div>
  );
}