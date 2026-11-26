"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LineChart as LineIcon, Loader2, RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { formatDate, formatINR } from "@/lib/orderFlow";

interface Insights {
  summary: {
    customers: number;
    repeatCustomers: number;
    repeatRate: number;
    cameBackWithin60Days: number | null;
    medianDaysToSecondOrder: number | null;
    ordersPerCustomer: number;
    averageOrder: number;
    revenueFromRepeat: number;
  };
  topCustomers: { id: string; name: string; email: string; phone: string; orders: number; spend: number; firstOrder: string; lastOrder: string }[];
  firstOrderTeas: { name: string; customers: number; cameBack: number; cameBackRate: number }[];
  secondOrderTeas: { name: string; customers: number }[];
  states: { state: string; orders: number; customers: number; revenue: number; averageOrder: number }[];
  months: { month: string; orders: number; revenue: number; newCustomers: number; returningOrders: number; averageOrder: number }[];
}

const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-text-primary">{value}</dd>
      {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-bg-dark/10 bg-bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {hint && <p className="mt-1 text-sm text-text-secondary">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Insights>("/admin/insights");
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;
  const maxState = Math.max(1, ...(data?.states || []).map((x) => x.revenue));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-bg-dark/10 bg-bg-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-text-primary">
              <LineIcon className="h-6 w-6" /> Customer insights
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Who buys, how often they come back, what they start with and where they are. Paid orders only, refunds taken off.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {s && (
          <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Customers who've paid" value={String(s.customers)} hint={`${s.ordersPerCustomer} orders each on average`} />
            <Stat
              label="Ordered again"
              value={`${s.repeatRate}%`}
              hint={`${s.repeatCustomers} customer${s.repeatCustomers === 1 ? "" : "s"} with 2+ orders`}
            />
            <Stat
              label="Came back within 60 days"
              value={s.cameBackWithin60Days === null ? "–" : `${s.cameBackWithin60Days}%`}
              hint={s.medianDaysToSecondOrder === null ? "Not enough repeat orders yet" : `Second order usually after ~${s.medianDaysToSecondOrder} days`}
            />
            <Stat label="Revenue from repeat orders" value={`${s.revenueFromRepeat}%`} hint={`Average order ${formatINR(s.averageOrder)}`} />
          </dl>
        )}
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
        </div>
      ) : data ? (
        <>
          <Card title="Last 12 months" hint="Orders from new customers and from customers ordering again.">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.months.map((m) => ({ ...m, label: monthLabel(m.month) }))} accessibilityLayer>
                  <CartesianGrid stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(label, payload) => {
                      const m = ((payload as unknown as { payload?: Insights["months"][number] }[])?.[0]?.payload ||
                        {}) as Partial<Insights["months"][number]>;
                      return `${String(label)} · ${formatINR(m.revenue || 0)} · avg ${formatINR(m.averageOrder || 0)}`;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="newCustomers" name="New customers" stackId="o" fill="#7c5c45" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="returningOrders" name="Returning orders" stackId="o" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-text-secondary">
                  <tr>
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4 text-right">Orders</th>
                    <th className="py-2 pr-4 text-right">New</th>
                    <th className="py-2 pr-4 text-right">Returning</th>
                    <th className="py-2 pr-4 text-right">Revenue</th>
                    <th className="py-2 text-right">Avg order</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.months].reverse().filter((m) => m.orders > 0).map((m) => (
                    <tr key={m.month} className="border-t border-black/5">
                      <td className="py-2 pr-4">{monthLabel(m.month)}</td>
                      <td className="py-2 pr-4 text-right">{m.orders}</td>
                      <td className="py-2 pr-4 text-right">{m.newCustomers}</td>
                      <td className="py-2 pr-4 text-right">{m.returningOrders}</td>
                      <td className="py-2 pr-4 text-right">{formatINR(m.revenue)}</td>
                      <td className="py-2 text-right">{formatINR(m.averageOrder)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card
              title="What first orders start with"
              hint="The tea in each customer's first order, and how many of them ordered again. Good candidates for your ads."
            >
              {data.firstOrderTeas.length === 0 ? (
                <p className="text-sm text-text-secondary">No orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-text-secondary">
                    <tr>
                      <th className="py-2 pr-4">Tea</th>
                      <th className="py-2 pr-4 text-right">First orders</th>
                      <th className="py-2 text-right">Ordered again</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.firstOrderTeas.map((t) => (
                      <tr key={t.name} className="border-t border-black/5">
                        <td className="py-2 pr-4">{t.name}</td>
                        <td className="py-2 pr-4 text-right">{t.customers}</td>
                        <td className="py-2 text-right">
                          {t.cameBack} <span className="text-text-secondary">({t.cameBackRate}%)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {data.secondOrderTeas.length > 0 && (
                <p className="mt-3 text-xs text-text-secondary">
                  Most bought in second orders: {data.secondOrderTeas.map((t) => `${t.name} (${t.customers})`).join(", ")}.
                </p>
              )}
            </Card>

            <Card title="Where customers are" hint="Top states by revenue.">
              {data.states.length === 0 ? (
                <p className="text-sm text-text-secondary">No orders yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.states.map((st) => (
                    <li key={st.state}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium text-text-primary">{st.state}</span>
                        <span className="text-text-secondary">
                          {formatINR(st.revenue)} · {st.orders} order{st.orders === 1 ? "" : "s"} · {st.customers} customer{st.customers === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/5" aria-hidden="true">
                        <div className="h-full rounded-full bg-brand-primary" style={{ width: `${Math.max(2, (st.revenue / maxState) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card title="Top customers" hint="By what they've spent (refunds taken off). Worth a thank-you note or an early look at new teas.">
            {data.topCustomers.length === 0 ? (
              <p className="text-sm text-text-secondary">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-text-secondary">
                    <tr>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4 text-right">Orders</th>
                      <th className="py-2 pr-4 text-right">Spent</th>
                      <th className="py-2 pr-4">First order</th>
                      <th className="py-2">Last order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCustomers.map((c) => (
                      <tr key={c.id} className="border-t border-black/5">
                        <td className="py-2 pr-4">
                          <Link href={`/admin/customers/${c.id}`} className="font-medium text-text-primary hover:underline">
                            {c.name || c.email || c.phone}
                          </Link>
                          <div className="text-xs text-text-secondary">{[c.phone, c.email].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className="py-2 pr-4 text-right">{c.orders}</td>
                        <td className="py-2 pr-4 text-right">{formatINR(c.spend)}</td>
                        <td className="py-2 pr-4">{formatDate(c.firstOrder)}</td>
                        <td className="py-2">{formatDate(c.lastOrder)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
