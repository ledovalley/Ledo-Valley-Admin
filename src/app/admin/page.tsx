"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/getErrorMessage";
import {
  ChartNoAxesCombined,
  Users,
  ShoppingCart,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Box,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
  Bar,
} from "recharts";
import { useRouter } from "next/navigation";

interface PeriodStats {
  orders: number;
  revenue: number;
  teaSales: number;
  cost: number;
  profit: number;
  gst: number;
  refunds: number;
  averageOrder: number;
  itemsWithoutCost: number;
}

interface Stats extends PeriodStats {
  newCustomers: number;
  totalCustomers: number;
  totalProducts: number;
}

interface Todo {
  toPack: number;
  awaitingPickup: number;
  needsAttention: number;
  returnRequests: number;
  refundsToProcess: number;
  newEnquiries: number;
  lowStock: number;
  lowStockThreshold: number;
}

interface SalesData {
  date: string;
  revenue: number;
}

interface ComparisonData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  totalSold: number;
  revenue: number;
}

type OrderStatus = string;

interface Order {
  _id: string;
  customerName: string;
  orderNumber: string;
  itemsCount: number;
  total: number;
  status: OrderStatus;
}

interface DashboardData {
  stats: Stats;
  previous?: PeriodStats;
  todo?: Todo;
  salesChart: SalesData[];
  comparisonChart: ComparisonData[];
  recentOrders: Order[];
  topProducts: TopProduct[];
}

const RANGE_OPTIONS = ["1d", "7d", "30d", "90d"] as const;
type Range = (typeof RANGE_OPTIONS)[number];

const statusClasses: Record<string, string> = {
  PAYMENT_SUCCESS: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  READY_TO_SHIP: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200",
  REFUNDED: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  RETURNED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};
const statusLabel: Record<string, string> = { PAYMENT_SUCCESS: "TO PACK", READY_TO_SHIP: "AWAITING PICKUP", RETURNED: "RETURNED TO US" };

const RANGE_LABELS: Record<Range, string> = { "1d": "Today", "7d": "7 days", "30d": "30 days", "90d": "90 days" };

const inr = (n: number | undefined) => `₹${Math.round(Number(n ?? 0)).toLocaleString("en-IN")}`;

/* "+12% vs previous 30 days" */
function change(now: number, before: number | undefined, range: Range) {
  if (before === undefined) return "";
  const period = range === "1d" ? "yesterday" : `previous ${RANGE_LABELS[range]}`;
  if (!before) return now ? `New vs ${period}` : "";
  const pct = Math.round(((now - before) / Math.abs(before)) * 100);
  return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs ${period}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl border border-black/10 bg-bg-surface px-3 py-2 shadow-lg"
      role="tooltip"
      aria-live="polite"
    >
      <div className="mb-1 text-xs font-medium text-gray-500">{label}</div>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-gray-900">
              {entry.name === "Revenue"
                ? `₹${Number(entry.value ?? 0).toLocaleString("en-IN")}`
                : Number(entry.value ?? 0).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("30d");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const router = useRouter();

  const fetchDashboard = useCallback(
    async (silent = false) => {
      try {
        if (silent) setRefreshing(true);
        else setLoading(true);

        const res = await api.get<DashboardData>(
          `/admin/dashboard/stats?range=${range}`
        );

        setData(res.data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const peakRevenue = useMemo(() => {
    if (!data?.salesChart?.length) return 0;
    return Math.max(...data.salesChart.map((d) => d.revenue));
  }, [data]);

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error || "Failed to load dashboard"}
      </div>
    );
  }

  const {
    stats,
    previous,
    todo,
    salesChart = [],
    recentOrders = [],
    topProducts = [],
    comparisonChart = [],
  } = data;

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-black/10 bg-bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              Admin Analytics
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              Dashboard Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Paid orders only, by payment date (India time), with refunds taken off.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1 rounded-xl border border-black/10 bg-gray-50 p-1" role="group" aria-label="Period">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${range === r ? "bg-bg-dark text-white" : "text-gray-600 hover:bg-black/5"}`}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-black/10 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
                : "Updating..."}
            </div>

            <button
              onClick={() => fetchDashboard(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-bg-surface px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-black/5"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {todo && <TodoStrip todo={todo} onOpen={(href) => router.push(href)} />}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={`Revenue · ${RANGE_LABELS[range]}`}
          value={inr(stats.revenue)}
          meta={[change(stats.revenue, previous?.revenue, range), stats.refunds ? `${inr(stats.refunds)} refunded` : ""].filter(Boolean).join(" · ") || "Money received from paid orders"}
          icon={<ChartNoAxesCombined className="h-5 w-5" />}
        />
        <StatCard
          title="Gross profit"
          value={inr(stats.profit)}
          meta={
            stats.itemsWithoutCost
              ? `⚠ Cost price missing for ${stats.itemsWithoutCost} item(s): profit shown too high`
              : `${stats.teaSales > 0 ? ((stats.profit / stats.teaSales) * 100).toFixed(1) : 0}% of tea sales excl. GST (${inr(stats.teaSales)})`
          }
          hint="Tea sales excluding GST and shipping, minus the cost price of the tea."
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Orders"
          value={stats.orders}
          meta={[change(stats.orders, previous?.orders, range), stats.orders ? `avg ${inr(stats.averageOrder)}` : ""].filter(Boolean).join(" · ") || "Paid orders"}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          title="New customers"
          value={stats.newCustomers}
          meta={`${stats.totalCustomers.toLocaleString("en-IN")} accounts in total · GST collected ${inr(stats.gst)}`}
          icon={<Users className="h-5 w-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_380px]">
        <div className="rounded-[28px] border border-black/10 bg-bg-surface p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
              <p className="mt-1 text-sm text-gray-500">
                Revenue performance across the selected time window.
              </p>
            </div>

          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-neutral-50/60 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {range === "1d" ? "Best hour" : "Best day"}
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                ₹{peakRevenue.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-50/60 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Average order
              </div>
              <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-gray-900">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                {inr(stats.averageOrder)}
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={salesChart} accessibilityLayer>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5c45" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#7c5c45" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickFormatter={(v) => `₹${Number(v).toLocaleString("en-IN")}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#7c5c45"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
              <p className="mt-1 text-sm text-gray-500">
                Best performers by sales volume.
              </p>
            </div>
            <Box className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {topProducts.length ? (
              topProducts.map((product, index) => {
                const maxSold = topProducts[0]?.totalSold || 1;
                const width = (product.totalSold / maxSold) * 100;

                return (
                  <div
                    key={`${product.name}-${index}`}
                    className="rounded-2xl border border-black/10 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {index + 1}
                        </div>
                        <div>
                          <div className="line-clamp-1 text-sm font-semibold text-gray-900">
                            {product.name}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {product.totalSold} sold
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm font-semibold text-text-primary">
                        ₹{Number(product.revenue).toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-bg-dark"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-500">
                No product data available for this range.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-black/10 bg-bg-surface p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Revenue vs Orders</h2>
            <p className="mt-1 text-sm text-gray-500">
              Compare revenue and order volume over time.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={comparisonChart} accessibilityLayer>
              <defs>
                <linearGradient id="comparisonRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#4f46e5"
                fill="url(#comparisonRevenue)"
                strokeWidth={2.5}
              />
              <Bar
                yAxisId="right"
                dataKey="orders"
                name="Orders"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[28px] border border-black/10 bg-bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Latest paid orders</h2>
              <p className="mt-1 text-sm text-gray-500">
                Most recent payments in this period.
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/orders")}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 transition hover:text-gray-900"
            >
              View all
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders.length ? (
              recentOrders.map((order) => (
                <button
                  key={order._id}
                  onClick={() => router.push(`/admin/orders/${order._id}`)}
                  className="flex w-full items-center justify-between rounded-2xl border border-black/10 p-4 text-left transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {order.customerName}
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[order.status] || "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
                          }`}
                      >
                        {statusLabel[order.status] || order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      #{order.orderNumber} • {order.itemsCount} items
                    </div>
                  </div>

                  <div className="pl-4 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{Number(order.total).toLocaleString("en-IN")}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-500">
                No paid orders in this period.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* Today's jobs, always current (not tied to the period). */
function TodoStrip({ todo, onOpen }: { todo: Todo; onOpen: (href: string) => void }) {
  const items = [
    { label: "To pack", n: todo.toPack, href: "/admin/orders?tab=to-pack", urgent: true },
    { label: "Awaiting pickup", n: todo.awaitingPickup, href: "/admin/orders?tab=to-ship" },
    { label: "Needs attention", n: todo.needsAttention, href: "/admin/orders?tab=attention", urgent: true },
    { label: "Refunds to process", n: todo.refundsToProcess, href: "/admin/orders?tab=refunds", urgent: true },
    { label: "Return requests", n: todo.returnRequests, href: "/admin/orders?tab=returns", hideIfZero: true },
    { label: "New enquiries", n: todo.newEnquiries, href: "/admin/inquiries" },
    { label: `Low stock (≤ ${todo.lowStockThreshold})`, n: todo.lowStock, href: "/admin/stock?filter=low", urgent: true },
  ].filter((i) => !(i.hideIfZero && !i.n));

  return (
    <section aria-label="To do" className="rounded-[28px] border border-black/10 bg-bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">To do now</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {items.map((i) => (
          <button
            key={i.label}
            onClick={() => onOpen(i.href)}
            className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
              i.n && i.urgent ? "border-amber-300 bg-amber-50" : "border-black/10 bg-white"
            }`}
          >
            <div className={`text-2xl font-semibold ${i.n && i.urgent ? "text-amber-900" : "text-gray-900"}`}>{i.n}</div>
            <div className="mt-1 text-xs text-gray-600">{i.label}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  meta,
  icon,
  hint,
}: {
  title: string;
  value: string | number;
  meta: string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div title={hint} className="rounded-3xl border border-black/10 bg-bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">{title}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </div>
          <div className="mt-2 text-xs text-gray-500">{meta}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-[28px] bg-bg-surface" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-bg-surface" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_380px]">
        <div className="h-115 rounded-[28px] bg-bg-surface" />
        <div className="h-115 rounded-[28px] bg-bg-surface" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-105 rounded-[28px] bg-bg-surface" />
        <div className="h-105 rounded-[28px] bg-bg-surface" />
      </div>
    </div>
  );
}