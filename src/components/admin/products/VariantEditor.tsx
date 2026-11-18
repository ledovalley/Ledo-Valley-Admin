"use client";

import { useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { Loader2 } from "lucide-react";

export interface EditableVariant {
    _id: string;
    variantSku: string;
    weight: { value: number; unit: string };
    costPrice?: number;
    sellingPrice?: number;
    discount?: { type?: "PERCENT" | "FLAT"; value?: number };
    finalPrice: number;
    stock: number;
    status: "ACTIVE" | "INACTIVE";
}

interface Props {
    productId: string;
    variant: EditableVariant;
    onSaved: () => void;
    onCancel: () => void;
}

const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10";

const toNum = (v: string) => (v === "" ? "" : Number(v));

export default function VariantEditor({ productId, variant, onSaved, onCancel }: Props) {
    const [stock, setStock] = useState<number | "">(variant.stock ?? 0);
    const [weightValue, setWeightValue] = useState<number | "">(variant.weight?.value ?? "");
    const [weightUnit, setWeightUnit] = useState<"g" | "kg">(variant.weight?.unit === "kg" ? "kg" : "g");
    const [costPrice, setCostPrice] = useState<number | "">(variant.costPrice ?? "");
    const [sellingPrice, setSellingPrice] = useState<number | "">(variant.sellingPrice ?? variant.finalPrice ?? "");
    const [discountType, setDiscountType] = useState<"PERCENT" | "FLAT">(variant.discount?.type === "FLAT" ? "FLAT" : "PERCENT");
    const [discountValue, setDiscountValue] = useState<number | "">(variant.discount?.value ?? 0);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const finalPrice = useMemo(() => {
        const sp = Number(sellingPrice || 0);
        const dv = Number(discountValue || 0);
        const fp = discountType === "PERCENT" ? sp - (sp * dv) / 100 : sp - dv;
        return Math.max(Math.round(fp * 100) / 100, 0);
    }, [sellingPrice, discountType, discountValue]);

    const problem = useMemo(() => {
        if (stock === "" || stock < 0) return "Stock can't be empty or negative.";
        if (!weightValue || weightValue <= 0) return "Enter the pack weight.";
        if (sellingPrice === "" || sellingPrice <= 0) return "Enter a selling price.";
        if (costPrice === "" || costPrice < 0) return "Enter the cost price.";
        if (discountType === "PERCENT" && Number(discountValue || 0) > 100) return "Percent discount can't be over 100.";
        if (discountType === "FLAT" && Number(discountValue || 0) > Number(sellingPrice)) return "Flat discount can't be more than the selling price.";
        return null;
    }, [stock, weightValue, sellingPrice, costPrice, discountType, discountValue]);

    const save = async () => {
        if (problem) {
            setError(problem);
            return;
        }
        try {
            setSaving(true);
            setError(null);
            await api.put(`/admin/products/${productId}/variants/${variant._id}`, {
                stock: Number(stock),
                weight: { value: Number(weightValue), unit: weightUnit },
                costPrice: Number(costPrice),
                sellingPrice: Number(sellingPrice),
                discount: { type: discountType, value: Number(discountValue || 0) },
            });
            onSaved();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const margin = Number(costPrice || 0) > 0 ? finalPrice - Number(costPrice) : null;

    return (
        <div className="mt-3 space-y-3 rounded-xl border border-(--color-brand-primary)/30 bg-(--color-brand-primary)/5 p-3">
            <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-medium text-gray-700">
                    Stock
                    <input type="number" min={0} value={stock} onChange={(e) => setStock(toNum(e.target.value))} className={`mt-1 ${inputClass}`} />
                </label>
                <div className="text-xs font-medium text-gray-700">
                    Weight
                    <div className="mt-1 flex gap-1">
                        <input type="number" min={0} step="any" value={weightValue} onChange={(e) => setWeightValue(toNum(e.target.value))} className={inputClass} />
                        <select value={weightUnit} onChange={(e) => setWeightUnit(e.target.value as "g" | "kg")} className="rounded-lg border border-gray-300 bg-white px-2 text-sm">
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                        </select>
                    </div>
                </div>
                <label className="text-xs font-medium text-gray-700">
                    Cost price (₹)
                    <input type="number" min={0} value={costPrice} onChange={(e) => setCostPrice(toNum(e.target.value))} className={`mt-1 ${inputClass}`} />
                </label>
                <label className="text-xs font-medium text-gray-700">
                    Selling price / MRP (₹)
                    <input type="number" min={0} value={sellingPrice} onChange={(e) => setSellingPrice(toNum(e.target.value))} className={`mt-1 ${inputClass}`} />
                </label>
                <div className="col-span-2 text-xs font-medium text-gray-700">
                    Discount
                    <div className="mt-1 flex gap-1">
                        <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FLAT")} className="rounded-lg border border-gray-300 bg-white px-2 text-sm">
                            <option value="PERCENT">%</option>
                            <option value="FLAT">₹ off</option>
                        </select>
                        <input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(toNum(e.target.value))} className={inputClass} />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                <span className="text-gray-500">Customer pays</span>
                <span className="font-semibold text-gray-900">
                    ₹{finalPrice}
                    {margin !== null && (
                        <span className={`ml-2 text-xs font-medium ${margin < 0 ? "text-red-600" : "text-gray-500"}`}>
                            margin ₹{Math.round(margin * 100) / 100}
                        </span>
                    )}
                </span>
            </div>

            <p className="text-xs text-gray-500">
                Weight is also sent to Shiprocket for courier charges, so enter the total pack weight
                (for 25 sachets of 1.3 g, enter 32.5 g plus packaging).
            </p>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

            <div className="flex justify-end gap-2">
                <button onClick={onCancel} disabled={saving} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-black/5 disabled:opacity-50">
                    Cancel
                </button>
                <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-(--color-brand-primary) px-4 py-1.5 text-sm font-semibold text-white hover:bg-(--color-brand-primary)/90 disabled:opacity-50"
                >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save variant
                </button>
            </div>
        </div>
    );
}
