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
    mobileImage?: {
        url: string;
    };
    title?: string;
    subtitle?: string;
    isActive: boolean;
}

export default function AdminHomeBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [mobilePreview, setMobilePreview] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");

    const fetchBanners = async () => {
        try {
            const { data } = await axios.get("/admin/home-banner");
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
        e: React.ChangeEvent<HTMLInputElement>,
        type: "desktop" | "mobile"
    ) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        if (type === "desktop") {
            setImageFile(file);
        } else {
            setMobileImageFile(file);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === "desktop") {
                setPreview(reader.result as string);
            } else {
                setMobilePreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const createBanner = async () => {
        if (!imageFile) return alert("Select desktop image");

        const formData = new FormData();
        formData.append("image", imageFile);
        if (mobileImageFile) {
            formData.append("mobileImage", mobileImageFile);
        }
        formData.append("title", title);
        formData.append("subtitle", subtitle);

        try {
            setUploading(true);

            await axios.post("/admin/home-banner", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setImageFile(null);
            setMobileImageFile(null);
            setPreview(null);
            setMobilePreview(null);
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

        await axios.delete(`/admin/home-banner/${id}`);
        fetchBanners();
    };

    const toggleBanner = async (id: string) => {
        await axios.patch(`/admin/home-banner/${id}/toggle`);
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
                        Home Hero Banner Manager
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Upload and manage banners for the homepage hero section.
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
                            Create Hero Banner
                        </h2>
                        <p className="mt-1 text-sm text-text-secondary">
                            Add a new desktop and mobile image pair.
                        </p>
                    </div>

                    <div className="mt-6 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-text-primary">
                                    Desktop Image
                                </span>
                                <div className="relative overflow-hidden rounded-3xl border border-dashed border-black/15 bg-bg-surface p-4 transition hover:border-brand-primary/30 hover:bg-brand-primary/5">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, "desktop")}
                                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                    />
                                    <div className="flex min-h-32 flex-col items-center justify-center text-center">
                                        <ImagePlus className="h-5 w-5 text-text-secondary" />
                                        <p className="mt-2 text-xs font-medium text-text-primary">
                                            {imageFile ? imageFile.name : "Desktop Version (Wide)"}
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-text-primary">
                                    Mobile Image (Optional)
                                </span>
                                <div className="relative overflow-hidden rounded-3xl border border-dashed border-black/15 bg-bg-surface p-4 transition hover:border-brand-primary/30 hover:bg-brand-primary/5">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(e, "mobile")}
                                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                                    />
                                    <div className="flex min-h-32 flex-col items-center justify-center text-center">
                                        <ImagePlus className="h-5 w-5 text-text-secondary" />
                                        <p className="mt-2 text-xs font-medium text-text-primary">
                                            {mobileImageFile ? mobileImageFile.name : "Mobile Version (Portrait)"}
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-primary">
                                Hero Title
                            </label>
                            <input
                                placeholder="Brewed for your everyday moments"
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
                                placeholder="Crafted from the finest Assam tea leaves"
                                rows={2}
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
                    <div className="rounded-4xl border border-black/10 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
                            <h2 className="text-lg font-semibold text-text-primary">
                                Hero Banners
                            </h2>
                            <div className="text-xs text-text-secondary">
                                {banners.length} total
                            </div>
                        </div>

                        <div className="p-5">
                            {loading ? (
                                <div className="grid gap-5 md:grid-cols-2">
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="h-48 animate-pulse rounded-3xl bg-black/5" />
                                    ))}
                                </div>
                            ) : banners.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-black/10 bg-bg-surface px-6 py-14 text-center">
                                    <h3 className="mt-4 text-base font-semibold text-text-primary">No hero banners yet</h3>
                                </div>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2">
                                    {banners.map((banner) => (
                                        <div key={banner._id} className="group overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
                                            <div className="relative aspect-video w-full overflow-hidden">
                                                <Image
                                                    src={banner.image.url}
                                                    alt={banner.title || "Hero banner"}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute right-4 top-4 flex gap-2">
                                                    <button
                                                        onClick={() => toggleBanner(banner._id)}
                                                        className="rounded-xl bg-white/90 p-2 shadow-sm"
                                                    >
                                                        {banner.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBanner(banner._id)}
                                                        className="rounded-xl bg-white/90 p-2 text-red-600 shadow-sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="absolute bottom-0 p-4 text-white bg-linear-to-t from-black/60 to-transparent w-full">
                                                    <h3 className="text-sm font-semibold">{banner.title || "Untitled"}</h3>
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

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-bg-surface px-4 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-text-secondary shadow-sm">{icon}</div>
            <div>
                <div className="text-sm font-semibold text-text-primary">{value}</div>
                <div className="text-xs text-text-secondary">{label}</div>
            </div>
        </div>
    );
}
