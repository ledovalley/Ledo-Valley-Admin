import api from "@/lib/api";

export type ExportType = "orders" | "items";
export type ExportScope = "all" | "sales";

const fallbackName = (type: ExportType, scope: ExportScope) =>
  `ledo-valley-${scope === "sales" ? "sales" : "orders"}${type === "items" ? "-items" : ""}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

/* Error replies come back as a Blob when we ask for a file: read the message out of it. */
async function messageFrom(err: unknown): Promise<string> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } catch {
      // not JSON
    }
  }
  return "Couldn't download the export. Please try again.";
}

/**
 * Download orders as a CSV file (opens in Excel / Google Sheets).
 * @returns number of orders in the file, if the server said.
 */
export async function downloadOrdersCsv(
  params: Record<string, string>,
  type: ExportType,
  scope: ExportScope
): Promise<number | null> {
  try {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
    const res = await api.get("/admin/orders/export", {
      params: { ...clean, type, scope },
      responseType: "blob",
      timeout: 120000,
    });

    const disposition = String(res.headers?.["content-disposition"] || "");
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || fallbackName(type, scope);

    const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);

    const count = Number(res.headers?.["x-row-count"]);
    return Number.isFinite(count) ? count : null;
  } catch (err) {
    throw new Error(await messageFrom(err));
  }
}

/** Download the monthly GST summary (GSTR-1 layout) for "YYYY-MM". */
export async function downloadGstSummary(month: string): Promise<void> {
  try {
    const res = await api.get("/admin/reports/gst-summary", {
      params: { month },
      responseType: "blob",
      timeout: 120000,
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `ledo-valley-gst-summary_${month}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (err) {
    throw new Error(await messageFrom(err));
  }
}
