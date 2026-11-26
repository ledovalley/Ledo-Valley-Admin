"use client";

import { useState } from "react";
import { Loader2, StickyNote, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDate } from "@/lib/orderFlow";

export interface OrderNote {
  _id: string;
  text: string;
  at: string;
  by?: string;
}

/** Staff-only notes on an order. Customers never see these. */
export default function OrderNotes({
  orderId,
  notes,
  onChange,
}: {
  orderId: string;
  notes: OrderNote[];
  onChange: (notes: OrderNote[]) => void;
}) {
  const { success, error: showError } = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    try {
      setSaving(true);
      const res = await api.post(`/admin/orders/${orderId}/notes`, { text: value });
      onChange(res.data.notes || []);
      setText("");
      success("Note added");
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (note: OrderNote) => {
    if (!window.confirm("Delete this note?")) return;
    try {
      setDeleting(note._id);
      const res = await api.delete(`/admin/orders/${orderId}/notes/${note._id}`);
      onChange(res.data.notes || []);
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <StickyNote className="h-4 w-4" />
        <span>Staff notes</span>
      </div>
      <p className="mb-4 text-xs text-text-secondary">Only staff see these. The customer never does.</p>

      {notes.length > 0 && (
        <ul className="mb-4 space-y-3">
          {[...notes].reverse().map((n) => (
            <li key={n._id} className="group rounded-xl bg-amber-50/70 px-3 py-2.5 text-sm">
              <p className="whitespace-pre-wrap break-words text-text-primary">{n.text}</p>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-text-secondary">
                <span>
                  {n.by || "Staff"} · {formatDate(n.at, true)}
                </span>
                <button
                  onClick={() => remove(n)}
                  disabled={deleting === n._id}
                  aria-label="Delete note"
                  className="rounded p-1 text-text-secondary opacity-60 transition hover:bg-red-50 hover:text-red-600 hover:opacity-100 disabled:opacity-40"
                >
                  {deleting === n._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-2">
        <label htmlFor="order-note" className="sr-only">
          Add a note
        </label>
        <textarea
          id="order-note"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="e.g. Customer called, asked for delivery after Friday"
          className="w-full resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
        />
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-bg-dark px-4 py-2 text-sm font-medium text-white transition hover:bg-bg-dark/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Add note
        </button>
      </form>
    </div>
  );
}
