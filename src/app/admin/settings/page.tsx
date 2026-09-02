"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";

export default function SettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    codCharge: 29,
    freeShippingThreshold: 1000,
    flatShippingCharge: 90,
    gstPercent: 5,
    companyName: "Ledo Valley",
    companyEmail: "hello@ledovalley.com",
    companyPhone: "+91 000 000 0000",
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get("/admin/settings");
      if (res.data) setSettings(res.data);
    } catch (err) {
      error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      success("Settings updated successfully!");
    } catch (err) {
      error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Global Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage company details, shipping, and order charges.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-bg-dark px-4 py-2 text-sm font-medium text-text-on-dark transition-all hover:bg-bg-dark/90 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* CHARGES SECTION */}
        <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Pricing & Charges</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">COD Charge (₹)</label>
              <input
                type="number"
                name="codCharge"
                value={settings.codCharge}
                onChange={handleChange}
                className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Flat Shipping Charge (₹)</label>
              <input
                type="number"
                name="flatShippingCharge"
                value={settings.flatShippingCharge}
                onChange={handleChange}
                className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Free Shipping Min Order (₹)</label>
              <input
                type="number"
                name="freeShippingThreshold"
                value={settings.freeShippingThreshold}
                onChange={handleChange}
                className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">GST Percentage (%)</label>
              <input
                type="number"
                name="gstPercent"
                value={settings.gstPercent}
                onChange={handleChange}
                className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>
          </div>
        </div>

        {/* COMPANY DETAILS */}
        <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Company Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-text-primary">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Support Email</label>
              <input
                type="email"
                name="companyEmail"
                value={settings.companyEmail}
                onChange={handleChange}
                className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Support Phone</label>
              <input
                type="text"
                name="companyPhone"
                value={settings.companyPhone}
                onChange={handleChange}
                className="w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
