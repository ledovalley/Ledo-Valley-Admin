"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import StepAddVariants from "@/components/admin/products/CreateProductModal/StepAddVariants";

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
];

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

export default function EditProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* -----------------------------
     Fetch product
  ----------------------------- */
  useEffect(() => {
    let mounted = true;

    const fetchProduct = async () => {
      try {
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

  /* -----------------------------
     Save
  ----------------------------- */
  const saveChanges = async () => {
    if (!product) return;

    try {
      setSaving(true);
      await api.put(`/admin/products/${productId}`, {
        name: product.name,
        description: product.description,
        teaType: product.teaType,
        bestFor: product.bestFor,
        featured: product.featured,
        tags: product.tags,
        status: product.status,
      });
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-text-secondary">Loading…</div>;
  }

  if (!product || error) {
    return (
      <div className="text-sm text-warning">
        {error || "Product not found"}
      </div>
    );
  }

  /* -----------------------------
     UI
  ----------------------------- */
  return (
    <div className="space-y-8 max-w-5xl">
      {/* ================= BACK ================= */}
      <button
        onClick={() => router.back()}
        className="text-sm text-text-secondary hover:underline"
      >
        ← Back
      </button>

      {/* ================= HEADER ================= */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-playfair">Edit Product</h1>
          <p className="text-sm text-text-secondary mt-1">
            {product.name} • {product.sku}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              router.push(`/admin/products/${productId}`)
            }
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            View
          </button>

          <button
            onClick={saveChanges}
            disabled={saving || !TEA_TYPES.includes(product.teaType)}
            className="px-5 py-2.5 rounded-lg bg-(--color-brand-primary) text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* ================= BASIC INFO ================= */}
      <div className="bg-white border rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium">Product Information</h2>

        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <input
            value={product.name}
            onChange={(e) =>
              setProduct({ ...product, name: e.target.value })
            }
            className="px-4 py-2.5 border rounded-lg"
            placeholder="Product name"
          />

          <select
            value={TEA_TYPES.includes(product.teaType) ? product.teaType : ""}
            onChange={(e) =>
              setProduct({ ...product, teaType: e.target.value })
            }
            className="px-4 py-2.5 border rounded-lg bg-white"
          >
            <option value="">Select tea type</option>
            {TEA_TYPES.map((teaType) => (
              <option key={teaType} value={teaType}>
                {teaType}
              </option>
            ))}
          </select>
        </div>

        {!TEA_TYPES.includes(product.teaType) && (
          <p className="text-xs text-warning">
            Choose one of the supported tea types before saving.
          </p>
        )}

        {/* Description */}
        <textarea
          value={product.description || ""}
          onChange={(e) =>
            setProduct({
              ...product,
              description: e.target.value,
            })
          }
          className="w-full px-4 py-3 border rounded-lg min-h-25"
          placeholder="Product description"
        />

        {/* Best for */}
        <input
          value={product.bestFor.join(", ")}
          onChange={(e) =>
            setProduct({
              ...product,
              bestFor: e.target.value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            })
          }
          className="w-full px-4 py-2.5 border rounded-lg"
          placeholder="Best for (comma separated)"
        />
      </div>

      {/* ================= MERCHANDISING ================= */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-medium">Merchandising</h2>

        {/* Featured */}
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={product.featured}
            onChange={(e) =>
              setProduct({
                ...product,
                featured: e.target.checked,
              })
            }
          />
          Featured product
        </label>

        {/* Tags */}
        <div>
          <div className="text-sm mb-2">Tags</div>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const active = product.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setProduct({
                      ...product,
                      tags: active
                        ? product.tags.filter((t) => t !== tag)
                        : [...product.tags, tag],
                    })
                  }
                  className={`px-3 py-1 text-xs rounded-full border transition ${
                    active
                      ? "bg-(--color-brand-primary) text-white border-(--color-brand-primary)"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= STATUS ================= */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-sm font-medium mb-3">
          Product Status
        </h2>

        <select
          value={product.status}
          onChange={(e) =>
            setProduct({
              ...product,
              status: e.target.value as ProductStatus,
            })
          }
          className="px-4 py-2.5 border rounded-lg bg-white"
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* ================= VARIANTS ================= */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-sm font-medium mb-4">
          Variants
        </h2>

        <StepAddVariants productId={productId} onDone={() => {}} />
      </div>
    </div>
  );
}
