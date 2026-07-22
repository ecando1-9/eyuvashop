'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DailySalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

interface TopProductPoint {
  name: string;
  sold: number;
}

interface CustomerGrowthPoint {
  month: string;
  customers: number;
}

interface Props {
  dailySales: DailySalesPoint[];
  monthlyRevenue: MonthlyRevenuePoint[];
  topProducts: TopProductPoint[];
  customerGrowth: CustomerGrowthPoint[];
}

const accent = '#f97316';
const accentSoft = '#fdba74';

const fallbackDaily: DailySalesPoint[] = Array.from({ length: 7 }).map((_, i) => ({
  date: `Day ${i + 1}`,
  revenue: 0,
  orders: 0,
}));

const fallbackMonthly: MonthlyRevenuePoint[] = Array.from({ length: 6 }).map((_, i) => ({
  month: `M${i + 1}`,
  revenue: 0,
}));

const fallbackTop: TopProductPoint[] = [
  { name: 'No data', sold: 0 },
];

const fallbackGrowth: CustomerGrowthPoint[] = Array.from({ length: 6 }).map((_, i) => ({
  month: `M${i + 1}`,
  customers: 0,
}));

export default function AdminDashboardCharts({ dailySales, monthlyRevenue, topProducts, customerGrowth }: Props) {
  const [dailyMetric, setDailyMetric] = useState<'revenue' | 'orders'>('revenue');

  const dailyData = useMemo(() => (dailySales.length ? dailySales : fallbackDaily), [dailySales]);
  const monthlyData = useMemo(() => (monthlyRevenue.length ? monthlyRevenue : fallbackMonthly), [monthlyRevenue]);
  const topData = useMemo(() => (topProducts.length ? topProducts : fallbackTop), [topProducts]);
  const growthData = useMemo(() => (customerGrowth.length ? customerGrowth : fallbackGrowth), [customerGrowth]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Daily Sales</p>
              <h3 className="text-lg font-bold text-slate-900">Revenue & Orders</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setDailyMetric('revenue')}
                className={`px-3 py-1 rounded-full font-semibold ${
                  dailyMetric === 'revenue'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setDailyMetric('orders')}
                className={`px-3 py-1 rounded-full font-semibold ${
                  dailyMetric === 'orders'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(value: number) =>
                    dailyMetric === 'revenue' ? formatCurrency(value) : value
                  }
                  contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
                />
                <Line
                  type="monotone"
                  dataKey={dailyMetric}
                  stroke={accent}
                  strokeWidth={3}
                  dot={{ r: 3, stroke: accent, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Monthly Revenue</p>
            <h3 className="text-lg font-bold text-slate-900">Last 12 Months</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                <Bar dataKey="revenue" fill={accentSoft} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Top Selling Products</p>
            <h3 className="text-lg font-bold text-slate-900">Best Performers</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topData} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                <Bar dataKey="sold" fill={accent} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Customer Growth</p>
            <h3 className="text-lg font-bold text-slate-900">Monthly New Customers</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accent} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }} />
                <Area type="monotone" dataKey="customers" stroke={accent} fillOpacity={1} fill="url(#growth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

