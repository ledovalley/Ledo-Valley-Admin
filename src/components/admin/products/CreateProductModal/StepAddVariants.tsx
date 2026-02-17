"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import VariantImageUpload from "@/components/admin/products/VariantImagesUpload";

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
    /* ---------------------------
       Form state
    --------------------------- */
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

    /* ---------------------------
       Data state
    --------------------------- */
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [stock, setStock] = useState<number | "">("");

    /* ---------------------------
       Fetch variants
    --------------------------- */
    const fetchVariants = async () => {
        const res = await api.get(`/admin/products/${productId}`);
        setVariants(res.data.variants || []);
    };

    useEffect(() => {
        fetchVariants();
    }, []);

    /* ---------------------------
       Derived state
    --------------------------- */
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
                    (sellingPrice *
                        Number(discountValue || 0)) /
                    100,
                    0
                )
                : Math.max(
                    sellingPrice - Number(discountValue || 0),
                    0
                )
            : 0;

    /* ---------------------------
       Add Variant
    --------------------------- */
    const handleAddVariant = async () => {
        if (!isFormValid) {
            setError("Please fill all required fields correctly");
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

            images.slice(0, 4).forEach((img) =>
                formData.append("images", img)
            );

            await api.post(
                `/admin/products/${productId}/variants`,
                formData
            );

            /* Reset */
            setVariantSku("");
            setStock("");
            setWeightValue("");
            setSellingPrice("");
            setCostPrice("");
            setDiscountValue("");
            setImages([]);

            setSuccess("Variant added successfully");
            fetchVariants();

            setTimeout(() => setSuccess(null), 2500);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------
       Delete Variant
    --------------------------- */
    const deleteVariant = async (variantId: string) => {
        if (!confirm("Delete this variant?")) return;
        await api.delete(
            `/admin/products/${productId}/variants/${variantId}`
        );
        fetchVariants();
    };

    /* ---------------------------
       UI
    --------------------------- */
    return (
        <div className="grid grid-cols-5 gap-6">
            {/* ================= LEFT ================= */}
            <div className="col-span-3 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 rounded-md">
                        {success}
                    </div>
                )}

                <div>
                    <h3 className="text-sm font-medium mb-3">
                        Variant Details
                    </h3>

                    <input
                        value={variantSku}
                        onChange={(e) =>
                            setVariantSku(e.target.value.toUpperCase())
                        }
                        disabled={loading}
                        className="w-full px-4 py-2.5 border rounded-lg font-mono"
                        placeholder="LV-GREEN-100G"
                    />
                </div>

                {/* Weight */}
                <div className="grid grid-cols-3 gap-3">
                    <input
                        type="number"
                        min={0}
                        placeholder="Stock"
                        value={stock}
                        onChange={(e) =>
                            setStock(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="px-4 py-2.5 border rounded-lg"
                    />
                    <input
                        type="number"
                        min={1}
                        placeholder="Weight"
                        value={weightValue}
                        onChange={(e) =>
                            setWeightValue(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
                        className="px-4 py-2.5 border rounded-lg"
                    />
                    <select
                        value={weightUnit}
                        onChange={(e) =>
                            setWeightUnit(e.target.value as "g" | "kg")
                        }
                        className="px-4 py-2.5 border rounded-lg bg-white"
                    >
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                    </select>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="number"
                        min={0}
                        placeholder="Cost Price"
                        value={costPrice}
                        onChange={(e) =>
                            setCostPrice(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
                        className="px-4 py-2.5 border rounded-lg"
                    />

                    <input
                        type="number"
                        min={0}
                        placeholder="Selling Price"
                        value={sellingPrice}
                        onChange={(e) =>
                            setSellingPrice(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
                        className="px-4 py-2.5 border rounded-lg"
                    />
                </div>

                {/* Discount */}
                <div className="grid grid-cols-2 gap-3">
                    <select
                        value={discountType}
                        onChange={(e) =>
                            setDiscountType(
                                e.target.value as "PERCENT" | "FLAT"
                            )
                        }
                        className="px-4 py-2.5 border rounded-lg bg-white"
                    >
                        <option value="PERCENT">Percent %</option>
                        <option value="FLAT">Flat</option>
                    </select>

                    <input
                        type="number"
                        min={0}
                        placeholder="Discount"
                        value={discountValue}
                        onChange={(e) =>
                            setDiscountValue(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
                        className="px-4 py-2.5 border rounded-lg"
                    />
                </div>

                <div className="bg-(--color-bg-surface) px-4 py-2 rounded-md text-sm">
                    Final Price:{" "}
                    <span className="font-semibold">
                        ₹{finalPrice}
                    </span>
                </div>

                {/* Images */}
                <VariantImageUpload
                    images={images}
                    onChange={setImages}
                    max={4}
                />

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                    <button
                        onClick={handleAddVariant}
                        disabled={!isFormValid || loading}
                        className="px-5 py-2.5 rounded-lg bg-(--color-brand-primary) text-white disabled:opacity-50"
                    >
                        {loading ? "Adding…" : "Add Variant"}
                    </button>

                    <button
                        onClick={onDone}
                        disabled={variants.length === 0}
                        className="px-4 py-2 text-sm border rounded-lg hover:bg-(--color-bg-surface)"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* ================= RIGHT ================= */}
            <div className="col-span-2 sticky top-4 self-start">
                <div className="text-sm font-medium mb-2">
                    Variants Added ({variants.length})
                </div>

                {variants.length === 0 ? (
                    <div className="text-sm text-text-secondary">
                        No variants added yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {variants.map((v) => (
                            <div
                                key={v._id}
                                className="border rounded-lg p-3 flex justify-between hover:bg-gray-50"
                            >
                                <div>
                                    <div className="font-medium text-sm">
                                        {v.variantSku}
                                    </div>
                                    <div className="text-xs text-text-secondary">
                                        {v.weight.value}{v.weight.unit} • ₹{v.finalPrice}
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-text-secondary">
                                            Stock: {v.stock}
                                        </span>

                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full ${v.status === "ACTIVE"
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
                                    className="text-xs text-red-600 hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
