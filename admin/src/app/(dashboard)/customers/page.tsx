'use client';

import React, { useEffect, useState } from 'react';
import { getAllCustomers, toggleUserStatus } from '@/lib/supabase/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Users, Wallet, ShieldCheck, ShieldAlert, RefreshCcw, Eye } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.warn('Customers load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (userId: string, currentVerified: boolean) => {
    setActionLoading(true);
    try {
      await toggleUserStatus(userId, !currentVerified, 'Customer account status toggle');
      await loadData();
      if (selectedCustomer?.id === userId) {
        setSelectedCustomer((prev: any) => ({ ...prev, is_verified: !currentVerified }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = (c.full_name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Customer Management</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Search profiles, view wallet balances, inspect activity, and manage account access.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Customer Name, Email, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const balance = c.wallets?.[0]?.balance || 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sky-600/20 text-sky-400 font-bold flex items-center justify-center border border-sky-500/30">
                            {(c.full_name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{c.full_name || 'Customer'}</span>
                            <span className="text-xs text-slate-400">{c.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {c.phone || '—'}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        {formatCurrency(Number(balance))}
                      </td>
                      <td className="px-6 py-4">
                        {c.is_verified ? (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c.id, c.is_verified)}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            c.is_verified
                              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          }`}
                        >
                          {c.is_verified ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Customer Account Profile</h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-800/60 p-4 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold uppercase block">Customer Name</span>
                <span className="text-white font-bold text-base block">{selectedCustomer.full_name}</span>
                <span className="text-slate-400">{selectedCustomer.email}</span>
                <span className="text-slate-400 block font-mono">{selectedCustomer.phone}</span>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-semibold block">Wallet Balance</span>
                  <span className="text-emerald-400 font-bold text-lg mt-1 block">
                    {formatCurrency(Number(selectedCustomer.wallets?.[0]?.balance || 0))}
                  </span>
                </div>
                <Wallet className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </div>

            <button
              onClick={() => handleToggleStatus(selectedCustomer.id, selectedCustomer.is_verified)}
              disabled={actionLoading}
              className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                selectedCustomer.is_verified
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {selectedCustomer.is_verified ? 'Suspend Customer Account' : 'Reactivate Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
