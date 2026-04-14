"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import StepAddVariants from "@/components/admin/products/CreateProductModal/StepAddVariants";
import RichTextEditor from "@/components/admin/products/RichTextEditor";
import {
  ArrowLeft,
  Save,
  Eye,
  Package2,
  Tags,
  FileText,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";

const TAG_OPTIONS = [
  "TOP_SELLER",
  "BEST_SELLER",
  "NEW_LAUNCH",
  "LIMITED_EDITION",
  "ORGANIC",
  "SEASONAL",
] as const;

const TEA_TYPES = [
  "Black Tea",
  "Green Tea",
  "Organic Tea",
  "Speciality Tea",
] as const;

type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

interface Product {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  teaType: string;
  bestFor: string[];
  featured: boolean;
  tags: string[];
  status: ProductStatus;
}

function SectionCard({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-5 md:p-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
            {title}
          </h2>
        </div>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function InfoPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active
          ? "border-brand-primary bg-brand-primary text-white"
          : "border-bg-dark/10 bg-white text-text-secondary hover:bg-bg-dark/5"
        }`}
    >
      {children}
    </button>
  );
}

export default function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/admin/products/${productId}`);
        if (mounted) setProduct(res.data);
      } catch (err) {
        if (mounted) setError(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const saveChanges = async () => {
    if (!product) return;

    try {
      setSaving(true);
      setError(null);

      await api.put(`/admin/products/${productId}`, {
        name: product.name,
        description: product.description,
        teaType: product.teaType,
        bestFor: product.bestFor,
        featured: product.featured,
        tags: product.tags,
        status: product.status,
      });

      setSavedAt(new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const isTeaTypeValid = product
    ? TEA_TYPES.includes(product.teaType as (typeof TEA_TYPES)[number])
    : false;

  const isNameValid = !!product?.name.trim();

  const canSave = !!product && isTeaTypeValid && isNameValid && !saving;

  const bestForInput = useMemo(() => {
    return product?.bestFor.join(", ") ?? "";
  }, [product?.bestFor]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-bg-dark/5" />
        <div className="h-24 animate-pulse rounded-3xl bg-bg-dark/5" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="h-72 animate-pulse rounded-2xl bg-bg-dark/5" />
            <div className="h-56 animate-pulse rounded-2xl bg-bg-dark/5" />
            <div className="h-72 animate-pulse rounded-2xl bg-bg-dark/5" />
          </div>
          <div className="h-80 animate-pulse rounded-2xl bg-bg-dark/5" />
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
      {/* Top nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push(`/admin/products/${productId}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-bg-dark/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-dark/5"
          >
            <Eye className="h-4 w-4" />
            View product
          </button>

          <button
            onClick={saveChanges}
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Header */}
      <section className="rounded-3xl border border-bg-dark/10 bg-bg-surface p-6 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-text-secondary">
              Product Editor
            </div>
            <h1 className="text-3xl font-playfair tracking-tight text-text-primary">
              Edit Product
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              {product.name} • {product.sku}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-90">
            <div className="rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary">
                Status
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {product.status}
              </div>
            </div>

            <div className="rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary">
                Tea Type
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {product.teaType || "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4">
              <div className="text-xs uppercase tracking-wide text-text-secondary">
                Last Save
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {savedAt || "Not saved yet"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-warning">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left */}
        <div className="space-y-6">
          <SectionCard
            title="Product Information"
            icon={<FileText className="h-4 w-4 text-text-secondary" />}
            description="Update the main product details customers and admins rely on."
          >
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Product name
                  </label>
                  <input
                    value={product.name}
                    onChange={(e) =>
                      setProduct({ ...product, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-text-secondary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                    placeholder="Product name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Tea type
                  </label>
                  <select
                    value={
                      TEA_TYPES.includes(
                        product.teaType as (typeof TEA_TYPES)[number]
                      )
                        ? product.teaType
                        : ""
                    }
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        teaType: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  >
                    <option value="">Select tea type</option>
                    {TEA_TYPES.map((teaType) => (
                      <option key={teaType} value={teaType}>
                        {teaType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isTeaTypeValid && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-warning">
                  Choose one of the supported tea types before saving.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Description
                </label>
                <RichTextEditor
                  value={product.description || ""}
                  onChange={(val) =>
                    setProduct({
                      ...product,
                      description: val,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Best for
                </label>
                <input
                  value={bestForInput}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      bestFor: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-text-secondary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  placeholder="Example: Morning routine, gifting, immunity"
                />
                <p className="mt-2 text-xs text-text-secondary">
                  Separate multiple values with commas.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Merchandising"
            icon={<Tags className="h-4 w-4 text-text-secondary" />}
            description="Control discovery, merchandising, and highlight labels."
          >
            <div className="space-y-5">
              <label className="flex items-start gap-3 rounded-2xl border border-bg-dark/10 bg-bg-dark/5 p-4">
                <input
                  type="checkbox"
                  checked={product.featured}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      featured: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-bg-dark/20 text-brand-primary focus:ring-brand-primary/20"
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    Featured product
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    Use this to prioritize the product in curated admin or storefront areas.
                  </p>
                </div>
              </label>

              <div>
                <label className="mb-3 block text-sm font-medium text-text-primary">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((tag) => {
                    const active = product.tags.includes(tag);

                    return (
                      <InfoPill
                        key={tag}
                        active={active}
                        onClick={() =>
                          setProduct({
                            ...product,
                            tags: active
                              ? product.tags.filter((t) => t !== tag)
                              : [...product.tags, tag],
                          })
                        }
                      >
                        {tag}
                      </InfoPill>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Status"
            icon={<CircleAlert className="h-4 w-4 text-text-secondary" />}
            description="Control whether this product stays as draft, goes live, or remains inactive."
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {(["DRAFT", "ACTIVE", "INACTIVE"] as const).map((status) => {
                const active = product.status === status;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() =>
                      setProduct({
                        ...product,
                        status,
                      })
                    }
                    className={`rounded-2xl border p-4 text-left transition ${active
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-bg-dark/10 bg-white hover:bg-bg-dark/5"
                      }`}
                  >
                    <div className="text-sm font-semibold text-text-primary">
                      {status}
                    </div>
                    <div className="mt-1 text-xs text-text-secondary">
                      {status === "DRAFT" &&
                        "Keep editing before making it live."}
                      {status === "ACTIVE" &&
                        "Make the product available in active flows."}
                      {status === "INACTIVE" &&
                        "Hide the product without deleting it."}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="Variants"
            icon={<Package2 className="h-4 w-4 text-text-secondary" />}
            description="Manage product variants and pricing below."
          >
            <StepAddVariants productId={productId} onDone={() => { }} />
          </SectionCard>
        </div>

        {/* Right */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <SectionCard
            title="Edit Summary"
            icon={<CheckCircle2 className="h-4 w-4 text-text-secondary" />}
          >
            <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-text-secondary">Name</span>
                <span className="text-right font-medium text-text-primary">
                  {product.name || "Untitled"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-text-secondary">Tea type</span>
                <span className="text-right font-medium text-text-primary">
                  {product.teaType || "Not selected"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-text-secondary">Status</span>
                <span className="text-right font-medium text-text-primary">
                  {product.status}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-text-secondary">Featured</span>
                <span className="text-right font-medium text-text-primary">
                  {product.featured ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-text-secondary">Tags</span>
                <span className="text-right font-medium text-text-primary">
                  {product.tags.length}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-text-secondary">Best for</span>
                <span className="text-right font-medium text-text-primary">
                  {product.bestFor.length}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Save Checklist"
            icon={<CircleAlert className="h-4 w-4 text-text-secondary" />}
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 h-2.5 w-2.5 rounded-full ${isNameValid ? "bg-green-500" : "bg-yellow-500"
                    }`}
                />
                <div>
                  <div className="font-medium text-text-primary">
                    Product name
                  </div>
                  <div className="text-text-secondary">
                    {isNameValid ? "Looks good" : "Required before saving"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 h-2.5 w-2.5 rounded-full ${isTeaTypeValid ? "bg-green-500" : "bg-yellow-500"
                    }`}
                />
                <div>
                  <div className="font-medium text-text-primary">
                    Tea type
                  </div>
                  <div className="text-text-secondary">
                    {isTeaTypeValid
                      ? "Supported type selected"
                      : "Select one supported option"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-green-500" />
                <div>
                  <div className="font-medium text-text-primary">
                    Save action
                  </div>
                  <div className="text-text-secondary">
                    Changes update this product directly.
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}