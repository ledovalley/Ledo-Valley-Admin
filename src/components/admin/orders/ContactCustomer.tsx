"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";

/* Indian mobile number in the 91XXXXXXXXXX form WhatsApp needs, or null. */
export function whatsappNumber(phone?: string | null) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return null;
}

interface Props {
  phone?: string | null;
  name?: string;
  orderNumber: string;
  status: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

/** WhatsApp (with a ready message) and Call buttons for the customer. */
export default function ContactCustomer({ phone, name, orderNumber, status, courierName, trackingNumber, trackingUrl }: Props) {
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  const shipped = ["SHIPPED", "DELIVERED"].includes(status);

  const templates = useMemo(() => {
    const list = [
      {
        key: "general",
        label: "About the order",
        text: `Hello ${first}, this is Ledo Valley Tea about your order #${orderNumber}. `,
      },
    ];
    if (!shipped) {
      list.push({
        key: "address",
        label: "Confirm address",
        text: `Hello ${first}, this is Ledo Valley Tea. We're getting your order #${orderNumber} ready to send. Could you please confirm your full delivery address with a nearby landmark? Thank you!`,
      });
    }
    if (status === "SHIPPED") {
      const tracking = [
        `Hello ${first}, your Ledo Valley Tea order #${orderNumber} is on its way${courierName ? ` with ${courierName}` : ""}.`,
        trackingNumber ? `Tracking number: ${trackingNumber}` : "",
        trackingUrl ? `Track it here: ${trackingUrl}` : "",
        "Thank you for ordering!",
      ]
        .filter(Boolean)
        .join("\n");
      list.push({ key: "tracking", label: "Tracking details", text: tracking });
      list.push({
        key: "missed",
        label: "Courier couldn't deliver",
        text: `Hello ${first}, this is Ledo Valley Tea. The courier couldn't deliver your order #${orderNumber}. Could you please confirm your address and a good time to deliver, so we can ask them to try again?`,
      });
    }
    if (status === "DELIVERED") {
      list.push({
        key: "feedback",
        label: "How was the tea?",
        text: `Hello ${first}, we hope you're enjoying your Ledo Valley tea from order #${orderNumber}! We'd love to hear what you think.`,
      });
    }
    return list;
  }, [first, orderNumber, status, shipped, courierName, trackingNumber, trackingUrl]);

  const [choice, setChoice] = useState(templates[0].key);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const current = templates.find((t) => t.key === choice) || templates[0];
  const message = edited[current.key] ?? current.text;

  const wa = whatsappNumber(phone);
  if (!phone) {
    return <p className="text-sm text-text-secondary">No phone number on this order.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setChoice(t.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              t.key === current.key
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-black/10 text-text-secondary hover:bg-black/5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label htmlFor="wa-message" className="sr-only">
        WhatsApp message
      </label>
      <textarea
        id="wa-message"
        value={message}
        onChange={(e) => setEdited((prev) => ({ ...prev, [current.key]: e.target.value }))}
        rows={4}
        className="w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
      />

      <div className="flex flex-wrap gap-2">
        {wa ? (
          <a
            href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1f8a4c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#19733f]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        ) : (
          <span className="rounded-xl bg-black/5 px-3 py-2 text-xs text-text-secondary">
            WhatsApp needs a 10-digit Indian mobile number.
          </span>
        )}
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-black/5"
        >
          <Phone className="h-4 w-4" />
          Call {phone}
        </a>
      </div>
      <p className="text-xs text-text-secondary">WhatsApp opens with the message ready; check it and press send there.</p>
    </div>
  );
}
