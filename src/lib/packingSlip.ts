// Printable packing slips (one per page) for one or more orders.
// Open the window synchronously inside the click handler (openPrintWindow),
// then fill it once the order details have loaded (writePackingSlips),
// so pop-up blockers don't stop it.

export interface SlipOrder {
  orderNumber: string;
  createdAt: string;
  customerSnapshot?: { name?: string; phone?: string; email?: string };
  shippingAddress?: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: { productName: string; variantSku?: string; quantity: number }[];
  payment?: { method?: string; status?: string };
  shipping?: { awbCode?: string; courierName?: string };
  grandTotal?: number;
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function openPrintWindow(): Window | null {
  const w = window.open("", "_blank", "width=820,height=900");
  if (w) {
    w.document.write(
      "<p style='font:14px system-ui;padding:24px'>Preparing packing slips…</p>"
    );
  }
  return w;
}

export function addressLines(a: SlipOrder["shippingAddress"]) {
  if (!a) return [];
  return [
    a.addressLine1,
    a.addressLine2,
    a.landmark ? `Landmark: ${a.landmark}` : "",
    [a.city, a.state].filter(Boolean).join(", ") + (a.pincode ? ` – ${a.pincode}` : ""),
  ].filter((l) => l && l.trim());
}

function slipHtml(o: SlipOrder) {
  const a = o.shippingAddress ?? {};
  const phone = a.phone || o.customerSnapshot?.phone || "";
  const date = new Date(o.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const units = o.items.reduce((s, i) => s + i.quantity, 0);

  return `
  <section class="slip">
    <header>
      <div><div class="brand">LEDO VALLEY</div><div class="muted">Packing slip</div></div>
      <div class="right"><div class="ord">#${esc(o.orderNumber)}</div><div class="muted">${esc(date)}</div></div>
    </header>
    <div class="ship">
      <div class="label">Ship to</div>
      <div class="name">${esc(a.name || o.customerSnapshot?.name)}</div>
      ${addressLines(a).map((l) => `<div>${esc(l)}</div>`).join("")}
      ${phone ? `<div class="phone">Phone: ${esc(phone)}</div>` : ""}
    </div>
    <table>
      <thead><tr><th class="chk"></th><th>Item</th><th>SKU</th><th class="qty">Qty</th></tr></thead>
      <tbody>
        ${o.items
          .map(
            (i) =>
              `<tr><td class="chk">☐</td><td>${esc(i.productName)}</td><td class="muted">${esc(i.variantSku)}</td><td class="qty">${esc(i.quantity)}</td></tr>`
          )
          .join("")}
      </tbody>
      <tfoot><tr><td></td><td colspan="2">Total units</td><td class="qty">${units}</td></tr></tfoot>
    </table>
    ${o.shipping?.awbCode ? `<div class="awb">Courier: ${esc(o.shipping.courierName)} · AWB ${esc(o.shipping.awbCode)}</div>` : ""}
    <div class="muted foot">Payment: ${esc(o.payment?.method || "Online")} · ${esc(o.payment?.status || "")}</div>
  </section>`;
}

export function writePackingSlips(w: Window, orders: SlipOrder[]) {
  const css = `
    *{box-sizing:border-box} body{font:13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:0}
    .slip{padding:28px 32px;page-break-after:always;max-width:780px;margin:0 auto}
    .slip:last-child{page-break-after:auto}
    header{display:flex;justify-content:space-between;border-bottom:2px solid #0d4728;padding-bottom:10px;margin-bottom:16px}
    .brand{font-weight:700;letter-spacing:.12em;color:#0d4728;font-size:16px}
    .ord{font-weight:700;font-size:18px} .right{text-align:right} .muted{color:#666}
    .ship{border:1px solid #ccc;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:15px}
    .label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#666;margin-bottom:4px}
    .name{font-weight:700;font-size:16px} .phone{margin-top:6px;font-weight:600}
    table{width:100%;border-collapse:collapse} th,td{text-align:left;padding:7px 6px;border-bottom:1px solid #ddd}
    th{font-size:11px;text-transform:uppercase;color:#666} .qty{text-align:right;width:60px;font-weight:600}
    .chk{width:28px;font-size:16px} .awb{margin-top:12px;font-weight:600} tfoot td{font-weight:600;border-bottom:none} .foot{margin-top:14px;font-size:12px}
    @media print{.slip{padding:18px 8px}}`;

  w.document.open();
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>Packing slips (${orders.length})</title><style>${css}</style></head><body>${orders
      .map(slipHtml)
      .join("")}</body></html>`
  );
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}
