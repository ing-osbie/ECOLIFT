'use client';

import React, { useEffect, useState } from 'react';
import { StatCard } from '@/components/stat-card';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { WasteDistributionChart } from '@/components/charts/waste-distribution-chart';
import { StatusBadge } from '@/components/status-badge';
import { getSystemStats, getAllOrders } from '@/lib/supabase/admin';
import { SystemStats } from '@/types/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  Banknote,
  AlertTriangle,
  Radio,
  RefreshCcw,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, oData] = await Promise.all([
        getSystemStats(),
        getAllOrders(),
      ]);
      setStats(sData);
      setRecentOrders(oData.slice(0, 5));
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Platform Operational Overview
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Real-time logistics analytics, active requests, and fleet metrics.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary Operational Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers"
          value={stats?.total_customers || 0}
          change="+12%"
          icon={Users}
          accentColor="text-sky-400 bg-sky-500/10 border-sky-500/20"
          subtitle={`${stats?.active_customers || 0} verified accounts`}
        />

        <StatCard
          title="Fleet Collectors"
          value={stats?.total_collectors || 0}
          change={`${stats?.online_collectors || 0} Online`}
          isPositive={true}
          icon={Truck}
          accentColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          subtitle={`${stats?.online_collectors || 0} active on route`}
        />

        <StatCard
          title="Active Pickups"
          value={stats?.active_pickups || 0}
          icon={Radio}
          accentColor="text-amber-400 bg-amber-500/10 border-amber-500/20"
          subtitle="En route & pending dispatch"
        />

        <StatCard
          title="Today's Gross Revenue"
          value={formatCurrency(stats?.today_revenue || 0)}
          change="+18%"
          icon={Banknote}
          accentColor="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          subtitle={`${stats?.today_orders || 0} orders processed today`}
        />
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Completed Pickups</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {stats?.completed_pickups || 0}
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Cancellation Rate</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {stats?.total_customers ? ((stats.cancelled_pickups / (stats.completed_pickups + stats.cancelled_pickups || 1)) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <XCircle className="w-6 h-6 text-rose-400" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Pending Support Tickets</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {stats?.pending_tickets || 0}
            </span>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Active Schedules</span>
            <span className="text-xl font-bold text-white mt-1 block">
              {stats?.pending_schedules || 0}
            </span>
          </div>
          <Package className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <WasteDistributionChart />
        </div>
      </div>

      {/* Recent Orders Activity Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Recent Live Orders</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time stream of incoming pickup requests</p>
          </div>
          <a href="/orders" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            View All Orders →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Waste Category</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-lg">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No recent orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {order.customer?.full_name || 'Customer'}
                    </td>
                    <td className="px-4 py-3 capitalize">{order.waste_type?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-xs">
                      {order.pickup_address || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      {formatCurrency(Number(order.price) || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
