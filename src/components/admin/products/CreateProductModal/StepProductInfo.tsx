"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";

const TEA_TYPES = [
  "Black Tea",
  "Green Tea",
  "Organic Tea",
  "Speciality Tea",
];

const TAG_OPTIONS = [
  "TOP_SELLER",
  "BEST_SELLER",
  "NEW_LAUNCH",
  "LIMITED_EDITION",
  "ORGANIC",
  "SEASONAL",
] as const;

interface InitialData {
  name: string;
  sku: string;
  teaType: string;
  description?: string;
  bestFor: string[];
  tags?: string[];
  featured?: boolean;
}

interface Props {
  mode?: "create" | "edit";
  productId?: string;
  initialData?: InitialData;
  onSuccess: (productId?: string) => void;
}

export default function StepProductInfo({
  mode = "create",
  productId,
  initialData,
  onSuccess,
}: Props) {
  const isEdit = mode === "edit";

  /* -------------------------------
     State
  -------------------------------- */
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [teaType, setTeaType] = useState("");
  const [description, setDescription] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------
     Prefill on edit
  -------------------------------- */
  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.name);
      setSku(initialData.sku);

      setTeaType(
        TEA_TYPES.includes(initialData.teaType)
          ? initialData.teaType
          : ""
      );

      setDescription(initialData.description || "");
      setBestFor(initialData.bestFor.join(", "));
      setTags(initialData.tags || []);
      setFeatured(Boolean(initialData.featured));
    }
  }, [isEdit, initialData]);

  /* -------------------------------
     Validation
  -------------------------------- */
  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!isEdit && !sku.trim()) return false;
    if (!TEA_TYPES.includes(teaType)) return false;
    return true;
  }, [name, sku, teaType, isEdit]);

  /* -------------------------------
     Submit
  -------------------------------- */
  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        teaType,
        bestFor: bestFor
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        tags,
        featured,
      };

      if (isEdit && productId) {
        await api.put(`/admin/products/${productId}`, payload);
        onSuccess();
      } else {
        const res = await api.post("/admin/products", {
          ...payload,
          sku: sku.trim().toUpperCase(),
          status: "DRAFT",
        });
        onSuccess(res.data._id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     UI
  -------------------------------- */
  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Product Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2.5 border rounded-lg"
        />
      </div>

      {/* SKU + Featured */}
      <div className="grid grid-cols-2 gap-4">
        {!isEdit ? (
          <div>
            <label className="block text-sm font-medium mb-1">
              SKU
            </label>
            <input
              value={sku}
              onChange={(e) =>
                setSku(e.target.value.toUpperCase())
              }
              className="w-full px-4 py-2.5 border rounded-lg font-mono"
            />
          </div>
        ) : (
          <div />
        )}

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) =>
              setFeatured(e.target.checked)
            }
          />
          Featured product
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          className="w-full px-4 py-2.5 border rounded-lg resize-none"
        />
      </div>

      {/* Tea Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tea Type
          </label>
          <select
            value={teaType}
            onChange={(e) =>
              setTeaType(e.target.value)
            }
            className="w-full px-4 py-2.5 border rounded-lg bg-white"
          >
            <option value="">Select</option>
            {TEA_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div />
      </div>

      {/* Best For */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Best For
        </label>
        <input
          value={bestFor}
          onChange={(e) =>
            setBestFor(e.target.value)
          }
          placeholder="Digestion, immunity"
          className="w-full px-4 py-2.5 border rounded-lg"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  )
                }
                className={`px-3 py-1 text-xs rounded-full border ${active
                  ? "bg-(--color-brand-primary) text-white border-(--color-brand-primary)"
                  : "bg-white"
                  }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Draft note */}
      {!isEdit && (
        <div className="text-xs bg-(--color-bg-surface) px-4 py-2 rounded-lg text-text-secondary">
          Product will be saved as a <b>draft</b> until variants are added and published.
        </div>
      )}

      {/* Action */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="px-6 py-2.5 rounded-lg bg-(--color-brand-primary) text-white disabled:opacity-50"
        >
          {loading
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save Changes"
              : "Continue"}
        </button>
      </div>
    </div>
  );
}
