"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/api";
import Image from "next/image";
import {
    Trash2,
    Eye,
    EyeOff,
    ImagePlus,
    Loader2,
    Sparkles,
    BadgePlus,
    LayoutTemplate,
} from "lucide-react";

interface Banner {
    _id: string;
    image: {
        url: string;
    };
    title?: string;
    subtitle?: string;
    isActive: boolean;
}

export default function AdminShopBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");

    const fetchBanners = async () => {
        try {
            const { data } = await axios.get("/admin/shop-banner");
            setBanners(data);
        } catch (error) {
            console.error("FETCH ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        setImageFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const createBanner = async () => {
        if (!imageFile) return alert("Select image");

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("title", title);
        formData.append("subtitle", subtitle);

        try {
            setUploading(true);

            await axios.post("/admin/shop-banner", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setImageFile(null);
            setPreview(null);
            setTitle("");
            setSubtitle("");

            fetchBanners();
        } catch (error) {
            console.error("CREATE ERROR:", error);
        } finally {
            setUploading(false);
        }
    };

    const deleteBanner = async (id: string) => {
        if (!confirm("Delete banner?")) return;

        await axios.delete(`/admin/shop-banner/${id}`);
        fetchBanners();
    };

    const toggleBanner = async (id: string) => {
        await axios.patch(`/admin/shop-banner/${id}/toggle`);
        fetchBanners();
    };

    const stats = useMemo(() => {
        return {
            total: banners.length,
            active: banners.filter((b) => b.isActive).length,
            inactive: banners.filter((b) => !b.isActive).length,
        };
    }, [banners]);

    return (
        <div className="min-h-screen space-y-8 p-6 md:p-8">
            <div className="flex flex-col gap-4 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary md:text-3xl">
                        Shop Banner Manager
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Upload, preview, and manage homepage banners.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <StatPill
                        icon={<LayoutTemplate className="h-4 w-4" />}
                        label="Total"
                        value={stats.total}
                    />
                    <StatPill
                        icon={<Sparkles className="h-4 w-4" />}
                        label="Active"
                        value={stats.active}
                    />
                    <StatPill
                        icon={<BadgePlus className="h-4 w-4" />}
                        label="Inactive"
                        value={stats.inactive}
                    />
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
                <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">
                            Create Banner
                        </h2>
                        <p className="mt-1 text-sm text-text-secondary">
                            Add a new banner image with optional title and subtitle.
                        </p>
                    </div>

                    <div className="mt-6 space-y-5">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-text-primary">
                                Banner Image
                            </span>

                            <div className="relative overflow-hidden rounded-3xl border border-dashed border-black/15 bg-bg-surface p-4 transition hover:border-brand-primary/30 hover:bg-brand-primary/5">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                />

                                <div className="flex min-h-44 flex-col items-center justify-center text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                        <ImagePlus className="h-5 w-5 text-text-secondary" />
                                    </div>
                                    <p className="mt-4 text-sm font-medium text-text-primary">
                                        Click to upload banner image
                                    </p>
                                    <p className="mt-1 text-xs text-text-secondary">
                                        Recommended wide image for homepage hero banners
                                    </p>
                                </div>
                            </div>
                        </label>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">
                                Banner Title
                            </label>
                            <input
                                placeholder="Big summer sale"
                                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">
                                Subtitle
                            </label>
                            <textarea
                                placeholder="Save more on selected collections this week."
                                rows={3}
                                className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/70 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={createBanner}
                            disabled={!imageFile || uploading}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <ImagePlus className="h-4 w-4" />
                                    Upload Banner
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Live Preview
                                </h2>
                                <p className="mt-1 text-sm text-text-secondary">
                                    See how the next banner will appear before publishing.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-black/10 bg-bg-surface">
                            <div className="relative aspect-16/7 w-full">
                                {preview ? (
                                    <Image
                                        src={preview}
                                        alt="Banner preview"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-bg-surface text-sm text-text-secondary">
                                        Upload an image to preview your banner
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                    <div className="max-w-xl">
                                        <p className="text-2xl font-semibold">
                                            {title || "Your banner title"}
                                        </p>
                                        <p className="mt-2 text-sm text-white/85">
                                            {subtitle || "Your banner subtitle will appear here."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-black/10 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Existing Banners
                                </h2>
                                <p className="mt-1 text-sm text-text-secondary">
                                    Toggle visibility or remove outdated banners.
                                </p>
                            </div>
                            <div className="text-xs text-text-secondary">
                                {banners.length} total
                            </div>
                        </div>

                        <div className="p-5">
                            {loading ? (
                                <div className="grid gap-5 md:grid-cols-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="overflow-hidden rounded-3xl border border-black/10"
                                        >
                                            <div className="aspect-16/10 animate-pulse bg-black/5" />
                                            <div className="space-y-3 p-4">
                                                <div className="h-4 w-2/3 animate-pulse rounded bg-black/5" />
                                                <div className="h-3 w-full animate-pulse rounded bg-black/5" />
                                                <div className="h-3 w-1/2 animate-pulse rounded bg-black/5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : banners.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-black/10 bg-bg-surface px-6 py-14 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                        <ImagePlus className="h-5 w-5 text-text-secondary" />
                                    </div>
                                    <h3 className="mt-4 text-base font-semibold text-text-primary">
                                        No banners yet
                                    </h3>
                                    <p className="mt-1 text-sm text-text-secondary">
                                        Upload your first homepage banner to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2">
                                    {banners.map((banner) => (
                                        <div
                                            key={banner._id}
                                            className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                                        >
                                            <div className="relative aspect-16/10 w-full overflow-hidden">
                                                <Image
                                                    src={banner.image.url}
                                                    alt={banner.title || "Shop banner"}
                                                    fill
                                                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                                                />

                                                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />

                                                <div className="absolute left-4 top-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${banner.isActive
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-white/90 text-zinc-700"
                                                            }`}
                                                    >
                                                        {banner.isActive ? "Active" : "Hidden"}
                                                    </span>
                                                </div>

                                                <div className="absolute right-4 top-4 flex items-center gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                                                    <button
                                                        onClick={() => toggleBanner(banner._id)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-text-primary shadow-sm transition hover:bg-white"
                                                        title={banner.isActive ? "Hide banner" : "Show banner"}
                                                        aria-label={banner.isActive ? "Hide banner" : "Show banner"}
                                                    >
                                                        {banner.isActive ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => deleteBanner(banner._id)}
                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-red-600 shadow-sm transition hover:bg-white"
                                                        title="Delete banner"
                                                        aria-label="Delete banner"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                                    <h3 className="text-base font-semibold">
                                                        {banner.title || "Untitled banner"}
                                                    </h3>
                                                    <p className="mt-1 line-clamp-2 text-sm text-white/85">
                                                        {banner.subtitle || "No subtitle added"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatPill({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-bg-surface px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-text-secondary shadow-sm">
                {icon}
            </div>
            <div>
                <div className="text-sm font-semibold text-text-primary">{value}</div>
                <div className="text-xs text-text-secondary">{label}</div>
            </div>
        </div>
    );
}