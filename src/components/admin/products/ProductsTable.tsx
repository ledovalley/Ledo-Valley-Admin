"use client";

import { useMemo, useState } from "react";
import api from "@/lib/api";
import { AdminProduct } from "@/app/admin/products/page";
import ProductStatusBadge from "./ProductStatusBadge";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { Eye, Trash2, Power, Package2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

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
  const { success, error: showError } = useToast();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminProduct | null>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [products]);

  const toggleStatus = async (product: AdminProduct) => {
    try {
      setBusyId(product._id);
      await api.put(`/admin/products/${product._id}/toggle`);
      success(
        product.status === "ACTIVE"
          ? "Product moved out of active state."
          : "Product activated successfully."
      );
      onRefresh();
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async () => {
    if (!deleteTarget) return;

    try {
      setBusyId(deleteTarget._id);
      await api.delete(`/admin/products/${deleteTarget._id}`);
      success("Product deleted successfully.");
      setDeleteTarget(null);
      onRefresh();
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-bg-dark/10 bg-bg-surface">
        <div className="border-b border-bg-dark/10 px-6 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-bg-dark/5" />
        </div>
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-bg-dark/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-dark/5">
          <Package2 className="h-5 w-5 text-text-secondary" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-text-primary">
          No matching products
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          Try adjusting your search or filter settings.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-bg-dark/10 bg-bg-surface">
        <div className="flex flex-col gap-3 border-b border-bg-dark/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
              Product List
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Review status, variants, and quick actions for each product.
            </p>
          </div>

          <div className="text-xs text-text-secondary">
            {products.length} result{products.length > 1 ? "s" : ""}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead className="bg-bg-dark/5">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Variants</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedProducts.map((p) => {
                const busy = busyId === p._id;
                const isDraft = p.status === "DRAFT";

                return (
                  <tr
                    key={p._id}
                    className={`border-t border-bg-dark/10 transition ${busy ? "opacity-60" : "hover:bg-bg-dark/5"
                      }`}
                  >
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-text-primary">
                            {p.name}
                          </span>

                          {p.featured && (
                            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700">
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.tags?.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-bg-dark/10 px-2.5 py-1 text-[11px] text-text-secondary"
                            >
                              {tag}
                            </span>
                          ))}

                          {p.tags?.length > 3 && (
                            <span className="px-1 text-[11px] text-text-secondary">
                              +{p.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-text-primary">
                        {p.variantCount}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <ProductStatusBadge status={p.status} />
                    </td>

                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <button
                            disabled={busy}
                            onClick={() => onEdit(p._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-bg-dark/10 px-3 py-2 text-xs font-medium text-text-primary transition hover:bg-bg-dark/5 disabled:cursor-not-allowed"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        )}

                        {!isDraft ? (
                          <button
                            disabled={busy}
                            onClick={() => toggleStatus(p)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/20 px-3 py-2 text-xs font-medium text-brand-primary transition hover:bg-brand-primary/5 disabled:cursor-not-allowed"
                          >
                            <Power className="h-3.5 w-3.5" />
                            {p.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-bg-dark/5 px-3 py-2 text-xs font-medium text-text-secondary">
                            Draft
                          </span>
                        )}

                        <button
                          disabled={busy}
                          onClick={() => setDeleteTarget(p)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete product?"
        description={
          deleteTarget
            ? `This will permanently delete ${deleteTarget.name}. This action cannot be undone.`
            : ""
        }
        confirmText="Delete"
        cancelText="Cancel"
        tone="danger"
        loading={busyId === deleteTarget?._id}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteProduct}
      />
    </>
  );
}