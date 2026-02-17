"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductsTable from "@/components/admin/products/ProductsTable";
import CreateProductModal from "@/components/admin/products/CreateProductModal";

/* =====================
   Types (match backend)
===================== */
export interface AdminProduct {
    _id: string;
    name: string;
    status: "DRAFT" | "ACTIVE" | "INACTIVE";
    featured: boolean;
    tags: string[];
    variantCount: number;
    createdAt: string;
}

export default function ProductsPage() {
    const router = useRouter();

    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    /* =====================
       Fetch products
    ===================== */
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/products");
            setProducts(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    /* =====================
       Stats
    ===================== */
    const activeCount = products.filter(
        (p) => p.status === "ACTIVE"
    ).length;

    const draftCount = products.filter(
        (p) => p.status === "DRAFT"
    ).length;

    const featuredCount = products.filter(
        (p) => p.featured
    ).length;

    return (
        <div className="space-y-6">
            {/* ================= HEADER ================= */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-playfair text-(--color-text-primary)">
                        Products
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Manage your catalog, variants and availability
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchProducts}
                        className="
              px-4 py-2 text-sm border rounded-lg
              hover:bg-(--color-bg-surface)
              transition
            "
                    >
                        Refresh
                    </button>

                    <button
                        onClick={() => setOpen(true)}
                        className="
              px-5 py-2.5 rounded-lg
              bg-(--color-brand-primary)
              text-white
              hover:opacity-90
              transition
            "
                    >
                        + Add Product
                    </button>
                </div>
            </div>

            {/* ================= STATS ================= */}
            <div className="grid grid-cols-4 gap-4">
                <div className="border rounded-xl p-4 bg-white">
                    <div className="text-sm text-text-secondary">
                        Total Products
                    </div>
                    <div className="text-2xl font-medium mt-1">
                        {products.length}
                    </div>
                </div>

                <div className="border rounded-xl p-4 bg-white">
                    <div className="text-sm text-text-secondary">
                        Active
                    </div>
                    <div className="text-2xl font-medium text-green-700 mt-1">
                        {activeCount}
                    </div>
                </div>

                <div className="border rounded-xl p-4 bg-white">
                    <div className="text-sm text-text-secondary">
                        Drafts
                    </div>
                    <div className="text-2xl font-medium text-yellow-700 mt-1">
                        {draftCount}
                    </div>
                </div>

                <div className="border rounded-xl p-4 bg-white">
                    <div className="text-sm text-text-secondary">
                        Featured
                    </div>
                    <div className="text-2xl font-medium text-purple-700 mt-1">
                        {featuredCount}
                    </div>
                </div>
            </div>

            {/* ================= TABLE ================= */}
            <ProductsTable
                products={products}
                loading={loading}
                onRefresh={fetchProducts}
                onEdit={(productId) =>
                    router.push(`/admin/products/${productId}`)
                }
            />

            {/* ================= MODAL ================= */}
            <CreateProductModal
                open={open}
                onClose={() => setOpen(false)}
                onCreated={fetchProducts}
            />
        </div>
    );
}
