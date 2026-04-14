"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    tone?: "danger" | "default";
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

export default function ConfirmDialog({
    open,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    cancelText = "Cancel",
    tone = "danger",
    loading = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        previouslyFocusedRef.current = document.activeElement as HTMLElement;
        cancelButtonRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) {
                onClose();
            }

            if (e.key === "Tab" && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll<
                    HTMLButtonElement | HTMLAnchorElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                >(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );

                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        (last as HTMLElement).focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        (first as HTMLElement).focus();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
            previouslyFocusedRef.current?.focus?.();
        };
    }, [open, loading, onClose]);

    if (!open) return null;

    const confirmBtnClass =
        tone === "danger"
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-brand-primary hover:bg-brand-primary/90 text-white";

    const iconWrapClass =
        tone === "danger"
            ? "bg-red-50 text-red-600"
            : "bg-brand-primary/10 text-brand-primary";

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4">
            <div
                className="absolute inset-0"
                onClick={() => !loading && onClose()}
            />

            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                className="relative z-10 w-full max-w-md rounded-2xl border border-bg-dark/10 bg-white p-6 shadow-2xl"
            >
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    aria-label="Close dialog"
                    className="absolute right-4 top-4 rounded-lg p-2 text-text-secondary transition hover:bg-bg-dark/5 disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrapClass}`}
                    >
                        <AlertTriangle className="h-5 w-5" />
                    </div>

                    <div className="pr-8">
                        <h2
                            id="confirm-dialog-title"
                            className="text-base font-semibold text-text-primary"
                        >
                            {title}
                        </h2>
                        <p
                            id="confirm-dialog-description"
                            className="mt-2 text-sm leading-6 text-text-secondary"
                        >
                            {description}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl border border-bg-dark/10 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-dark/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmBtnClass}`}
                    >
                        {loading ? "Please wait..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}