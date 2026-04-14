"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductsTable from "@/components/admin/products/ProductsTable";
import CreateProductModal from "@/components/admin/products/CreateProductModal";
import { getErrorMessage } from "@/lib/getErrorMessage";
import {
    Package2,
    CheckCircle2,
    FileText,
    Star,
    RefreshCw,
    Plus,
    Search,
} from "lucide-react";

/* =====================
   Types
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

function StatCard({
    label,
    value,
    icon,
    tone = "default",
}: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    tone?: "default" | "success" | "warning" | "accent";
}) {
    const valueClass =
        tone === "success"
            ? "text-green-700"
            : tone === "warning"
                ? "text-yellow-700"
                : tone === "accent"
                    ? "text-brand-primary"
                    : "text-text-primary";

    return (
        <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-text-secondary">
                {icon}
                <span>{label}</span>
            </div>
            <div className={`mt-3 text-2xl font-medium ${valueClass}`}>
                {value}
            </div>
        </div>
    );
}

export default function ProductsPage() {
    const router = useRouter();

    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "ALL" | "DRAFT" | "ACTIVE" | "INACTIVE"
    >("ALL");
    const [featuredFilter, setFeaturedFilter] = useState<
        "ALL" | "FEATURED" | "NOT_FEATURED"
    >("ALL");

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get("/admin/products");
            setProducts(res.data);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const stats = useMemo(() => {
        const activeCount = products.filter(
            (p) => p.status === "ACTIVE"
        ).length;

        const draftCount = products.filter(
            (p) => p.status === "DRAFT"
        ).length;

        const featuredCount = products.filter(
            (p) => p.featured
        ).length;

        return {
            total: products.length,
            activeCount,
            draftCount,
            featuredCount,
        };
    }, [products]);

    const filteredProducts = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return products.filter((product) => {
            const matchesQuery =
                !normalizedQuery ||
                product.name.toLowerCase().includes(normalizedQuery) ||
                product.tags?.some((tag) =>
                    tag.toLowerCase().includes(normalizedQuery)
                );

            const matchesStatus =
                statusFilter === "ALL" || product.status === statusFilter;

            const matchesFeatured =
                featuredFilter === "ALL" ||
                (featuredFilter === "FEATURED" && product.featured) ||
                (featuredFilter === "NOT_FEATURED" && !product.featured);

            return matchesQuery && matchesStatus && matchesFeatured;
        });
    }, [products, query, statusFilter, featuredFilter]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="rounded-3xl border border-bg-dark/10 bg-bg-surface p-6 md:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-text-secondary">
                            Catalog Management
                        </div>
                        <h1 className="text-3xl font-playfair text-text-primary md:text-4xl">
                            Products
                        </h1>
                        <p className="mt-2 text-sm text-text-secondary">
                            Manage your catalog, variants, and product availability.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={fetchProducts}
                            className="inline-flex items-center gap-2 rounded-xl border border-bg-dark/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-dark/5"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>

                        <button
                            onClick={() => setOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
                        >
                            <Plus className="h-4 w-4" />
                            Add Product
                        </button>
                    </div>
                </div>
            </section>

            {/* Error */}
            {error && (
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-warning">
                    {error}
                </div>
            )}

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total Products"
                    value={stats.total}
                    icon={<Package2 className="h-4 w-4" />}
                />
                <StatCard
                    label="Active"
                    value={stats.activeCount}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    tone="success"
                />
                <StatCard
                    label="Drafts"
                    value={stats.draftCount}
                    icon={<FileText className="h-4 w-4" />}
                    tone="warning"
                />
                <StatCard
                    label="Featured"
                    value={stats.featuredCount}
                    icon={<Star className="h-4 w-4" />}
                    tone="accent"
                />
            </section>

            {/* Filters */}
            <section className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-4 md:p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by product name or tag"
                                className="w-full rounded-xl border border-bg-dark/10 bg-white py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-text-secondary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as
                                    | "ALL"
                                    | "DRAFT"
                                    | "ACTIVE"
                                    | "INACTIVE"
                                )
                            }
                            className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFT">Draft</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-text-primary">
                            Featured
                        </label>
                        <select
                            value={featuredFilter}
                            onChange={(e) =>
                                setFeaturedFilter(
                                    e.target.value as
                                    | "ALL"
                                    | "FEATURED"
                                    | "NOT_FEATURED"
                                )
                            }
                            className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                        >
                            <option value="ALL">All products</option>
                            <option value="FEATURED">Featured only</option>
                            <option value="NOT_FEATURED">Not featured</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setStatusFilter("ALL");
                                setFeaturedFilter("ALL");
                            }}
                            className="w-full rounded-xl border border-bg-dark/10 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-bg-dark/5"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            </section>

            <ProductsTable
                products={filteredProducts}
                loading={loading}
                onRefresh={fetchProducts}
                onEdit={(productId) =>
                    router.push(`/admin/products/${productId}`)
                }
            />

            <CreateProductModal
                open={open}
                onClose={() => setOpen(false)}
                onCreated={fetchProducts}
            />
        </div>
    );
}