"use client";

import { History } from "lucide-react";
import { formatDate, formatINR } from "@/lib/orderFlow";

export interface HistoryEvent {
  at: string;
  event: string;
  detail?: string;
  by?: string;
}

/* The order fields the timeline can read dates from. */
export interface TimelineOrder {
  createdAt: string;
  history?: HistoryEvent[];
  payment?: { paidAt?: string };
  shipping?: { pickupScheduledAt?: string; shippedAt?: string; deliveredAt?: string; courierName?: string };
  returnInfo?: { requestedAt?: string; approvedAt?: string; rejectedAt?: string; refundedAt?: string };
  creditNotes?: { number: string; date: string; amount: number }[];
}

/*
 * Orders placed before history was recorded only have dates. Show those
 * (marked as "from the order's dates") for anything before the first
 * recorded event, so older orders still have a timeline.
 */
function eventsFromDates(o: TimelineOrder): HistoryEvent[] {
  const list: HistoryEvent[] = [];
  const add = (at: string | undefined, event: string, detail?: string) => {
    if (at) list.push({ at, event, detail });
  };
  add(o.createdAt, "Order placed");
  add(o.payment?.paidAt, "Payment received");
  add(o.shipping?.pickupScheduledAt, "Pickup booked", o.shipping?.courierName);
  add(o.shipping?.shippedAt, "Shipped", o.shipping?.courierName);
  add(o.shipping?.deliveredAt, "Delivered");
  add(o.returnInfo?.requestedAt, "Return / complaint received");
  add(o.returnInfo?.approvedAt, "Return approved");
  add(o.returnInfo?.rejectedAt, "Return rejected");
  for (const n of o.creditNotes || []) add(n.date, `Credit note ${n.number}`, formatINR(n.amount));
  return list;
}

export default function OrderTimeline({ order }: { order: TimelineOrder }) {
  const recorded = order.history || [];
  const firstRecorded = recorded.length ? new Date(recorded[0].at).getTime() : Infinity;
  const older = eventsFromDates(order)
    .filter((e) => new Date(e.at).getTime() < firstRecorded - 1000)
    .map((e) => ({ ...e, fromDates: true }));
  const events = [...older, ...recorded.map((e) => ({ ...e, fromDates: false }))]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <History className="h-4 w-4" />
        <span>History</span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-text-secondary">Nothing recorded yet.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-black/10 pl-4">
          {events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-primary" />
              <div className="font-medium text-text-primary">{e.event}</div>
              {e.detail && <div className="mt-0.5 break-words text-text-secondary">{e.detail}</div>}
              <div className="mt-0.5 text-xs text-text-secondary">
                {formatDate(e.at, true)}
                {e.fromDates ? " · from the order's dates" : e.by ? ` · ${e.by}` : ""}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
