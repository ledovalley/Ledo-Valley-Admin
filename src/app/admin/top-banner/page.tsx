"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "@/lib/api";
import {
    Trash2,
    GripVertical,
    Eye,
    EyeOff,
    Calendar,
    Clock,
    Copy,
    Edit3,
    X,
    Check,
    Loader2,
} from "lucide-react";
import {
    DndContext,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
    closestCenter,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Banner {
    _id: string;
    message: string;
    couponCode?: string;
    visibility: "ALL" | "LOGGED_IN" | "LOGGED_OUT";
    isActive: boolean;
    order: number;
    startDate?: string;
    endDate?: string;
    createdAt: string;
}

interface BannerStatus {
    label: string;
    tone: "active" | "scheduled" | "expired" | "inactive";
    icon: React.ReactNode;
}

interface FormState {
    message: string;
    couponCode: string;
    visibility: Banner["visibility"];
    startDate: string;
    endDate: string;
    activateImmediately: boolean;
}

const getBannerStatus = (banner: Banner): BannerStatus => {
    const now = new Date();
    const start = banner.startDate ? new Date(banner.startDate) : null;
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (!banner.isActive) {
        return {
            label: "Inactive",
            tone: "inactive",
            icon: <EyeOff className="h-3.5 w-3.5" />,
        };
    }

    if (start && start > now) {
        return {
            label: "Scheduled",
            tone: "scheduled",
            icon: <Clock className="h-3.5 w-3.5" />,
        };
    }

    if (end && end < now) {
        return {
            label: "Expired",
            tone: "expired",
            icon: <Calendar className="h-3.5 w-3.5" />,
        };
    }

    return {
        label: "Active",
        tone: "active",
        icon: <Eye className="h-3.5 w-3.5" />,
    };
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const statusClasses: Record<BannerStatus["tone"], string> = {
    active:
        "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/20",
    scheduled:
        "bg-[var(--color-accent)]/20 text-[var(--color-text-primary)] border border-[var(--color-accent)]/40",
    expired:
        "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20",
    inactive:
        "bg-black/5 text-[var(--color-text-secondary)] border border-black/10",
};

function SortableItem({
    banner,
    toggleActive,
    deleteBanner,
    editBanner,
    duplicateBanner,
}: {
    banner: Banner;
    toggleActive: (id: string) => void;
    deleteBanner: (id: string) => void;
    editBanner: (banner: Banner) => void;
    duplicateBanner: (banner: Banner) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: banner._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const status = getBannerStatus(banner);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group rounded-[28px] border bg-(--color-bg-surface) p-5 shadow-sm transition-all duration-200
            ${isDragging
                    ? "scale-[1.01] shadow-2xl ring-2 ring-accent/50 border-accent"
                    : "border-black/10 hover:shadow-lg hover:-translate-y-0.5"
                }`}
        >
            <div className="flex items-start gap-4">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="mt-1 cursor-grab rounded-xl border border-black/5 bg-white/60 p-2 text-text-secondary transition hover:bg-white shrink-0"
                    aria-label={`Reorder banner ${banner.message}`}
                >
                    <GripVertical className="h-5 w-5" />
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-(--color-text-primary)">
                                {banner.message}
                            </h3>
                            <div className="mt-1 text-xs text-text-secondary">
                                Position #{banner.order + 1}
                            </div>
                        </div>

                        {banner.couponCode ? (
                            <div className="rounded-full border border-accent/40 bg-accent/20 px-3 py-1 text-xs font-semibold tracking-wide text-(--color-text-primary)">
                                {banner.couponCode}
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusClasses[status.tone]}`}
                        >
                            {status.icon}
                            {status.label}
                        </span>

                        <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-(--color-text-primary)">
                            {banner.visibility}
                        </span>

                        {banner.startDate ? (
                            <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-text-secondary">
                                Starts {formatDate(banner.startDate)}
                            </span>
                        ) : null}

                        {banner.endDate ? (
                            <span className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-text-secondary">
                                Ends {formatDate(banner.endDate)}
                            </span>
                        ) : null}
                    </div>

                    <div className="mt-4 rounded-2xl bg-white/60 px-4 py-2 text-xs text-text-secondary">
                        Updated {formatDate(banner.createdAt)}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={() => editBanner(banner)}
                        className="rounded-xl p-2 text-text-secondary transition hover:bg-white hover:text-(--color-text-primary)"
                        title="Edit"
                    >
                        <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => duplicateBanner(banner)}
                        className="rounded-xl p-2 text-text-secondary transition hover:bg-white hover:text-(--color-text-primary)"
                        title="Duplicate"
                    >
                        <Copy className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => toggleActive(banner._id)}
                        className="rounded-xl p-2 text-text-secondary transition hover:bg-white hover:text-(--color-text-primary)"
                        title={banner.isActive ? "Deactivate" : "Activate"}
                    >
                        {banner.isActive ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => deleteBanner(banner._id)}
                        className="rounded-xl p-2 text-warning transition hover:bg-warning/10"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function PreviewCard({ activeBanners }: { activeBanners: Banner[] }) {
    const currentBanner = activeBanners[0];
    const hasRotation = activeBanners.length > 1;

    return (
        <div className="overflow-hidden rounded-4xl border border-black/10 bg-(--color-bg-surface) shadow-sm">
            <div className="border-b border-black/10 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-(--color-brand-primary) animate-pulse" />
                    <h3 className="font-playfair text-2xl text-(--color-text-primary)">
                        Live Preview
                    </h3>
                </div>
            </div>

            <div className="border-t border-black/10 bg-(--color-bg-dark) px-6 py-6 text-center text-(--color-text-on-dark)">
                <div className="mx-auto max-w-2xl">
                    {currentBanner ? (
                        <>
                            <div className="text-lg font-semibold leading-tight">
                                {currentBanner.message}
                            </div>

                            {currentBanner.couponCode ? (
                                <div className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-(--color-text-primary)">
                                    {currentBanner.couponCode}
                                </div>
                            ) : null}

                            <div className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-(--color-brand-on-dark)/90">
                                Visible to: {currentBanner.visibility.toLowerCase()}
                            </div>
                        </>
                    ) : (
                        <div className="py-8 text-lg italic opacity-80">
                            No active banner
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between bg-white/50 px-6 py-4 text-xs text-text-secondary">
                <span>Active banners: {activeBanners.length}</span>
                <span>Next rotation: {hasRotation ? "Soon" : "None"}</span>
            </div>

            {!hasRotation && (
                <div className="border-t border-warning/20 bg-warning/10 px-6 py-3 text-xs font-medium text-warning">
                    Rotation needs at least 2 active banners. Activate another banner to make the website rotate.
                </div>
            )}
        </div>
    );
}

export default function AdminTopBannerPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [creating, setCreating] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    const [formData, setFormData] = useState<FormState>({
        message: "",
        couponCode: "",
        visibility: "ALL",
        startDate: "",
        endDate: "",
        activateImmediately: true,
    });

    const activeBanners = useMemo(
        () => banners.filter((banner) => getBannerStatus(banner).tone === "active"),
        [banners]
    );

    const stats = useMemo(
        () => ({
            total: banners.length,
            active: activeBanners.length,
            scheduled: banners.filter(
                (banner) => getBannerStatus(banner).tone === "scheduled"
            ).length,
            inactive: banners.filter(
                (banner) => getBannerStatus(banner).tone === "inactive"
            ).length,
        }),
        [banners, activeBanners.length]
    );

    useEffect(() => {
        void loadBanners();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const loadBanners = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data } = await axios.get("/admin/top-banner");
            setBanners(data.sort((a: Banner, b: Banner) => a.order - b.order));
        } catch (err) {
            console.error("FETCH ERROR:", err);
            setError("Failed to load banners. Please refresh the page.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingBanner(null);
        setFormData({
            message: "",
            couponCode: "",
            visibility: "ALL",
            startDate: "",
            endDate: "",
            activateImmediately: true,
        });
    };

    const handleSubmit = async () => {
        if (!formData.message.trim()) return;

        setCreating(true);

        try {
            if (editingBanner) {
                await axios.patch(`/admin/top-banner/${editingBanner._id}`, {
                    message: formData.message,
                    couponCode: formData.couponCode,
                    visibility: formData.visibility,
                    startDate: formData.startDate || null,
                    endDate: formData.endDate || null,
                    isActive: formData.activateImmediately,
                });
                setToast({ message: "Banner updated", type: "success" });
            } else {
                await axios.post("/admin/top-banner", {
                    message: formData.message,
                    couponCode: formData.couponCode,
                    visibility: formData.visibility,
                    startDate: formData.startDate || null,
                    endDate: formData.endDate || null,
                    isActive: formData.activateImmediately,
                });
                setToast({ message: "Banner created", type: "success" });
            }

            await loadBanners();
            resetForm();
        } catch (err) {
            console.error("SAVE ERROR:", err);
            setToast({ message: "Failed to save banner", type: "error" });
        } finally {
            setCreating(false);
        }
    };

    const editBanner = (banner: Banner) => {
        setEditingBanner(banner);
        setFormData({
            message: banner.message,
            couponCode: banner.couponCode || "",
            visibility: banner.visibility,
            startDate: banner.startDate
                ? new Date(banner.startDate).toISOString().slice(0, 16)
                : "",
            endDate: banner.endDate
                ? new Date(banner.endDate).toISOString().slice(0, 16)
                : "",
            activateImmediately: banner.isActive,
        });
    };

    const duplicateBanner = (banner: Banner) => {
        setEditingBanner(null);
        setFormData({
            message: `${banner.message} (Copy)`,
            couponCode: banner.couponCode || "",
            visibility: banner.visibility,
            startDate: banner.startDate
                ? new Date(banner.startDate).toISOString().slice(0, 16)
                : "",
            endDate: banner.endDate
                ? new Date(banner.endDate).toISOString().slice(0, 16)
                : "",
            activateImmediately: banner.isActive,
        });
        setToast({ message: "Banner duplicated to editor", type: "success" });
    };

    const toggleActive = async (id: string) => {
        const banner = banners.find((item) => item._id === id);
        if (!banner) return;

        setBanners((prev) =>
            prev.map((item) =>
                item._id === id ? { ...item, isActive: !item.isActive } : item
            )
        );

        try {
            await axios.patch(`/admin/top-banner/${id}/toggle`);
            setToast({
                message: banner.isActive ? "Banner hidden" : "Banner activated",
                type: "success",
            });
        } catch (err) {
            console.error("TOGGLE ERROR:", err);
            await loadBanners();
            setToast({ message: "Failed to update status", type: "error" });
        }
    };

    const deleteBanner = async (id: string) => {
        if (!window.confirm("Delete this banner?")) return;

        setBanners((prev) => prev.filter((item) => item._id !== id));

        try {
            await axios.delete(`/admin/top-banner/${id}`);
            setToast({ message: "Banner deleted", type: "success" });
        } catch (err) {
            console.error("DELETE ERROR:", err);
            await loadBanners();
            setToast({ message: "Failed to delete banner", type: "error" });
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            setActiveId(null);
            return;
        }

        const oldIndex = banners.findIndex((banner) => banner._id === active.id);
        const newIndex = banners.findIndex((banner) => banner._id === over.id);

        const updated = arrayMove(banners, oldIndex, newIndex).map((banner, index) => ({
            ...banner,
            order: index,
        }));

        setBanners(updated);

        try {
            await axios.patch("/admin/top-banner/reorder", {
                orderedIds: updated.map((banner) => banner._id),
            });
            setToast({ message: "Order saved", type: "success" });
        } catch (err) {
            console.error("REORDER ERROR:", err);
            await loadBanners();
            setToast({ message: "Failed to save order", type: "error" });
        } finally {
            setActiveId(null);
        }
    };

    return (
        <div className="min-h-screen bg-(--color-bg-page) px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="font-playfair text-4xl md:text-5xl text-(--color-text-primary)">
                            Top Banner Manager
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm md:text-base text-text-secondary">
                            Create, schedule, reorder, preview, and manage promotional banners for your storefront.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-black/10 bg-white/50 px-4 py-3 backdrop-blur-sm">
                        <div className="rounded-full bg-white px-3 py-1.5 text-sm text-(--color-text-primary) border border-black/10">
                            Total: <span className="font-semibold">{stats.total}</span>
                        </div>
                        <div className="rounded-full bg-(--color-brand-primary)/10 px-3 py-1.5 text-sm text-(--color-text-primary) border border-(--color-brand-primary)/20">
                            {stats.active} active
                        </div>
                        <div className="rounded-full bg-accent/20 px-3 py-1.5 text-sm text-(--color-text-primary) border border-accent/30">
                            {stats.scheduled} scheduled
                        </div>
                        <div className="rounded-full bg-black/5 px-3 py-1.5 text-sm text-text-secondary border border-black/10">
                            {stats.inactive} inactive
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <div className="rounded-4xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
                        <div className="mb-8 flex items-center justify-between">
                            <h2 className="font-playfair text-3xl text-(--color-text-primary)">
                                {editingBanner ? "Edit Banner" : "Create Banner"}
                            </h2>

                            {editingBanner ? (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-2xl p-2 text-text-secondary transition hover:bg-(--color-bg-surface) hover:text-(--color-text-primary)"
                                    title="Cancel editing"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            ) : null}
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-(--color-text-primary)">
                                    Banner message
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setFormData({ ...formData, message: e.target.value })
                                    }
                                    rows={4}
                                    placeholder="Enter banner message"
                                    className="w-full rounded-3xl border border-black/10 bg-(--color-bg-surface) px-4 py-4 text-(--color-text-primary) outline-none transition placeholder:text-text-secondary/70 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                />
                                <div className="mt-2 text-xs text-text-secondary">
                                    {formData.message.length}/120
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-(--color-text-primary)">
                                        Coupon code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.couponCode}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setFormData({
                                                ...formData,
                                                couponCode: e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="SAVE10"
                                        className="w-full rounded-[18px] border border-black/10 bg-(--color-bg-surface) px-4 py-3 text-(--color-text-primary) outline-none transition placeholder:text-text-secondary/70 focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-(--color-text-primary)">
                                        Visibility
                                    </label>
                                    <select
                                        value={formData.visibility}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                            setFormData({
                                                ...formData,
                                                visibility: e.target.value as Banner["visibility"],
                                            })
                                        }
                                        className="w-full rounded-[18px] border border-black/10 bg-(--color-bg-surface) px-4 py-3 text-(--color-text-primary) outline-none transition focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                    >
                                        <option value="ALL">All Visitors</option>
                                        <option value="LOGGED_IN">Logged In Only</option>
                                        <option value="LOGGED_OUT">Logged Out Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-(--color-text-primary)">
                                        Start date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setFormData({ ...formData, startDate: e.target.value })
                                        }
                                        className="w-full rounded-[18px] border border-black/10 bg-(--color-bg-surface) px-4 py-3 text-(--color-text-primary) outline-none transition focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-(--color-text-primary)">
                                        End date
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setFormData({ ...formData, endDate: e.target.value })
                                        }
                                        className="w-full rounded-[18px] border border-black/10 bg-(--color-bg-surface) px-4 py-3 text-(--color-text-primary) outline-none transition focus:border-(--color-brand-primary) focus:ring-4 focus:ring-(--color-brand-primary)/10"
                                    />
                                </div>
                            </div>

                            <label className="flex cursor-pointer items-center gap-3 rounded-3xl bg-(--color-bg-surface) px-4 py-4 border border-black/5">
                                <input
                                    type="checkbox"
                                    checked={formData.activateImmediately}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setFormData({
                                            ...formData,
                                            activateImmediately: e.target.checked,
                                        })
                                    }
                                    className="h-5 w-5 rounded border-black/20 accent-(--color-brand-primary)"
                                />
                                <span className="text-sm text-(--color-text-primary)">
                                    Activate immediately after save
                                </span>
                            </label>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={creating || !formData.message.trim()}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-(--color-brand-primary) px-6 py-4 text-sm font-semibold text-(--color-brand-on-dark) transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : editingBanner ? (
                                    "Update Banner"
                                ) : (
                                    "Create Banner"
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <PreviewCard activeBanners={activeBanners} />

                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, index) => (
                                    <div
                                        key={index}
                                        className="h-28 animate-pulse rounded-[28px] bg-(--color-bg-surface)"
                                    />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="rounded-4xl border border-warning/20 bg-white p-12 text-center shadow-sm">
                                <div className="mb-4 text-xl font-semibold text-warning">
                                    {error}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void loadBanners()}
                                    className="rounded-[18px] border border-black/10 px-6 py-3 text-sm font-medium text-(--color-text-primary) transition hover:bg-(--color-bg-surface)"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : banners.length === 0 ? (
                            <div className="rounded-4xl border border-black/10 bg-white p-16 text-center shadow-sm">
                                <EyeOff className="mx-auto mb-5 h-14 w-14 text-text-secondary" />
                                <h3 className="font-playfair text-3xl text-(--color-text-primary)">
                                    No banners yet
                                </h3>
                                <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">
                                    Create your first banner from the panel on the left to start promoting offers and announcements.
                                </p>
                            </div>
                        ) : (
                            <DndContext
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={(event) => void handleDragEnd(event)}
                            >
                                <SortableContext items={banners.map((banner) => banner._id)}>
                                    <div className="space-y-4">
                                        {banners.map((banner) => (
                                            <SortableItem
                                                key={banner._id}
                                                banner={banner}
                                                toggleActive={(id) => void toggleActive(id)}
                                                deleteBanner={(id) => void deleteBanner(id)}
                                                editBanner={editBanner}
                                                duplicateBanner={duplicateBanner}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>

                                <DragOverlay>
                                    {activeId ? (
                                        <div className="rounded-[28px] border border-accent bg-white px-5 py-4 shadow-2xl">
                                            <div className="flex items-center gap-4">
                                                <GripVertical className="h-5 w-5 text-text-secondary" />
                                                <div>
                                                    <div className="text-base font-semibold text-(--color-text-primary)">
                                                        {banners.find((banner) => banner._id === activeId)?.message}
                                                    </div>
                                                    <div className="mt-1 text-xs text-text-secondary">
                                                        Drop to reorder
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                </div>
            </div>

            {toast ? (
                <div className="fixed bottom-6 right-6 z-50">
                    <div
                        className={`max-w-sm rounded-3xl border px-5 py-4 shadow-xl ${toast.type === "error"
                                ? "border-warning/20 bg-white text-warning"
                                : "border-brand-primary/20 bg-white text-(--color-text-primary)"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {toast.type === "success" ? (
                                <Check className="h-5 w-5 shrink-0" />
                            ) : (
                                <X className="h-5 w-5 shrink-0" />
                            )}
                            <span className="text-sm font-medium">{toast.message}</span>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
