'use client';

import React, { useEffect, useState } from 'react';
import { getAllTransactions } from '@/lib/supabase/admin';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Landmark, Banknote, ArrowDownRight, ArrowUpRight, RefreshCcw } from 'lucide-react';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'successful' | 'pending' | 'failed'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (err) {
      console.warn('Finance load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTx = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchRef = (tx.reference || '').toLowerCase().includes(q);
      const matchUser = (tx.user?.full_name || '').toLowerCase().includes(q);
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      return matchRef || matchUser || matchDesc;
    }
    return true;
  });

  const totalCredits = transactions
    .filter((tx) => tx.type === 'credit' && tx.status === 'successful')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalDebits = transactions
    .filter((tx) => tx.type === 'debit' && tx.status === 'successful')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Finance & Payments</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Monitor ledger transactions, platform credits, debits, refunds, and financial audit history.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Successful Credits
            </span>
            <span className="text-2xl font-bold text-emerald-400 mt-2 block">
              {formatCurrency(totalCredits)}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Successful Debits
            </span>
            <span className="text-2xl font-bold text-rose-400 mt-2 block">
              {formatCurrency(totalDebits)}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Net Platform Balance
            </span>
            <span className="text-2xl font-bold text-white mt-2 block">
              {formatCurrency(totalCredits - totalDebits)}
            </span>
          </div>
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <Landmark className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Reference, User, Description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            {['all', 'credit', 'debit'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t as any)}
                className={`px-3 py-1 rounded text-xs font-bold capitalize transition-colors ${
                  typeFilter === t ? 'bg-slate-700 text-white' : 'text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
            {['all', 'successful', 'pending', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st as any)}
                className={`px-3 py-1 rounded text-xs font-bold capitalize transition-colors ${
                  statusFilter === st ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {tx.reference || tx.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {tx.user?.full_name || 'User'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          tx.type === 'credit'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 font-bold ${
                        tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">
                      {tx.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(tx.created_at)}
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
