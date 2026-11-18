// Shared order-processing rules for the orders list and the order page.
// Statuses are the backend's values; everything shown to staff uses the
// plain-English labels below.

export type OrderStatus =
  | "PLACED"
  | "PAYMENT_PENDING"
  | "PAYMENT_SUCCESS"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURN_APPROVED"
  | "REFUNDED";

export const STATUS_LABEL: Record<string, string> = {
  PLACED: "New order",
  PAYMENT_PENDING: "Awaiting payment",
  PAYMENT_SUCCESS: "Paid · to pack",
  READY_TO_SHIP: "Pickup booked",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURN_APPROVED: "Return approved",
  REFUNDED: "Refunded",
};

export const PAYMENT_LABEL: Record<string, string> = {
  SUCCESS: "Paid",
  PENDING: "Payment pending",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status.replaceAll("_", " ").toLowerCase();
}

export function paymentLabel(status: string) {
  return PAYMENT_LABEL[status] ?? status;
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "PAYMENT_SUCCESS":
    case "PLACED":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "READY_TO_SHIP":
      return "bg-indigo-100 text-indigo-700 ring-indigo-200";
    case "SHIPPED":
      return "bg-blue-100 text-blue-700 ring-blue-200";
    case "DELIVERED":
      return "bg-green-100 text-green-700 ring-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-700 ring-red-200";
    case "RETURN_REQUESTED":
      return "bg-orange-100 text-orange-700 ring-orange-200";
    case "RETURN_APPROVED":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    case "REFUNDED":
      return "bg-purple-100 text-purple-700 ring-purple-200";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-200";
  }
}

export function paymentBadgeClass(status: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-green-50 text-green-700 ring-green-200";
    case "FAILED":
      return "bg-red-50 text-red-700 ring-red-200";
    case "REFUNDED":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    default:
      return "bg-yellow-50 text-yellow-800 ring-yellow-200";
  }
}

export interface NextStep {
  /** Status the order moves to via PATCH /admin/orders/:id/status */
  to: OrderStatus;
  /** Button text, e.g. "Mark packed" */
  label: string;
  /** Past-tense text for messages, e.g. "packed" */
  done: string;
  /** Short explanation shown in the confirm dialog */
  hint: string;
}

/**
 * The single next fulfilment step for an order, or null when the order
 * needs no simple status change (returns use their own buttons).
 * Mirrors the rules the old order page used.
 */
export function nextStep(order: {
  status: string;
  payment?: { method?: string };
}): NextStep | null {
  const isCodPlaced = order.status === "PLACED" && order.payment?.method === "COD";

  if (order.status === "PAYMENT_SUCCESS" || isCodPlaced) {
    return {
      to: "READY_TO_SHIP",
      label: "Book pickup",
      done: "booked for pickup",
      hint: "This creates the Shiprocket shipment, assigns a courier and requests pickup. Have the parcel packed before the courier arrives.",
    };
  }
  if (order.status === "READY_TO_SHIP") {
    return {
      to: "SHIPPED",
      label: "Mark shipped",
      done: "shipped",
      hint: "Shiprocket normally updates this automatically once the courier collects the parcel. Only use this if it hasn't.",
    };
  }
  if (order.status === "SHIPPED") {
    return {
      to: "DELIVERED",
      label: "Mark delivered",
      done: "delivered",
      hint: "Shiprocket normally updates this automatically. Only use this once delivery is confirmed; it can't be changed afterwards.",
    };
  }
  return null;
}

/** Statuses the backend allows to move to CANCELLED (see allowedTransitions in the API). */
export function canCancel(status: string) {
  return ["PLACED", "PAYMENT_SUCCESS", "READY_TO_SHIP"].includes(status);
}

/** Progress shown on the order page. */
export const PROGRESS_STEPS = [
  { key: "PAID", label: "Paid" },
  { key: "READY_TO_SHIP", label: "Pickup booked" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

/** Index of the last completed progress step, or -1. */
export function progressIndex(order: { status: string; payment?: { status?: string } }) {
  switch (order.status) {
    case "DELIVERED":
    case "RETURN_REQUESTED":
    case "RETURN_APPROVED":
    case "REFUNDED":
      return 3;
    case "SHIPPED":
      return 2;
    case "READY_TO_SHIP":
      return 1;
    case "PAYMENT_SUCCESS":
      return 0;
    default:
      return order.payment?.status === "SUCCESS" ? 0 : -1;
  }
}

export interface OrderTab {
  key: string;
  label: string;
  /** Backend status filter; "" means every status */
  status: string;
  /** Whether to show a live count on the tab */
  counted: boolean;
  empty: string;
}

export const ORDER_TABS: OrderTab[] = [
  { key: "to-pack", label: "To pack", status: "PAYMENT_SUCCESS", counted: true, empty: "Nothing to pack right now." },
  { key: "to-ship", label: "Awaiting pickup", status: "READY_TO_SHIP", counted: true, empty: "No orders waiting for courier pickup." },
  { key: "shipped", label: "Shipped", status: "SHIPPED", counted: true, empty: "No orders in transit." },
  { key: "returns", label: "Return requests", status: "RETURN_REQUESTED", counted: true, empty: "No return requests." },
  { key: "delivered", label: "Delivered", status: "DELIVERED", counted: false, empty: "No delivered orders match." },
  { key: "cancelled", label: "Cancelled", status: "CANCELLED", counted: false, empty: "No cancelled orders match." },
  { key: "all", label: "All orders", status: "", counted: false, empty: "No orders match these filters." },
];

export function formatINR(n: number | undefined | null) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export function formatDate(iso: string, withTime = false) {
  const d = new Date(iso);
  return withTime
    ? d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Public Shiprocket tracking page for an AWB number. */
export function trackingUrl(awb: string) {
  return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
}
