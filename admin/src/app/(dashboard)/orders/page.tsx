'use client';

import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, getAllCollectors, assignCollectorToOrder } from '@/lib/supabase/admin';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  Filter,
  Eye,
  UserCheck,
  XCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  RefreshCcw,
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [reassignModal, setReassignModal] = useState<any | null>(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

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
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignModal || !selectedCollectorId) return;
    setActionLoading(true);
    try {
      await assignCollectorToOrder(reassignModal.id, selectedCollectorId);
      await loadData();
      setReassignModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reassign');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchCustomer = (o.customer?.full_name || '').toLowerCase().includes(q);
      const matchCollector = (o.collector?.full_name || '').toLowerCase().includes(q);
      const matchAddress = (o.pickup_address || '').toLowerCase().includes(q);
      return matchId || matchCustomer || matchCollector || matchAddress;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Order Management</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Track, assign, inspect, and update waste pickup requests.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order ID, Customer, Collector, Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['all', 'pending', 'confirmed', 'en_route', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Collector</th>
                <th className="px-6 py-4">Waste Type</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    No orders found matching search/filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">
                      #{o.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white block">{o.customer?.full_name || 'Customer'}</span>
                      <span className="text-xs text-slate-400">{o.customer?.phone || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {o.collector ? (
                        <span className="font-medium text-slate-200">{o.collector.full_name}</span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">{o.waste_type?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {formatCurrency(Number(o.price) || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setReassignModal(o);
                          setSelectedCollectorId(o.collector_id || '');
                        }}
                        className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors"
                        title="Assign / Reassign"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Order Details</h3>
                <p className="font-mono text-xs text-slate-400">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 font-semibold block uppercase">Customer</span>
                <span className="text-white font-bold text-sm block mt-1">{selectedOrder.customer?.full_name}</span>
                <span className="text-slate-400">{selectedOrder.customer?.email}</span>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg">
                <span className="text-slate-400 font-semibold block uppercase">Collector</span>
                <span className="text-white font-bold text-sm block mt-1">{selectedOrder.collector?.full_name || 'Unassigned'}</span>
                <span className="text-slate-400">{selectedOrder.collector?.phone || '—'}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Pickup Address:</span>
                <span className="text-white font-semibold">{selectedOrder.pickup_address || 'Accra, Ghana'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Waste Category:</span>
                <span className="text-white font-semibold capitalize">{selectedOrder.waste_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Bag Volume:</span>
                <span className="text-white font-semibold">{selectedOrder.bags_count || 1} Bag(s)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Price:</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(Number(selectedOrder.price) || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Payment Method:</span>
                <span className="text-white font-semibold uppercase">{selectedOrder.payment_method}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Order Status:</span>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>

            {/* Quick Status Override Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Administrative Override:</span>
              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
                  >
                    Mark Completed
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'cancelled')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Assign Collector to Order</h3>
              <button onClick={() => setReassignModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-400 font-semibold block">Select Collector</label>
              <select
                value={selectedCollectorId}
                onChange={(e) => setSelectedCollectorId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="">-- Choose Collector --</option>
                {collectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.profile?.full_name || 'Collector'} ({c.vehicle_name}) — ★ {c.rating}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReassign}
              disabled={actionLoading || !selectedCollectorId}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md disabled:opacity-50"
            >
              {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
