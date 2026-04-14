"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import VariantImageUpload from "@/components/admin/products/VariantImagesUpload";
import {
    Package2,
    IndianRupee,
    Boxes,
    Scale,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ImagePlus,
    Sparkles,
} from "lucide-react";

interface Variant {
    _id: string;
    variantSku: string;
    weight: { value: number; unit: string };
    finalPrice: number;
    stock: number;
    status: "ACTIVE" | "INACTIVE";
}

interface Props {
    productId: string;
    onDone: () => void;
}

export default function StepAddVariants({
    productId,
    onDone,
}: Props) {
    const [variantSku, setVariantSku] = useState("");
    const [weightValue, setWeightValue] = useState<number | "">("");
    const [weightUnit, setWeightUnit] = useState<"g" | "kg">("g");
    const [sellingPrice, setSellingPrice] = useState<number | "">("");
    const [costPrice, setCostPrice] = useState<number | "">("");
    const [discountType, setDiscountType] =
        useState<"PERCENT" | "FLAT">("PERCENT");
    const [discountValue, setDiscountValue] =
        useState<number | "">("");
    const [images, setImages] = useState<File[]>([]);
    const [stock, setStock] = useState<number | "">("");

    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingVariants, setFetchingVariants] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchVariants = async () => {
        try {
            setFetchingVariants(true);
            const res = await api.get(`/admin/products/${productId}`);
            setVariants(res.data.variants || []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setFetchingVariants(false);
        }
    };

    useEffect(() => {
        fetchVariants();
    }, [productId]);

    const isFormValid = useMemo(() => {
        if (!variantSku.trim()) return false;
        if (stock === "" || Number.isNaN(stock) || stock < 0) return false;
        if (!weightValue || weightValue <= 0) return false;
        if (!sellingPrice || sellingPrice <= 0) return false;
        if (!costPrice || costPrice <= 0) return false;
        if (images.length > 4) return false;
        return true;
    }, [variantSku, stock, weightValue, sellingPrice, costPrice, images]);

    const finalPrice =
        typeof sellingPrice === "number"
            ? discountType === "PERCENT"
                ? Math.max(
                    sellingPrice -
                    (sellingPrice * Number(discountValue || 0)) / 100,
                    0
                )
                : Math.max(sellingPrice - Number(discountValue || 0), 0)
            : 0;

    const profit =
        typeof finalPrice === "number" && typeof costPrice === "number"
            ? Math.max(finalPrice - costPrice, 0)
            : 0;

    const totalStock = useMemo(
        () => variants.reduce((sum, v) => sum + v.stock, 0),
        [variants]
    );

    const activeVariants = useMemo(
        () => variants.filter((v) => v.status === "ACTIVE").length,
        [variants]
    );

    const resetForm = () => {
        setVariantSku("");
        setStock("");
        setWeightValue("");
        setWeightUnit("g");
        setSellingPrice("");
        setCostPrice("");
        setDiscountType("PERCENT");
        setDiscountValue("");
        setImages([]);
    };

    const handleAddVariant = async () => {
        if (!isFormValid) {
            setError("Please fill all required fields correctly.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const formData = new FormData();
            formData.append("variantSku", variantSku.toUpperCase());
            formData.append("stock", String(stock));
            formData.append(
                "weight",
                JSON.stringify({
                    value: weightValue,
                    unit: weightUnit,
                })
            );
            formData.append("sellingPrice", String(sellingPrice));
            formData.append("costPrice", String(costPrice));
            formData.append(
                "discount",
                JSON.stringify({
                    type: discountType,
                    value: Number(discountValue) || 0,
                })
            );

            images.slice(0, 4).forEach((img) => {
                formData.append("images", img);
            });

            await api.post(
                `/admin/products/${productId}/variants`,
                formData
            );

            resetForm();
            setSuccess("Variant added successfully.");
            fetchVariants();

            setTimeout(() => setSuccess(null), 2500);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const deleteVariant = async (variantId: string) => {
        const confirmed = window.confirm("Delete this variant?");
        if (!confirmed) return;

        try {
            setDeletingId(variantId);
            await api.delete(
                `/admin/products/${productId}/variants/${variantId}`
            );
            fetchVariants();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleAddVariant();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [
        variantSku,
        stock,
        weightValue,
        weightUnit,
        sellingPrice,
        costPrice,
        discountType,
        discountValue,
        images,
        isFormValid,
    ]);

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
            {/* LEFT */}
            <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-(--color-brand-primary)/10 p-2 text-(--color-brand-primary)">
                            <Package2 className="h-5 w-5" />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Add product variants
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Create pack sizes, pricing, stock, and images for this product.
                                Each variant becomes a purchasable option.
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
                        {success}
                    </div>
                )}

                {/* Variant details */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-(--color-brand-primary)" />
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                            Variant Details
                        </h4>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Variant SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={variantSku}
                                onChange={(e) =>
                                    setVariantSku(e.target.value.toUpperCase())
                                }
                                disabled={loading}
                                placeholder="LV-GREEN-100G"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm uppercase text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                            />
                            <p className="mt-1.5 text-xs text-gray-500">
                                Make this unique per size or pack configuration.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Stock <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="50"
                                    value={stock}
                                    onChange={(e) =>
                                        setStock(
                                            e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Weight <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    placeholder="100"
                                    value={weightValue}
                                    onChange={(e) =>
                                        setWeightValue(
                                            e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Unit
                                </label>
                                <select
                                    value={weightUnit}
                                    onChange={(e) =>
                                        setWeightUnit(e.target.value as "g" | "kg")
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                >
                                    <option value="g">Grams (g)</option>
                                    <option value="kg">Kilograms (kg)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-(--color-brand-primary)" />
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                            Pricing
                        </h4>
                    </div>

                    <div className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Cost Price <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="120"
                                    value={costPrice}
                                    onChange={(e) =>
                                        setCostPrice(
                                            e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Selling Price <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="199"
                                    value={sellingPrice}
                                    onChange={(e) =>
                                        setSellingPrice(
                                            e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Discount Type
                                </label>
                                <select
                                    value={discountType}
                                    onChange={(e) =>
                                        setDiscountType(
                                            e.target.value as "PERCENT" | "FLAT"
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                >
                                    <option value="PERCENT">Percent %</option>
                                    <option value="FLAT">Flat ₹</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                    Discount Value
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder={discountType === "PERCENT" ? "10" : "25"}
                                    value={discountValue}
                                    onChange={(e) =>
                                        setDiscountValue(
                                            e.target.value === "" ? "" : Number(e.target.value)
                                        )
                                    }
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Final Price
                                </div>
                                <div className="mt-2 text-2xl font-semibold text-gray-900">
                                    ₹{finalPrice}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Margin
                                </div>
                                <div className="mt-2 text-2xl font-semibold text-gray-900">
                                    ₹{profit}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                <div className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    Discount
                                </div>
                                <div className="mt-2 text-2xl font-semibold text-gray-900">
                                    {Number(discountValue || 0)}
                                    {discountType === "PERCENT" ? "%" : ""}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Images */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                        <ImagePlus className="h-4 w-4 text-(--color-brand-primary)" />
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                            Variant Images
                        </h4>
                    </div>

                    <VariantImageUpload
                        images={images}
                        onChange={setImages}
                        max={4}
                    />

                    <p className="mt-3 text-xs text-gray-500">
                        Upload up to 4 images for this variant. Clear images improve catalog quality.
                    </p>
                </section>

                {/* Footer action */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-gray-500">
                            Add quickly with <span className="font-medium text-gray-700">Ctrl/Cmd + Enter</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onDone}
                                disabled={variants.length === 0}
                                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Review Product
                            </button>

                            <button
                                onClick={handleAddVariant}
                                disabled={!isFormValid || loading}
                                className="inline-flex items-center justify-center rounded-xl bg-(--color-brand-primary) px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--color-brand-primary)/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Adding…" : "Add Variant"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <aside className="self-start xl:sticky">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-(--color-brand-primary)" />
                            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                                Variant Summary
                            </h4>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <div className="text-xs text-gray-400">Total</div>
                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                    {variants.length}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <div className="text-xs text-gray-400">Active</div>
                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                    {activeVariants}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <div className="text-xs text-gray-400">Stock</div>
                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                    {totalStock}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-500">
                            Add at least one variant before moving to the review step.
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900">
                                Variants Added
                            </h4>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                {variants.length}
                            </span>
                        </div>

                        {fetchingVariants ? (
                            <div className="text-sm text-gray-500">Loading variants...</div>
                        ) : variants.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                                <p className="text-sm font-medium text-gray-700">
                                    No variants added yet
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Create your first size or pack option from the form.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {variants.map((v) => (
                                    <div
                                        key={v._id}
                                        className="rounded-2xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-semibold text-gray-900">
                                                    {v.variantSku}
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500">
                                                    {v.weight.value}
                                                    {v.weight.unit} • ₹{v.finalPrice}
                                                </div>

                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600">
                                                        Stock: {v.stock}
                                                    </span>

                                                    <span
                                                        className={`rounded-full px-2 py-1 text-[10px] font-medium ${v.status === "ACTIVE"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-gray-200 text-gray-600"
                                                            }`}
                                                    >
                                                        {v.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteVariant(v._id)}
                                                disabled={deletingId === v._id}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                aria-label={`Delete ${v.variantSku}`}
                                                title="Delete variant"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {variants.length > 0 && (
                        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                                <div>
                                    <p className="font-medium">Ready for review</p>
                                    <p className="mt-1 text-xs text-green-700">
                                        You can continue once you’re satisfied with the variant setup.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {variants.length === 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4" />
                                <div>
                                    <p className="font-medium">At least one variant required</p>
                                    <p className="mt-1 text-xs text-amber-700">
                                        Add a purchasable option before proceeding to review.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}