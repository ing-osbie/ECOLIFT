'use client';

import React, { useEffect, useState } from 'react';
import { getAllCollectors, toggleUserStatus } from '@/lib/supabase/admin';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import { Search, ShieldCheck, ShieldAlert, Truck, Star, Eye, RefreshCcw } from 'lucide-react';

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'verified' | 'suspended'>('all');
  const [selectedCollector, setSelectedCollector] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllCollectors();
      setCollectors(data);
    } catch (err) {
      console.warn('Collectors load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVerification = async (collectorId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      await toggleUserStatus(collectorId, !currentStatus, 'Admin verification toggle');
      await loadData();
      if (selectedCollector?.id === collectorId) {
        setSelectedCollector((prev: any) => ({ ...prev, is_verified: !currentStatus }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCollectors = collectors.filter((c) => {
    if (statusFilter === 'online' && !c.is_online) return false;
    if (statusFilter === 'verified' && !c.is_verified) return false;
    if (statusFilter === 'suspended' && c.is_verified) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = (c.profile?.full_name || '').toLowerCase().includes(q);
      const matchPlate = (c.plate_number || '').toLowerCase().includes(q);
      const matchVehicle = (c.vehicle_name || '').toLowerCase().includes(q);
      return matchName || matchPlate || matchVehicle;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Collector & Fleet Management</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Manage waste drivers, verification credentials, vehicle types, performance ratings, and suspensions.
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

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Name, License Plate, Vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'online', 'verified', 'suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Collector Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Collector</th>
                <th className="px-6 py-4">Vehicle / Plate</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Completed Jobs</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verification</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCollectors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No collectors matching filter.
                  </td>
                </tr>
              ) : (
                filteredCollectors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
                          {(c.profile?.full_name || 'C').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{c.profile?.full_name || 'Collector'}</span>
                          <span className="text-xs text-slate-400">{c.profile?.phone || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-200 block">{c.vehicle_name || 'Tricycle'}</span>
                      <span className="font-mono text-xs text-slate-400">{c.plate_number || 'GRN-2024'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{Number(c.rating || 5.0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">{c.total_jobs || 0}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.is_online ? 'online' : 'offline'} />
                    </td>
                    <td className="px-6 py-4">
                      {c.is_verified ? (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Unverified / Suspended</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedCollector(c)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleVerification(c.id, c.is_verified)}
                        disabled={actionLoading}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          c.is_verified
                            ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {c.is_verified ? 'Suspend' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCollector && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Collector Profile inspection</h3>
              <button onClick={() => setSelectedCollector(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/60 p-4 rounded-xl space-y-2">
                <span className="text-slate-400 font-semibold uppercase block">Full Name</span>
                <span className="text-white font-bold text-base block">{selectedCollector.profile?.full_name}</span>
                <span className="text-slate-400">{selectedCollector.profile?.email} · {selectedCollector.profile?.phone}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/40 p-3 rounded-lg">
                  <span className="text-slate-400 font-semibold block">Vehicle Type</span>
                  <span className="text-white font-bold mt-1 block">{selectedCollector.vehicle_name || 'Tricycle'}</span>
                </div>
                <div className="bg-slate-800/40 p-3 rounded-lg">
                  <span className="text-slate-400 font-semibold block">Plate Number</span>
                  <span className="font-mono text-emerald-400 font-bold mt-1 block">{selectedCollector.plate_number || 'GRN-2024'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/40 p-3 rounded-lg">
                  <span className="text-slate-400 font-semibold block">Rating Score</span>
                  <span className="text-amber-400 font-bold mt-1 block">★ {Number(selectedCollector.rating || 5).toFixed(1)}</span>
                </div>
                <div className="bg-slate-800/40 p-3 rounded-lg">
                  <span className="text-slate-400 font-semibold block">Total Pickups</span>
                  <span className="text-white font-bold mt-1 block">{selectedCollector.total_jobs || 0}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggleVerification(selectedCollector.id, selectedCollector.is_verified)}
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                selectedCollector.is_verified
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {selectedCollector.is_verified ? 'Suspend Collector Account' : 'Approve & Verify Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
