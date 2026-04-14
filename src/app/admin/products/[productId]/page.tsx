"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import ProductStatusBadge from "@/components/admin/products/ProductStatusBadge";
import { getErrorMessage } from "@/lib/getErrorMessage";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Star,
  Package2,
  BadgeIndianRupee,
  Leaf,
  Tags,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

/* -----------------------------
   Types
----------------------------- */
interface Variant {
  _id: string;
  variantSku: string;
  sellingPrice: number;
  finalPrice: number;
  status: "ACTIVE" | "INACTIVE";
  weight?: {
    value: number;
    unit: string;
  };
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  teaType: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  featured: boolean;
  tags: string[];
  bestFor: string[];
  variants: Variant[];
}

/* -----------------------------
   Helpers
----------------------------- */
function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  const styles =
    tone === "success"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "warning"
        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
        : "bg-bg-dark/5 text-text-secondary border-bg-dark/10";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-3 text-2xl font-medium text-text-primary">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-text-secondary">
          {hint}
        </div>
      )}
    </div>
  );
}

/* -----------------------------
   Page
----------------------------- */
export default function ProductViewPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/admin/products/${productId}`);
        if (mounted) setProduct(res.data);
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err) || "Failed to load product");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const totalVariants = product?.variants.length ?? 0;

  const activeVariants = useMemo(() => {
    return product?.variants.filter((v) => v.status === "ACTIVE")
      .length ?? 0;
  }, [product]);

  const lowestFinalPrice = useMemo(() => {
    if (!product?.variants.length) return null;
    return Math.min(...product.variants.map((v) => v.finalPrice));
  }, [product]);

  const hasDiscountedVariant = useMemo(() => {
    return (
      product?.variants.some(
        (v) => v.finalPrice < v.sellingPrice
      ) ?? false
    );
  }, [product]);

  const handleDelete = async () => {
    if (!confirm("Delete product permanently?")) return;

    try {
      setDeleting(true);
      await api.delete(`/admin/products/${productId}`);
      router.push("/admin/products");
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-bg-dark/5" />
        <div className="h-40 animate-pulse rounded-3xl bg-bg-dark/5" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl bg-bg-dark/5" />
          <div className="h-28 animate-pulse rounded-2xl bg-bg-dark/5" />
          <div className="h-28 animate-pulse rounded-2xl bg-bg-dark/5" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="h-72 animate-pulse rounded-2xl bg-bg-dark/5" />
          <div className="h-72 animate-pulse rounded-2xl bg-bg-dark/5" />
        </div>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-warning">
        {error || "Product not found"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to previous page
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              router.push(`/admin/products/${productId}/edit`)
            }
            className="inline-flex items-center gap-2 rounded-xl border border-bg-dark/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-dark/5"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="rounded-3xl border border-bg-dark/10 bg-bg-surface p-6 md:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <ProductStatusBadge status={product.status} />
              {product.featured && (
                <Chip tone="success">Featured product</Chip>
              )}
              {activeVariants === 0 && totalVariants > 0 && (
                <Chip tone="warning">No active variants</Chip>
              )}
            </div>

            <h1 className="text-3xl font-playfair tracking-tight text-text-primary md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span>SKU: {product.sku}</span>
              <span className="hidden sm:inline">•</span>
              <span>{product.teaType}</span>
              <span className="hidden sm:inline">•</span>
              <span>{totalVariants} variants</span>
            </div>

            {product.description && (
              <p className="mt-5 max-w-3xl text-sm leading-7 text-text-secondary">
                Product overview and configured details are shown below for quick admin review.
              </p>
            )}
          </div>

          <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:max-w-90">
            <div className="rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary">
                Starting price
              </div>
              <div className="mt-2 text-2xl font-medium text-text-primary">
                {lowestFinalPrice !== null ? `₹${lowestFinalPrice}` : "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary">
                Discounting
              </div>
              <div className="mt-2 text-2xl font-medium text-text-primary">
                {hasDiscountedVariant ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Variants"
          value={totalVariants}
          hint="Total configured options"
          icon={<Package2 className="h-4 w-4" />}
        />
        <StatCard
          label="Active variants"
          value={activeVariants}
          hint="Available when product is live"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Featured"
          value={product.featured ? "Yes" : "No"}
          hint="Homepage or curated visibility"
          icon={<Star className="h-4 w-4" />}
        />
        <StatCard
          label="Best price"
          value={lowestFinalPrice !== null ? `₹${lowestFinalPrice}` : "—"}
          hint="Lowest final variant price"
          icon={<BadgeIndianRupee className="h-4 w-4" />}
        />
      </section>

      {/* Content grid */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {product.description && (
            <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
                Description
              </h2>
              <div
                className="prose prose-sm mt-4 max-w-none text-text-secondary"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Package2 className="h-4 w-4 text-text-secondary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
                Variants
              </h2>
            </div>

            {product.variants.length === 0 ? (
              <div className="rounded-xl border border-bg-dark/10 bg-bg-dark/5 px-4 py-4 text-sm text-text-secondary">
                No variants added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {product.variants.map((v) => {
                  const discounted = v.finalPrice < v.sellingPrice;

                  return (
                    <div
                      key={v._id}
                      className="flex flex-col gap-3 rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-text-primary">
                            {v.variantSku}
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${v.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {v.status}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-text-secondary">
                          {v.weight
                            ? `${v.weight.value}${v.weight.unit} • `
                            : ""}
                          ₹{v.sellingPrice} → ₹{v.finalPrice}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {discounted && (
                          <Chip tone="success">Discounted</Chip>
                        )}
                        {v.status !== "ACTIVE" && (
                          <Chip>Inactive</Chip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Tags className="h-4 w-4 text-text-secondary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
                Tags
              </h2>
            </div>

            {product.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-bg-dark/5 px-3 py-1 text-xs font-medium text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                No tags added for this product.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Leaf className="h-4 w-4 text-text-secondary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
                Best For
              </h2>
            </div>

            {product.bestFor?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.bestFor.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-bg-dark/10 px-3 py-1 text-xs font-medium text-text-primary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                No usage notes added.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-text-secondary" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
                Quick Review
              </h2>
            </div>

            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex items-start justify-between gap-4">
                <span>Status</span>
                <span className="font-medium text-text-primary">
                  {product.status}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Featured</span>
                <span className="font-medium text-text-primary">
                  {product.featured ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Active variants</span>
                <span className="font-medium text-text-primary">
                  {activeVariants}/{totalVariants}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span>Discount applied</span>
                <span className="font-medium text-text-primary">
                  {hasDiscountedVariant ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}