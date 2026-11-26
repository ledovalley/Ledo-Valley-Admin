import api from "@/lib/api";

function saveBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export async function downloadInvoice(orderId: string, orderNumber: string) {
  const res = await api.get(`/admin/orders/${orderId}/invoice`, { responseType: "blob" });
  saveBlob(res.data, `Invoice-${orderNumber}.pdf`);
}

/* One credit note (index 0 = first refund on the order). */
export async function downloadCreditNote(orderId: string, index: number, number: string) {
  const res = await api.get(`/admin/orders/${orderId}/credit-notes/${index}`, { responseType: "blob" });
  saveBlob(res.data, `Credit-Note-${number.replaceAll("/", "-")}.pdf`);
}

export async function downloadBulkInvoices(params: Record<string, string>) {
  const res = await api.get(`/admin/orders/bulk-invoice`, { params, responseType: "blob" });
  saveBlob(res.data, `Invoices-${new Date().toISOString().split("T")[0]}.pdf`);
}
