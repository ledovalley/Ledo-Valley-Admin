"use client";

import { useState } from "react";
import api from "@/lib/api";
import StepProductInfo from "./StepProductInfo";
import StepAddVariants from "./StepAddVariants";
import StepReviewFinish from "./StepReview";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateProductModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [productId, setProductId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  /* --------------------------------
     Close handling (draft cleanup)
  --------------------------------- */
  const handleClose = async () => {
    if (productId && step < 3) {
      const confirmClose = confirm(
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

    setStep(1);
    setProductId(null);
    setClosing(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-medium">
              Create Product
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Step {step} of 3
            </p>
          </div>

          <button
            onClick={handleClose}
            disabled={closing}
            className="
              text-sm text-text-secondary
              hover:text-black
              px-2 py-1 rounded-full
              hover:bg-gray-100
              transition
            "
          >
            ✕
          </button>
        </div>

        {/* Step progress */}
        <div className="flex">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 ${step >= s
                  ? "bg-(--color-brand-primary)"
                  : "bg-(--color-bg-surface)"
                }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* ================= STEP 1 ================= */}
          {step === 1 && (
            <StepProductInfo
              mode="create"
              onSuccess={(id) => {
                if (!id) return; // safety guard

                setProductId(id);
                setStep(2);
                onCreated();
              }}
            />
          )}

          {/* ================= STEP 2 ================= */}
          {step === 2 && productId && (
            <StepAddVariants
              productId={productId}
              onDone={() => setStep(3)}
            />
          )}

          {/* ================= STEP 3 ================= */}
          {step === 3 && productId && (
            <StepReviewFinish
              productId={productId}
              onFinish={() => {
                onCreated();
                handleClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
