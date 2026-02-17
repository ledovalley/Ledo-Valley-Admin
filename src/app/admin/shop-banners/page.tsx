"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/api";
import Image from "next/image";
import { Trash2, Eye, EyeOff } from "lucide-react";

/* ================= TYPES ================= */

interface Banner {
    _id: string;
    image: {
        url: string;
    };
    title?: string;
    subtitle?: string;
    isActive: boolean;
}

/* ===================================================== */

export default function AdminShopBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    const [imageFile, setImageFile] =
        useState<File | null>(null);

    const [preview, setPreview] =
        useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");

    /* ================= FETCH ================= */

    const fetchBanners = async () => {
        try {
            const { data } = await axios.get(
                "/admin/shop-banner"
            );
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

    /* ================= IMAGE PREVIEW ================= */

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

    /* ================= CREATE ================= */

    const createBanner = async () => {
        if (!imageFile) return alert("Select image");

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("title", title);
        formData.append("subtitle", subtitle);

        try {
            await axios.post(
                "/admin/shop-banner",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setImageFile(null);
            setPreview(null);
            setTitle("");
            setSubtitle("");

            fetchBanners();
        } catch (error) {
            console.error("CREATE ERROR:", error);
        }
    };

    /* ================= DELETE ================= */

    const deleteBanner = async (id: string) => {
        if (!confirm("Delete banner?")) return;

        await axios.delete(
            `/admin/shop-banner/${id}`
        );

        fetchBanners();
    };

    /* ================= TOGGLE ================= */

    const toggleBanner = async (id: string) => {
        await axios.patch(
            `/admin/shop-banner/${id}/toggle`
        );
        fetchBanners();
    };

    /* ================= RENDER ================= */

    return (
        <div className="min-h-screen p-8 space-y-10">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-semibold">
                    Shop Banner Manager
                </h1>
                <p className="text-gray-500 mt-1">
                    Upload & manage homepage banners
                </p>
            </div>

            {/* CREATE CARD */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-sm"
                />

                {preview && (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                <input
                    placeholder="Banner Title"
                    className="w-full border rounded-xl px-4 py-3"
                    value={title}
                    onChange={(e) =>
                        setTitle(e.target.value)
                    }
                />

                <input
                    placeholder="Subtitle"
                    className="w-full border rounded-xl px-4 py-3"
                    value={subtitle}
                    onChange={(e) =>
                        setSubtitle(e.target.value)
                    }
                />

                <button
                    onClick={createBanner}
                    className="bg-black text-white px-6 py-3 rounded-xl"
                >
                    Upload Banner
                </button>
            </div>

            {/* LIST */}
            <div className="grid md:grid-cols-2 gap-6">

                {loading ? (
                    <p>Loading...</p>
                ) : banners.length === 0 ? (
                    <p className="text-gray-400">
                        No banners yet
                    </p>
                ) : (
                    banners.map((banner) => (
                        <div
                            key={banner._id}
                            className="bg-white border rounded-2xl shadow-sm overflow-hidden"
                        >
                            <div className="relative w-full h-48">
                                <Image
                                    src={banner.image.url}
                                    alt="Banner"
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            <div className="p-4 space-y-2">
                                <h3 className="font-medium">
                                    {banner.title}
                                </h3>

                                <p className="text-sm text-gray-500">
                                    {banner.subtitle}
                                </p>

                                <div className="flex justify-between items-center pt-3">

                                    <button
                                        onClick={() =>
                                            toggleBanner(banner._id)
                                        }
                                    >
                                        {banner.isActive ? (
                                            <Eye className="text-green-600" />
                                        ) : (
                                            <EyeOff className="text-gray-400" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() =>
                                            deleteBanner(banner._id)
                                        }
                                    >
                                        <Trash2 className="text-red-500" />
                                    </button>

                                </div>
                            </div>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
}
