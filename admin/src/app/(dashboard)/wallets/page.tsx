'use client';

import React, { useEffect, useState } from 'react';
import { getAllCustomers, adjustUserWallet } from '@/lib/supabase/admin';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Wallet, PlusCircle, MinusCircle, ShieldCheck, AlertCircle, RefreshCcw } from 'lucide-react';

export default function WalletsPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustModal, setAdjustModal] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.warn('Wallets load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal || !amount || !reason) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    const finalAmount = adjustType === 'credit' ? numAmount : -numAmount;

    setSubmitting(true);
    try {
      await adjustUserWallet(adjustModal.id, finalAmount, reason);
      alert('Wallet adjustment successfully applied & logged to immutable audit trail.');
      await loadData();
      setAdjustModal(null);
      setAmount('');
      setReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to adjust wallet');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = (c.full_name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Controlled Wallet Administration
            </h2>
          </div>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Protected server-side financial adjustments. Every transaction logs previous/new balances, admin ID, and reason to the audit trail.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Wallets</span>
        </button>
      </div>

      {/* Security Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 text-amber-400 text-xs font-medium">
        <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
        <span>
          <strong>Security Notice:</strong> Direct client-side wallet mutations are blocked by Supabase RLS. All adjustments execute via atomic SECURITY DEFINER functions with mandatory audit logging.
        </span>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Customer Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Wallet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Account ID</th>
                <th className="px-6 py-4">Current Wallet Balance</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4 text-right">Admin Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No wallet accounts found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const balance = Number(c.wallets?.[0]?.balance || 0);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        {c.full_name || 'Customer'}
                        <span className="text-xs font-normal text-slate-400 block">{c.email}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {c.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400 text-base">
                        {formatCurrency(balance)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-400">GHS</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setAdjustModal(c)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>Adjust Balance</span>
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

      {/* Adjustment Modal */}
      {adjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Apply Wallet Adjustment</h3>
              <button onClick={() => setAdjustModal(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-semibold uppercase block">Target Customer</span>
              <span className="text-white font-bold text-sm block">{adjustModal.full_name}</span>
              <span className="text-emerald-400 font-bold block">
                Current Balance: {formatCurrency(Number(adjustModal.wallets?.[0]?.balance || 0))}
              </span>
            </div>

            <form onSubmit={handleAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credit')}
                    className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      adjustType === 'credit'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Credit (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('debit')}
                    className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      adjustType === 'debit'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>Debit (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Amount (GH₵) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Adjustment Reason / Audit Note *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Approved refund for cancelled pickup ORD-102"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
              >
                {submitting ? 'Processing Audit & Adjustment...' : 'Execute Protected Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
