"use client";

import Image from "next/image";

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
        <div>
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="mb-2"
            />

            <div className="flex gap-3 flex-wrap">
                {images.map((file, i) => (
                    <div
                        key={i}
                        className="relative w-20 h-20 border rounded-lg overflow-hidden"
                    >
                        <Image
                            alt=""
                            width={500}
                            height={500}
                            src={URL.createObjectURL(file)}
                            className="object-cover w-full h-full"
                        />
                        <button
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full px-1"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <div className="text-xs text-text-secondary mt-1">
                Max {max} images
            </div>
        </div>
    );
}
