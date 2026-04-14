"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { X, UploadCloud, ImageIcon } from "lucide-react";

interface Props {
    images: File[];
    onChange: (files: File[]) => void;
    max: number;
}

export default function VariantImageUpload({
    images,
    onChange,
    max,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const previews = useMemo(() => {
        return images.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));
    }, [images]);

    useEffect(() => {
        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [previews]);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const selected = Array.from(files);
        const combined = [...images, ...selected].slice(0, max);
        onChange(combined);
    };

    const removeImage = (index: number) => {
        onChange(images.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all
          ${images.length >= max
                        ? "pointer-events-none border-gray-200 bg-gray-50 opacity-60"
                        : "border-gray-300 hover:border-(--color-brand-primary) hover:bg-gray-50"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full bg-gray-100 p-2 transition-colors group-hover:bg-white">
                        <UploadCloud className="h-5 w-5 text-gray-500 group-hover:text-(--color-brand-primary)" />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                            {images.length >= max
                                ? "Limit reached"
                                : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-gray-400">
                            {images.length} of {max} images used
                        </p>
                    </div>
                </div>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                    {previews.map((preview, i) => (
                        <div
                            key={`${preview.file.name}-${preview.file.lastModified}-${i}`}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
                        >
                            <Image
                                alt={`Preview ${i + 1}`}
                                fill
                                src={preview.url}
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                unoptimized
                            />

                            <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(i);
                                }}
                                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 shadow-md transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                                <X size={14} />
                            </button>

                            {i === 0 && (
                                <div className="absolute bottom-1 left-1 right-1 rounded bg-white/90 px-1 py-0.5 text-center text-[10px] font-bold uppercase tracking-tight text-gray-700 shadow-sm">
                                    Cover
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {images.length === 0 && (
                <div className="flex items-center justify-center py-4 text-gray-300">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span className="text-xs italic">
                        No images attached to this variant
                    </span>
                </div>
            )}
        </div>
    );
}