"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/ToastProvider";
import { getErrorMessage } from "@/lib/getErrorMessage";

interface ReferralForm {
  enabled: boolean;
  friendType: "FLAT" | "PERCENT";
  friendValue: number;
  friendMaxDiscount: number | null;
  minOrderAmount: number;
  rewardType: "FLAT" | "PERCENT";
  rewardValue: number;
  rewardMaxDiscount: number | null;
  rewardMinOrderAmount: number;
  rewardValidityDays: number;
  rewardDelayDays: number;
  monthlyRewardCap: number;
}

const REFERRAL_DEFAULTS: ReferralForm = {
  enabled: false,
  friendType: "FLAT",
  friendValue: 100,
  friendMaxDiscount: null,
  minOrderAmount: 499,
  rewardType: "FLAT",
  rewardValue: 100,
  rewardMaxDiscount: null,
  rewardMinOrderAmount: 0,
  rewardValidityDays: 60,
  rewardDelayDays: 7,
  monthlyRewardCap: 5,
};

/* Same checks as the server. */
const referralProblem = (r: ReferralForm): string | null => {
  for (const who of ["friend", "reward"] as const) {
    const type = r[`${who}Type`];
    const value = Number(r[`${who}Value`]);
    const label = who === "friend" ? "Friend's discount" : "Reward";
    if (!(value > 0) || (type === "PERCENT" ? value > 90 : value > 5000)) {
      return type === "PERCENT" ? `${label} must be between 1% and 90%.` : `${label} must be between ₹1 and ₹5000.`;
    }
    const max = r[`${who}MaxDiscount`];
    if (type === "PERCENT" && max !== null && !(Number(max) > 0 && Number(max) <= 5000)) {
      return `${label} cap must be between ₹1 and ₹5000, or empty for no cap.`;
    }
  }
  const whole: [keyof ReferralForm, string, number, number][] = [
    ["minOrderAmount", "Minimum order for a friend's code", 0, 100000],
    ["rewardMinOrderAmount", "Minimum order to use a reward", 0, 100000],
    ["rewardValidityDays", "Reward validity (days)", 7, 365],
    ["rewardDelayDays", "Days after delivery before the reward", 0, 30],
    ["monthlyRewardCap", "Rewards per customer per month", 0, 100],
  ];
  for (const [k, label, min, max] of whole) {
    const n = Number(r[k]);
    if (!Number.isInteger(n) || n < min || n > max) return `${label} must be a whole number from ${min} to ${max}.`;
  }
  if (r.friendType === "FLAT" && r.minOrderAmount && r.friendValue >= r.minOrderAmount) {
    return "The friend's flat discount must be less than the minimum order.";
  }
  return null;
};

interface SettingsForm {
  referral: ReferralForm;
  freeShippingThreshold: number;
  flatShippingCharge: number;
  gstPercent: number;
  lowStockThreshold: number;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
}

/* Same limits as the server. */
const LIMITS: Record<string, { min: number; max: number; label: string }> = {
  flatShippingCharge: { min: 0, max: 1000, label: "Shipping charge" },
  freeShippingThreshold: { min: 0, max: 100000, label: "Free shipping amount" },
  gstPercent: { min: 0, max: 28, label: "GST %" },
  lowStockThreshold: { min: 0, max: 10000, label: "Low stock level" },
};

const inputClass =
  "w-full rounded-xl border border-bg-dark/10 bg-white px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10";

export default function SettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsForm | null>(null);
  const [saved, setSaved] = useState<SettingsForm | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const res = await api.get("/admin/settings");
      const s: SettingsForm = { lowStockThreshold: 10, ...res.data, referral: { ...REFERRAL_DEFAULTS, ...(res.data?.referral || {}) } };
      setSettings(s);
      setSaved(s);
    } catch {
      // Never show placeholder values that could be saved over the real ones.
      setLoadFailed(true);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) =>
      prev ? { ...prev, [name]: type === "number" ? (value === "" ? ("" as unknown as number) : Number(value)) : value } : prev
    );
  };

  const setReferral = <K extends keyof ReferralForm>(key: K, value: ReferralForm[K]) =>
    setSettings((prev) => (prev ? { ...prev, referral: { ...prev.referral, [key]: value } } : prev));

  const numberOrBlank = (v: string) => (v === "" ? ("" as unknown as number) : Number(v));

  const problem = (() => {
    if (!settings) return null;
    for (const [key, rule] of Object.entries(LIMITS)) {
      const v = Number(settings[key as keyof SettingsForm]);
      if (String(settings[key as keyof SettingsForm]) === "" || !Number.isFinite(v) || v < rule.min || v > rule.max) {
        return `${rule.label} must be between ${rule.min} and ${rule.max}.`;
      }
    }
    if (!settings.companyName.trim() || !settings.companyEmail.trim() || !settings.companyPhone.trim()) {
      return "Company name, email and phone can't be empty.";
    }
    return referralProblem(settings.referral);
  })();

  const changed = !!settings && !!saved && JSON.stringify(settings) !== JSON.stringify(saved);

  const handleSave = async () => {
    if (!settings || problem) return;

    // Money settings change every order from now on: confirm them.
    const moneyChanges = (["flatShippingCharge", "freeShippingThreshold", "gstPercent"] as const)
      .filter((k) => saved && settings[k] !== saved[k])
      .map((k) => `${LIMITS[k].label}: ${saved?.[k]} → ${settings[k]}`);
    if (moneyChanges.length && !window.confirm(`This changes what every new order is charged:\n\n${moneyChanges.join("\n")}\n\nSave?`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await api.put("/admin/settings", settings);
      const fresh = res.data?.settings || settings;
      const s: SettingsForm = { lowStockThreshold: 10, ...fresh, referral: { ...REFERRAL_DEFAULTS, ...(fresh?.referral || {}) } };
      setSettings(s);
      setSaved(s);
      success("Settings saved");
    } catch (err) {
      error(getErrorMessage(err));
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

  if (loadFailed || !settings) {
    return (
      <div className="max-w-xl p-0 sm:p-4 lg:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-semibold">Couldn&apos;t load your settings.</p>
          <p className="mt-1">Nothing has been changed. Try again in a moment (the server may be waking up).</p>
          <button
            onClick={fetchSettings}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-0 sm:p-4 lg:p-8 max-w-4xl ${changed ? "pb-24 md:pb-0" : ""}`}>
      {/* Phones: Save stays at the bottom of the screen once something has changed. */}
      {changed && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 p-3 backdrop-blur md:hidden">
          <button
            onClick={handleSave}
            disabled={saving || !!problem}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-bg-dark px-4 py-3 text-sm font-semibold text-text-on-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
          {problem && <p className="mt-2 text-center text-xs text-red-600">{problem}</p>}
        </div>
      )}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Global Settings</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage company details, shipping, and order charges.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !changed || !!problem}
          className="flex items-center gap-2 rounded-xl bg-bg-dark px-4 py-2 text-sm font-medium text-text-on-dark transition-all hover:bg-bg-dark/90 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {changed ? "Save Changes" : "Saved"}
        </button>
      </div>

      {problem && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {problem}
        </p>
      )}

      <div className="space-y-6">
        {/* CHARGES SECTION */}
        <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Pricing & Charges</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="flatShippingCharge" className="mb-2 block text-sm font-medium text-text-primary">
                Shipping charge (₹, includes 5% GST)
              </label>
              <input id="flatShippingCharge" type="number" min={0} max={1000} name="flatShippingCharge" value={settings.flatShippingCharge} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="freeShippingThreshold" className="mb-2 block text-sm font-medium text-text-primary">
                Free shipping from (₹ of tea)
              </label>
              <input id="freeShippingThreshold" type="number" min={0} name="freeShippingThreshold" value={settings.freeShippingThreshold} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="gstPercent" className="mb-2 block text-sm font-medium text-text-primary">
                GST on tea (%)
              </label>
              <input id="gstPercent" type="number" min={0} max={28} name="gstPercent" value={settings.gstPercent} onChange={handleChange} className={inputClass} />
              {settings.gstPercent !== 5 && (
                <p className="mt-1.5 text-xs text-amber-700">Tea (HSN 0902) is normally 5%. Check with your CA before changing this.</p>
              )}
            </div>
          </div>
        </div>

        {/* STOCK */}
        <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Stock</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="lowStockThreshold" className="mb-2 block text-sm font-medium text-text-primary">
                Low stock warning at (units)
              </label>
              <input id="lowStockThreshold" type="number" min={0} name="lowStockThreshold" value={settings.lowStockThreshold} onChange={handleChange} className={inputClass} />
              <p className="mt-1.5 text-xs text-text-secondary">
                A pack with this many or fewer is shown as low stock on the dashboard, the Stock page and the 8 AM summary email.
              </p>
            </div>
          </div>
        </div>

        {/* REFER A FRIEND */}
        <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Refer a friend</h2>
              <p className="text-sm text-text-secondary">
                Each customer gets a code to share. Their friend saves on a first order; they get a reward once it&apos;s delivered.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-text-primary">
              <input
                type="checkbox"
                checked={settings.referral.enabled}
                onChange={(e) => setReferral("enabled", e.target.checked)}
                className="h-4 w-4 accent-brand-primary"
              />
              {settings.referral.enabled ? "On" : "Off"}
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(["friend", "reward"] as const).map((who) => {
              const type = settings.referral[`${who}Type`];
              return (
                <fieldset key={who} className="space-y-3 rounded-xl border border-black/10 p-4">
                  <legend className="px-1 text-sm font-semibold text-text-primary">
                    {who === "friend" ? "Friend gets (first order)" : "Customer who shared gets"}
                  </legend>
                  <div className="flex gap-2" role="radiogroup" aria-label="Discount type">
                    {(["FLAT", "PERCENT"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={type === t}
                        onClick={() => setReferral(`${who}Type`, t)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          type === t ? "border-brand-primary bg-brand-primary/10 text-brand-primary" : "border-black/10 text-text-secondary hover:bg-black/5"
                        }`}
                      >
                        {t === "FLAT" ? "Flat ₹ off" : "% off"}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-text-secondary">
                      {type === "FLAT" ? "Amount (₹)" : "Percent (%)"}
                      <input
                        type="number"
                        min={1}
                        max={type === "FLAT" ? 5000 : 90}
                        value={settings.referral[`${who}Value`]}
                        onChange={(e) => setReferral(`${who}Value`, numberOrBlank(e.target.value))}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    {type === "PERCENT" && (
                      <label className="block text-xs font-medium text-text-secondary">
                        Up to (₹, optional)
                        <input
                          type="number"
                          min={1}
                          value={settings.referral[`${who}MaxDiscount`] ?? ""}
                          onChange={(e) => setReferral(`${who}MaxDiscount`, e.target.value === "" ? null : Number(e.target.value))}
                          className={`${inputClass} mt-1`}
                          placeholder="No cap"
                        />
                      </label>
                    )}
                  </div>
                  <label className="block text-xs font-medium text-text-secondary">
                    {who === "friend" ? "Minimum order (₹ of tea)" : "Minimum order to use the reward (₹)"}
                    <input
                      type="number"
                      min={0}
                      value={settings.referral[who === "friend" ? "minOrderAmount" : "rewardMinOrderAmount"]}
                      onChange={(e) =>
                        setReferral(who === "friend" ? "minOrderAmount" : "rewardMinOrderAmount", numberOrBlank(e.target.value))
                      }
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                </fieldset>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <label className="block text-sm font-medium text-text-primary">
              Reward valid for (days)
              <input
                type="number"
                min={7}
                max={365}
                value={settings.referral.rewardValidityDays}
                onChange={(e) => setReferral("rewardValidityDays", numberOrBlank(e.target.value))}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="block text-sm font-medium text-text-primary">
              Send reward, days after delivery
              <input
                type="number"
                min={0}
                max={30}
                value={settings.referral.rewardDelayDays}
                onChange={(e) => setReferral("rewardDelayDays", numberOrBlank(e.target.value))}
                className={`${inputClass} mt-2`}
              />
              <span className="mt-1.5 block text-xs font-normal text-text-secondary">Time for any quality complaint first.</span>
            </label>
            <label className="block text-sm font-medium text-text-primary">
              Rewards per customer per month
              <input
                type="number"
                min={0}
                max={100}
                value={settings.referral.monthlyRewardCap}
                onChange={(e) => setReferral("monthlyRewardCap", numberOrBlank(e.target.value))}
                className={`${inputClass} mt-2`}
              />
              <span className="mt-1.5 block text-xs font-normal text-text-secondary">0 = no limit.</span>
            </label>
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            Rewards are one-time codes that only work on that customer&apos;s account. They&apos;re emailed, shown on their
            account page and at checkout, and deleted 30 days after they expire. See who referred whom under Referrals.
          </p>
        </div>

        {/* COMPANY DETAILS */}
        <div className="rounded-2xl border border-bg-dark/10 bg-bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Company Information</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-text-primary">Company Name</label>
              <input id="companyName" type="text" name="companyName" value={settings.companyName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="companyEmail" className="mb-2 block text-sm font-medium text-text-primary">Support Email</label>
              <input id="companyEmail" type="email" name="companyEmail" value={settings.companyEmail} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="companyPhone" className="mb-2 block text-sm font-medium text-text-primary">Support Phone</label>
              <input id="companyPhone" type="text" name="companyPhone" value={settings.companyPhone} onChange={handleChange} className={inputClass} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
