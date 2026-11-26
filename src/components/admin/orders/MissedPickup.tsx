"use client";

import { useState } from "react";
import { CalendarClock, Loader2, Repeat, Star } from "lucide-react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToast } from "@/components/ui/ToastProvider";
import { formatINR } from "@/lib/orderFlow";

interface Courier {
  id: number;
  name: string;
  rate: number | null;
  etaDays: number | null;
  etd: string | null;
  rating: number | null;
  recommended: boolean;
  current: boolean;
}

/* YYYY-MM-DD in India time, `days` from today. */
const istDate = (days = 0) => new Date(Date.now() + 5.5 * 3600 * 1000 + days * 86400 * 1000).toISOString().slice(0, 10);

const inputClass =
  "w-full rounded-xl border border-black/10 p-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10";

/**
 * For a Shiprocket parcel the courier didn't collect: book the pickup
 * again, or change to another Shiprocket courier.
 */
export default function MissedPickup({ orderId, orderNumber, onDone }: { orderId: string; orderNumber: string; onDone: () => void }) {
  const { success, error: showError } = useToast();
  const [mode, setMode] = useState<"again" | "change" | null>(null);
  const [date, setDate] = useState(istDate(1));
  const [saving, setSaving] = useState(false);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [couriers, setCouriers] = useState<Courier[] | null>(null);
  const [courierError, setCourierError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);

  const open = async (m: "again" | "change") => {
    setDate(istDate(1));
    setMode(m);
    if (m === "change") {
      setChosen(null);
      setCouriers(null);
      setCourierError(null);
      try {
        setLoadingCouriers(true);
        const res = await api.get(`/admin/orders/${orderId}/couriers`);
        setCouriers(res.data.couriers || []);
      } catch (err) {
        setCourierError(getErrorMessage(err));
      } finally {
        setLoadingCouriers(false);
      }
    }
  };

  const close = () => {
    if (!saving) setMode(null);
  };

  const submit = async () => {
    try {
      setSaving(true);
      if (mode === "again") {
        const res = await api.post(`/admin/orders/${orderId}/pickup-again`, { date });
        success(res.data?.message || "Pickup booked again");
      } else {
        const courier = couriers?.find((c) => c.id === chosen);
        if (!courier) return;
        const res = await api.post(`/admin/orders/${orderId}/change-courier`, {
          courierId: courier.id,
          courierName: courier.name,
          date,
        });
        success(res.data?.message || "Courier changed");
      }
      setMode(null);
      onDone();
    } catch (err) {
      showError(getErrorMessage(err));
      // A courier change can succeed even if the new pickup fails: refresh.
      if (mode === "change") onDone();
    } finally {
      setSaving(false);
    }
  };

  const dateValid = date >= istDate(0) && date <= istDate(7);

  return (
    <>
      <div className="mt-4 border-t border-black/5 pt-4">
        <p className="mb-2 text-xs text-text-secondary">Courier didn&apos;t come?</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => open("again")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-black/5"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Book pickup again
          </button>
          <button
            onClick={() => open("change")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold text-text-primary transition hover:bg-black/5"
          >
            <Repeat className="h-3.5 w-3.5" />
            Change courier
          </button>
        </div>
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="missed-title"
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 id="missed-title" className="text-lg font-semibold text-text-primary">
              {mode === "again" ? `Book pickup again for #${orderNumber}` : `Change courier for #${orderNumber}`}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {mode === "again"
                ? "Asks the same courier to come again. The AWB and label stay the same."
                : "Cancels the current AWB and gives the parcel to another Shiprocket courier. You'll need to print the new label; the old one won't work."}
            </p>

            {mode === "change" && (
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                {loadingCouriers ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-text-secondary">
                    <Loader2 className="h-4 w-4 animate-spin" /> Getting couriers from Shiprocket…
                  </div>
                ) : courierError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{courierError}</p>
                ) : couriers && couriers.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    No Shiprocket courier delivers to this pincode right now. Use “Ship another way instead”.
                  </p>
                ) : (
                  <fieldset className="space-y-2">
                    <legend className="mb-2 text-sm font-medium text-text-primary">Choose a courier (cheapest first)</legend>
                    {couriers?.map((c) => (
                      <label
                        key={c.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                          chosen === c.id ? "border-brand-primary bg-brand-primary/5" : "border-black/10 hover:bg-black/5"
                        } ${c.current ? "opacity-60" : ""}`}
                      >
                        <input
                          type="radio"
                          name="courier"
                          value={c.id}
                          checked={chosen === c.id}
                          disabled={c.current}
                          onChange={() => setChosen(c.id)}
                          className="mt-1"
                        />
                        <span className="flex-1">
                          <span className="flex flex-wrap items-center gap-2 font-medium text-text-primary">
                            {c.name}
                            {c.current && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-text-secondary">Current</span>}
                            {c.recommended && (
                              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">Shiprocket&apos;s pick</span>
                            )}
                          </span>
                          <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-text-secondary">
                            {c.rate !== null && <span>{formatINR(c.rate)}</span>}
                            {c.etaDays && <span>~{c.etaDays} day{c.etaDays === 1 ? "" : "s"}</span>}
                            {c.rating && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="h-3 w-3" /> {c.rating.toFixed(1)}
                              </span>
                            )}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}
              </div>
            )}

            <label htmlFor="pickup-date" className="mb-2 mt-4 block text-sm font-medium text-text-primary">
              Pickup date
            </label>
            <input
              id="pickup-date"
              type="date"
              min={istDate(0)}
              max={istDate(7)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
            {!dateValid && <p className="mt-1 text-xs text-red-600">Choose a date from today to 7 days ahead.</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={close}
                disabled={saving}
                className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-black/5 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={saving || !dateValid || (mode === "change" && !chosen)}
                className="inline-flex items-center gap-2 rounded-xl bg-bg-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-bg-dark/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "again" ? "Book pickup" : "Change courier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
