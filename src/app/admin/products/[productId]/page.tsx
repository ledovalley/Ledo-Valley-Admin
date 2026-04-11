"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProductStatusBadge from "@/components/admin/products/ProductStatusBadge";
import { getErrorMessage } from "@/lib/getErrorMessage";

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
   Page
----------------------------- */
export default function ProductViewPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      try {
        const res = await api.get(`/admin/products/${productId}`);
        if (mounted) setProduct(res.data);
      } catch {
        if (mounted) setError("Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="text-sm text-text-secondary">
        Loading product…
      </div>
    );
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
    <div className="space-y-4 border border-border-muted/7 p-8 rounded-2xl bg-bg-surface">
      {/* ================= BACK ================= */}
      <button
        onClick={() => router.back()}
        className="
          inline-flex items-center gap-2
          text-sm text-text-secondary
          hover:text-black pb-2
          transition hover:cursor-pointer hover:underline
        "
      >
        ← Back
      </button>
      {/* ================= HERO ================= */}
      <div className="flex items-start justify-between border-b border-bg-dark/30 pb-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-playfair tracking-tight">
              {product.name}
            </h1>

            {product.featured && (
              <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                Featured
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span>SKU: {product.sku}</span>
            <span>•</span>
            <span>{product.teaType}</span>
            <span>•</span>
            <ProductStatusBadge status={product.status} />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() =>
              router.push(`/admin/products/${productId}/edit`)
            }
            className="px-5 py-2 hover:cursor-pointer text-sm border rounded-xl hover:bg-gray-50 transition"
          >
            Edit
          </button>

          <button
            onClick={async () => {
              if (!confirm("Delete product permanently?")) return;
              try {
                await api.delete(`/admin/products/${productId}`);
                router.push("/admin/products");
              } catch (error) {
                alert(getErrorMessage(error));
              }
            }}
            className="px-5 py-2 hover:cursor-pointer text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ================= KEY STATS ================= */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="border py-2 border-bg-dark/30 pl-2 w-40 pr-10 rounded-xl bg-bg-dark/5">
          <div className="text-xs uppercase tracking-wide text-text-secondary">
            Variants
          </div>
          <div className="text-2xl font-medium mt-1">
            {product.variants.length}
          </div>
        </div>

        <div className="border py-2 border-bg-dark/30 pl-2 w-40 pr-10 rounded-xl bg-bg-dark/5">
          <div className="text-xs uppercase tracking-wide text-text-secondary">
            Featured
          </div>
          <div className="text-2xl font-medium mt-1">
            {product.featured ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {/* ================= DESCRIPTION ================= */}
      {product.description && (
        <section className="w-full bg-bg-dark/5 border-bg-dark/30 border rounded-xl p-2">
          <h2 className="text-sm font-medium mb-2">
            Description
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {product.description}
          </p>
        </section>
      )}

      {/* ================= TAGS + BEST FOR ================= */}
      <div className="flex flex-wrap gap-10">
        {product.tags?.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-2">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.bestFor.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-2">
              Best For
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.bestFor.map((b) => (
                <span
                  key={b}
                  className="px-3 py-1 text-xs rounded-full border bg-white"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= VARIANTS ================= */}
      <section>
        <h2 className="text-sm font-medium mb-2">
          Variants
        </h2>

        {product.variants.length === 0 ? (
          <div className="text-sm text-text-secondary">
            No variants added yet.
          </div>
        ) : (
          <div className="divide-y rounded-xl border border-bg-dark/30 bg-bg-dark/5">
            {product.variants.map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <div className="font-medium">
                    {v.variantSku}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {v.weight
                      ? `${v.weight.value}${v.weight.unit} • `
                      : ""}
                    ₹{v.sellingPrice} → ₹{v.finalPrice}
                  </div>
                </div>

                <span
                  className={`text-xs font-medium ${v.status === "ACTIVE"
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
      </section>
    </div>
  );
}
