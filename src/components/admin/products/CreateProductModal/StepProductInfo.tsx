"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import RichTextEditor from "../RichTextEditor";
import {
  Sparkles,
  Tag as TagIcon,
  Package2,
  Leaf,
  FileText,
  Star,
  Info,
} from "lucide-react";

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

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [teaType, setTeaType] = useState("");
  const [description, setDescription] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (!isEdit && !sku.trim()) return false;
    if (!TEA_TYPES.includes(teaType)) return false;
    return true;
  }, [name, sku, teaType, isEdit]);

  const bestForItems = useMemo(
    () =>
      bestFor
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [bestFor]
  );

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        teaType,
        bestFor: bestForItems,
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [name, sku, teaType, description, bestFor, tags, featured, isValid]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Intro */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-(--color-brand-primary)">
              <Package2 className="h-4 w-4" />
              Product details
            </div>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">
              {isEdit ? "Edit product information" : "Create a new tea product"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add the core product details first. You can add variants, pricing,
              and publish settings in the next steps.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-right sm:block">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Completion
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {isValid ? "Ready" : "Incomplete"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      )}

      {/* Basic info */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-(--color-brand-primary)" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Basic Information
          </h4>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-800">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="Example: Himalayan Green Tea"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Use a clear catalog name customers and admins can quickly identify.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {!isEdit ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  disabled={loading}
                  placeholder="HGT-001"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm uppercase text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  SKU should be unique and easy to search later.
                </p>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-800">
                  SKU
                </label>
                <div className="flex h-11.5 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 font-mono text-sm text-gray-500">
                  {sku || "SKU locked in edit mode"}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Tea Type <span className="text-red-500">*</span>
              </label>
              <select
                value={teaType}
                onChange={(e) => setTeaType(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">Select tea type</option>
                {TEA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                This helps categorize the product correctly in your catalog.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-(--color-brand-primary)" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Description
          </h4>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-800">
            Product Description
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
          />
          <p className="mt-2 text-xs text-gray-500">
            Add tasting notes, origin, ingredients, brewing suggestions, or key highlights.
          </p>
        </div>
      </section>

      {/* Catalog metadata */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Leaf className="h-4 w-4 text-(--color-brand-primary)" />
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Catalog Metadata
          </h4>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-800">
                Best For
              </label>
              <input
                value={bestFor}
                onChange={(e) => setBestFor(e.target.value)}
                disabled={loading}
                placeholder="Digestion, immunity, stress relief"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-400 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Separate multiple values with commas.
              </p>

              {bestForItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {bestForItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => {
                  const active = tags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-all ${active
                        ? "border-(--color-brand-primary) bg-(--color-brand-primary) text-white shadow-sm"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <TagIcon className="h-3.5 w-3.5" />
                      {tag.replaceAll("_", " ")}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Use tags to highlight seasonal or promotional characteristics.
              </p>
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                  <Star className="h-4 w-4" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Featured product
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        Mark this product for special placement in featured sections or curated collections.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setFeatured((prev) => !prev)}
                      aria-pressed={featured}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${featured
                        ? "bg-(--color-brand-primary)"
                        : "bg-gray-300"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${featured ? "translate-x-6" : "translate-x-1"
                          }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Sparkles className="h-3.5 w-3.5 text-(--color-brand-primary)" />
                      Status:
                      <span className="font-semibold text-gray-900">
                        {featured ? "Featured" : "Standard"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!isEdit && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Draft workflow
                    </p>
                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      The product will be created as a draft first. You’ll add variants and review everything before publishing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer actions */}
      <div className="sticky bottom-0 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            {(isEdit ? "Save changes" : "Continue to variants")} with
            {" "}
            <span className="font-medium text-gray-700">Ctrl/Cmd + Enter</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-sm text-gray-500 sm:block">
              {isValid ? "All required fields are filled" : "Fill required fields to continue"}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="inline-flex items-center justify-center rounded-xl bg-(--color-brand-primary) px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-(--color-brand-primary)/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
            >
              {loading
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save Changes"
                  : "Continue to Variants"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}