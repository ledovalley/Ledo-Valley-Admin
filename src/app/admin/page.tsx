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

interface Stats {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
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

type OrderStatus = "PAYMENT_SUCCESS" | "PAYMENT_PENDING" | "CANCELLED" | "COMPLETED" | "DELIVERED";

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
  salesChart: SalesData[];
  comparisonChart: ComparisonData[];
  recentOrders: Order[];
  topProducts: TopProduct[];
}

const RANGE_OPTIONS = ["1d", "7d", "30d", "90d"] as const;
type Range = (typeof RANGE_OPTIONS)[number];

const statusClasses: Record<OrderStatus, string> = {
  PAYMENT_SUCCESS: "bg-green-50 text-green-700, ring-1 ring-green-200",
  PAYMENT_PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  DELIVERED: "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
};

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
              Track revenue, orders, product performance, and recent transactions
              from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          meta="Across selected range"
          icon={<ChartNoAxesCombined className="h-5 w-5" />}
        />
        <StatCard
          title="Gross Profit"
          value={`₹${stats.totalProfit.toLocaleString("en-IN")}`}
          meta={`${stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0}% Margin`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Orders"
          value={stats.totalOrders}
          meta="Completed and active"
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          meta="Unique buyers"
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

            <div className="flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${range === r
                    ? "bg-bg-dark text-white"
                    : "border border-black/10 bg-bg-surface text-gray-600 hover:bg-gray-50"
                    }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-neutral-50/60 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Peak Revenue
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                ₹{peakRevenue.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-50/60 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Selected Range
              </div>
              <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-gray-900">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                {range.toUpperCase()}
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
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <p className="mt-1 text-sm text-gray-500">
                Latest transactions across the store.
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
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[order.status]
                          }`}
                      >
                        {order.status.replaceAll("_", " ")}
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
                No recent orders found.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  meta,
  icon,
}: {
  title: string;
  value: string | number;
  meta: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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