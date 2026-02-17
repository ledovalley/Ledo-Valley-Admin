"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "@/lib/api";
import {
    Trash2,
    GripVertical,
    Eye,
    EyeOff,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ================= TYPES ================= */

interface Banner {
    _id: string;
    message: string;
    couponCode?: string;
    visibility: "ALL" | "LOGGED_IN" | "LOGGED_OUT";
    isActive: boolean;
    order: number;
    startDate?: string;
    endDate?: string;
}

interface SortableItemProps {
    banner: Banner;
    toggleActive: (id: string) => void;
    deleteBanner: (id: string) => void;
}

/* ===================================================== */

export default function AdminTopBannerPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [couponCode, setCouponCode] = useState("");
    const [visibility, setVisibility] =
        useState<Banner["visibility"]>("ALL");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    /* ================= FETCH ================= */

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await axios.get("/admin/top-banner");
                setBanners(data);
            } catch (error) {
                console.error("FETCH ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const refresh = async () => {
        const { data } = await axios.get("/admin/top-banner");
        setBanners(data);
    };

    /* ================= CREATE ================= */

    const createBanner = async () => {
        if (!message.trim()) return;

        await axios.post("/admin/top-banner", {
            message,
            couponCode,
            visibility,
            startDate,
            endDate,
        });

        setMessage("");
        setCouponCode("");
        setStartDate("");
        setEndDate("");
        setVisibility("ALL");

        refresh();
    };

    /* ================= DRAG ================= */

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = banners.findIndex(
            (b) => b._id === active.id
        );
        const newIndex = banners.findIndex(
            (b) => b._id === over.id
        );

        const updated = arrayMove(banners, oldIndex, newIndex);
        setBanners(updated);

        await axios.patch("/admin/top-banner/reorder", {
            orderedIds: updated.map((b) => b._id),
        });
    };

    /* ================= TOGGLE ================= */

    const toggleActive = async (id: string) => {
        await axios.patch(`/admin/top-banner/${id}/toggle`);
        refresh();
    };

    /* ================= DELETE ================= */

    const deleteBanner = async (id: string) => {
        await axios.delete(`/admin/top-banner/${id}`);
        refresh();
    };

    /* ================= PREVIEW ================= */

    const activeBanners = useMemo(
        () => banners.filter((b) => b.isActive),
        [banners]
    );

    return (
        <div className="p-8 space-y-10">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-semibold">
                    Top Banner Manager
                </h1>
                <p className="text-gray-500 mt-1">
                    Drag, schedule, preview & manage rotating banners
                </p>
            </div>

            {/* CREATE FORM */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">

                <input
                    placeholder="Banner Message"
                    className="w-full border rounded-xl px-4 py-3"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />

                <div className="flex gap-4">
                    <input
                        placeholder="Coupon Code"
                        className="w-full border rounded-xl px-4 py-3"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                    />

                    <select
                        className="w-full border rounded-xl px-4 py-3"
                        value={visibility}
                        onChange={(e) =>
                            setVisibility(
                                e.target.value as Banner["visibility"]
                            )
                        }
                    >
                        <option value="ALL">Visible to All</option>
                        <option value="LOGGED_IN">Logged In Only</option>
                        <option value="LOGGED_OUT">Logged Out Only</option>
                    </select>
                </div>

                <div className="flex gap-4">
                    <input
                        type="datetime-local"
                        className="border rounded-xl px-4 py-3 w-full"
                        value={startDate}
                        onChange={(e) =>
                            setStartDate(e.target.value)
                        }
                    />
                    <input
                        type="datetime-local"
                        className="border rounded-xl px-4 py-3 w-full"
                        value={endDate}
                        onChange={(e) =>
                            setEndDate(e.target.value)
                        }
                    />
                    <button
                        onClick={createBanner}
                        className="bg-bg-dark w-full hover:bg-bg-dark/90 text-white px-6 py-3 rounded-xl"
                    >
                        Add Banner
                    </button>
                </div>
            </div>

            {/* LIVE PREVIEW */}
            <div className="bg-black text-white text-center py-3 rounded-xl transition-all">
                {activeBanners.length > 0
                    ? activeBanners[0].message
                    : "No active banner to preview"}
            </div>

            {/* DRAG LIST */}
            {loading ? (
                <div className="text-center py-10 text-gray-400">
                    Loading banners...
                </div>
            ) : (
                <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={banners.map((b) => b._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {banners.map((banner) => (
                            <SortableItem
                                key={banner._id}
                                banner={banner}
                                toggleActive={toggleActive}
                                deleteBanner={deleteBanner}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}

/* ================= SORTABLE ITEM ================= */

function SortableItem({
    banner,
    toggleActive,
    deleteBanner,
}: SortableItemProps) {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: banner._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white border rounded-2xl p-6 shadow-sm flex justify-between items-center"
        >
            <div className="flex items-center gap-4">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab"
                >
                    <GripVertical />
                </div>

                <div>
                    <p className="font-medium">
                        {banner.message}
                    </p>
                    <p className="text-xs text-gray-400">
                        {banner.visibility}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">

                <button
                    onClick={() => toggleActive(banner._id)}
                >
                    {banner.isActive ? (
                        <Eye className="text-green-600" />
                    ) : (
                        <EyeOff className="text-gray-400" />
                    )}
                </button>

                <button
                    onClick={() => deleteBanner(banner._id)}
                >
                    <Trash2 className="text-red-500" />
                </button>

            </div>
        </div>
    );
}
