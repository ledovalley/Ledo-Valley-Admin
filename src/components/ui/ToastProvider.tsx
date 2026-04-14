"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
    id: string;
    title?: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (input: {
        title?: string;
        message: string;
        type?: ToastType;
    }) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function toastStyles(type: ToastType) {
    switch (type) {
        case "success":
            return {
                wrap: "border-green-200 bg-green-50",
                iconWrap: "bg-green-100 text-green-700",
                icon: <CheckCircle2 className="h-4 w-4" />,
            };
        case "error":
            return {
                wrap: "border-red-200 bg-red-50",
                iconWrap: "bg-red-100 text-red-700",
                icon: <CircleAlert className="h-4 w-4" />,
            };
        default:
            return {
                wrap: "border-brand-primary/20 bg-brand-primary/5",
                iconWrap: "bg-brand-primary/10 text-brand-primary",
                icon: <Info className="h-4 w-4" />,
            };
    }
}

export function ToastProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const toast = useCallback(
        ({
            title,
            message,
            type = "info",
        }: {
            title?: string;
            message: string;
            type?: ToastType;
        }) => {
            const id = crypto.randomUUID();

            setItems((prev) => [...prev, { id, title, message, type }]);

            window.setTimeout(() => {
                dismiss(id);
            }, 3500);
        },
        [dismiss]
    );

    const value = useMemo<ToastContextValue>(
        () => ({
            toast,
            success: (message, title) =>
                toast({ title, message, type: "success" }),
            error: (message, title) =>
                toast({ title, message, type: "error" }),
            info: (message, title) =>
                toast({ title, message, type: "info" }),
            dismiss,
        }),
        [toast, dismiss]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div
                className="pointer-events-none fixed right-4 top-4 z-120 flex w-full max-w-sm flex-col gap-3"
                aria-live="polite"
                aria-atomic="true"
            >
                {items.map((item) => {
                    const styles = toastStyles(item.type);

                    return (
                        <div
                            key={item.id}
                            role={item.type === "error" ? "alert" : "status"}
                            className={`pointer-events-auto rounded-2xl border p-4 shadow-lg ${styles.wrap}`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}
                                >
                                    {styles.icon}
                                </div>

                                <div className="min-w-0 flex-1">
                                    {item.title && (
                                        <div className="text-sm font-semibold text-text-primary">
                                            {item.title}
                                        </div>
                                    )}
                                    <div className="text-sm text-text-secondary">
                                        {item.message}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => dismiss(item.id)}
                                    aria-label="Dismiss notification"
                                    className="rounded-lg p-1 text-text-secondary transition hover:bg-black/5"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return context;
}