"use client";

import { useState } from "react";
import api from "@/lib/api";
import { AdminProduct } from "@/app/admin/products/page";
import ProductStatusBadge from "./ProductStatusBadge";
import { getErrorMessage } from "@/lib/getErrorMessage";

interface Props {
  products: AdminProduct[];
  loading: boolean;
  onRefresh: () => void;
  onEdit?: (productId: string) => void;
}

export default function ProductsTable({
  products,
  loading,
  onRefresh,
  onEdit,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleStatus = async (id: string) => {
    try {
      setBusyId(id);
      await api.put(`/admin/products/${id}/toggle`);
      onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;

    try {
      setBusyId(id);
      await api.delete(`/admin/products/${id}`);
      onRefresh();
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <p className="text-sm text-text-secondary">
          Loading products…
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="border rounded-lg p-10 bg-white text-center">
        <p className="text-sm text-text-secondary">
          No products yet.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-(--color-bg-surface)">
          <tr className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            <th className="px-6 py-3 text-left">Product</th>
            <th className="px-6 py-3 text-left w-24">Variants</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Created</th>
            <th className="px-6 py-3 text-right whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => {
            const busy = busyId === p._id;
            const isDraft = p.status === "DRAFT";

            return (
              <tr
                key={p._id}
                className={`border-b last:border-b-0 ${busy ? "opacity-60" : "hover:bg-gray-50"
                  }`}
              >
                {/* PRODUCT */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {p.name}
                    </span>

                    {p.featured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        Featured
                      </span>
                    )}
                  </div>

                  {p.tags?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 border rounded-full text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}

                      {p.tags.length > 3 && (
                        <span className="text-[10px] text-text-secondary">
                          +{p.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* VARIANTS */}
                <td className="px-6 py-4">
                  {p.variantCount}
                </td>

                {/* STATUS */}
                <td className="px-6 py-4">
                  <ProductStatusBadge status={p.status} />
                </td>

                {/* CREATED */}
                <td className="px-6 py-4 text-text-secondary">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>

                {/* ACTIONS */}
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-3">
                    {onEdit && (
                      <button
                        disabled={busy}
                        onClick={() => onEdit(p._id)}
                        className="text-xs font-medium hover:underline disabled:cursor-not-allowed"
                      >
                        View
                      </button>
                    )}

                    {!isDraft && (
                      <button
                        disabled={busy}
                        onClick={() => toggleStatus(p._id)}
                        className="text-xs font-medium text-(--color-brand-primary) hover:underline disabled:cursor-not-allowed"
                      >
                        {p.status === "ACTIVE"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    )}

                    {isDraft && (
                      <span className="text-xs text-text-secondary">
                        Draft
                      </span>
                    )}

                    <button
                      disabled={busy}
                      onClick={() => deleteProduct(p._id)}
                      className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
