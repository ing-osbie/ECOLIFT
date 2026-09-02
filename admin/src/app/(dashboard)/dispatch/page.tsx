'use client';

import React, { useEffect, useState } from 'react';
import { getAllOrders, getAllCollectors, assignCollectorToOrder } from '@/lib/supabase/admin';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Radio,
  Truck,
  MapPin,
  UserCheck,
  CheckCircle2,
  RefreshCcw,
  Search,
  AlertCircle,
} from 'lucide-react';

export default function DispatchPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [assigningCollectorId, setAssigningCollectorId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'en_route'>('unassigned');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [oData, cData] = await Promise.all([
        getAllOrders(),
        getAllCollectors(),
      ]);
      setOrders(oData);
      setCollectors(cData);
    } catch (err) {
      console.warn('Dispatch load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async () => {
    if (!selectedOrder || !assigningCollectorId) return;
    setSubmitting(true);
    try {
      await assignCollectorToOrder(selectedOrder.id, assigningCollectorId);
      await loadData();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err.message || 'Failed to assign collector');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'unassigned') return !o.collector_id && o.status !== 'completed' && o.status !== 'cancelled';
    if (filter === 'en_route') return o.status === 'en_route' || o.status === 'confirmed';
    return true;
  }).filter((o) =>
    (o.pickup_address || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.customer?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const onlineCollectors = collectors.filter((c) => c.is_online);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Live Operations & Fleet Dispatch
            </h2>
          </div>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Real-time fleet monitoring, unassigned pickup matching, and collector re-assignment.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Grid Layout: Dispatch List & Live Map Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('unassigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filter === 'unassigned'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Unassigned ({orders.filter((o) => !o.collector_id && o.status !== 'completed' && o.status !== 'cancelled').length})
              </button>
              <button
                onClick={() => setFilter('en_route')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filter === 'en_route'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                En Route / Confirmed ({orders.filter((o) => o.status === 'en_route' || o.status === 'confirmed').length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Orders ({orders.length})
              </button>
            </div>

            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
                No orders matching filter.
              </div>
            ) : (
              filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{o.id.substring(0, 8)}
                      </span>
                      <StatusBadge status={o.status} />
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {formatCurrency(Number(o.price) || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span>{o.customer?.full_name || 'Customer'}</span>
                      <span className="text-xs font-normal text-slate-400">({o.customer?.phone || 'No phone'})</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{o.pickup_address || 'Accra, Ghana'}</span>
                    </div>
                  </div>

                  {/* Assigned / Action */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                    {o.collector ? (
                      <div className="text-right">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                          Assigned Collector
                        </span>
                        <span className="text-xs font-semibold text-white block">
                          {o.collector.full_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Needs Collector</span>
                      </span>
                    )}

                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                    >
                      {o.collector_id ? 'Reassign' : 'Assign Fleet'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Fleet Status & Assignment Modal */}
        <div className="space-y-4">
          {/* Active Fleet Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Online Fleet ({onlineCollectors.length})</h3>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {onlineCollectors.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No collectors currently online.</p>
              ) : (
                onlineCollectors.map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">{c.profile?.full_name || 'Collector'}</span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {c.vehicle_name || 'Tricycle'} · {c.plate_number || 'GRN-2024'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400">★ {Number(c.rating || 5).toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 block">{c.total_jobs || 0} jobs</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Interactive Assignment Modal Box */}
          {selectedOrder && (
            <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm">Assign Fleet Collector</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-slate-400">Target Order: <span className="font-mono text-white font-bold">#{selectedOrder.id.substring(0, 8)}</span></p>
                <p className="text-slate-400">Customer: <span className="text-white font-semibold">{selectedOrder.customer?.full_name}</span></p>
                <p className="text-slate-400">Pickup Address: <span className="text-white font-medium">{selectedOrder.pickup_address}</span></p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Select Available Collector</label>
                <select
                  value={assigningCollectorId}
                  onChange={(e) => setAssigningCollectorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Collector --</option>
                  {collectors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.profile?.full_name || 'Collector'} ({c.vehicle_name || 'Tricycle'}) — ★ {c.rating}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAssign}
                disabled={submitting || !assigningCollectorId}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Dispatching...' : 'Confirm Dispatch Assignment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
