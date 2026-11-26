import api from "@/lib/api";

export interface PrintResult {
  skipped: string[];
  failed: string[];
}

/**
 * Get Shiprocket shipping labels or the pickup manifest for some orders and
 * open the PDF in a new tab. The tab is opened straight away (before the
 * request) so the browser doesn't block it as a pop-up.
 */
export async function openShiprocketPdf(kind: "labels" | "manifest", orderIds: string[]): Promise<PrintResult> {
  const tab = typeof window !== "undefined" ? window.open("", "_blank") : null;
  if (tab) {
    tab.document.title = kind === "labels" ? "Shipping labels" : "Manifest";
    tab.document.body.innerHTML =
      '<p style="font:16px system-ui;padding:24px;color:#444">Getting the PDF from Shiprocket…</p>';
  }
  try {
    const res = await api.post(`/admin/orders/${kind}`, { orderIds });
    const url: string = res.data.url;
    if (tab) tab.location.href = url;
    else window.location.href = url;
    return { skipped: res.data.skipped || [], failed: res.data.failed || [] };
  } catch (err) {
    tab?.close();
    throw err;
  }
}
