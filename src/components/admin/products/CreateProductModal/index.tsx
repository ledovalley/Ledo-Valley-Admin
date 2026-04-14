"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import StepProductInfo from "./StepProductInfo";
import StepAddVariants from "./StepAddVariants";
import StepReviewFinish from "./StepReview";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const STEPS = [
  { id: 1, label: "Product Info" },
  { id: 2, label: "Variants" },
  { id: 3, label: "Review" },
] as const;

export default function CreateProductModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [productId, setProductId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const resetState = () => {
    setStep(1);
    setProductId(null);
    setClosing(false);
  };

  const handleClose = async () => {
    if (closing) return;

    if (productId && step < 3) {
      const confirmClose = window.confirm(
        "This product is not finished yet. Closing will discard it. Continue?"
      );

      if (!confirmClose) return;

      try {
        setClosing(true);
        await api.delete(`/admin/products/${productId}`);
      } catch {
        // Silent fail – admin should not be blocked
      }
    }

    resetState();
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, productId, step, closing]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  const progressWidth = `${(step / 3) * 100}%`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      aria-labelledby="create-product-title"
      aria-describedby="create-product-description"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="create-product-title"
                className="text-xl font-semibold text-gray-900 sm:text-2xl"
              >
                Create Product
              </h2>
              <p
                id="create-product-description"
                className="mt-1 text-sm text-gray-500"
              >
                Add product details, variants, and review before publishing.
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              disabled={closing}
              aria-label="Close modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Stepper */}
          <div className="mt-5 space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-primary transition-all duration-300 ease-out"
                style={{ width: progressWidth }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {STEPS.map((item) => {
                const active = step === item.id;
                const completed = step > item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-3 py-3 transition-all ${active
                      ? "border-brand-primary bg-brand-primary/5"
                      : completed
                        ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${active
                          ? "bg-brand-primary text-white"
                          : completed
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-500 border border-gray-200"
                          }`}
                      >
                        {completed ? "✓" : item.id}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                          Step {item.id}
                        </p>
                        <p
                          className={`text-sm font-medium ${active
                            ? "text-gray-900"
                            : completed
                              ? "text-green-700"
                              : "text-gray-500"
                            }`}
                        >
                          {item.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto bg-gray-50/60 px-6 py-6 sm:px-8 sm:py-8 max-h-[calc(92vh-170px)]">
          {step === 1 && (
            <StepProductInfo
              mode="create"
              onSuccess={(id) => {
                if (!id) return;
                setProductId(id);
                setStep(2);
                onCreated();
              }}
            />
          )}

          {step === 2 && productId && (
            <StepAddVariants
              productId={productId}
              onDone={() => setStep(3)}
            />
          )}

          {step === 3 && productId && (
            <StepReviewFinish
              productId={productId}
              onFinish={() => {
                onCreated();
                resetState();
                onClose();
              }}
            />
          )}
        </div>

        {/* Footer note */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 sm:px-8">
          <div className="flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {step < 3
                ? "Closing before review will remove the unfinished draft."
                : "Review the product carefully before publishing."}
            </p>

            <p className="font-medium text-gray-400">
              {closing ? "Cleaning up draft..." : `Step ${step} of 3`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}