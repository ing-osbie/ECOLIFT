'use client';

import React, { useEffect, useState } from 'react';
import { getSupportTickets, updateTicketStatus } from '@/lib/supabase/admin';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import { Search, Headphones, CheckCircle, Clock, AlertTriangle, RefreshCcw } from 'lucide-react';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSupportTickets();
      setTickets(data);
    } catch (err) {
      console.warn('Support load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    setSubmitting(true);
    try {
      await updateTicketStatus(ticketId, newStatus);
      await loadData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchSubject = (t.subject || '').toLowerCase().includes(q);
      const matchUser = (t.user?.full_name || '').toLowerCase().includes(q);
      return matchSubject || matchUser;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Support Ticket Center</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Resolve customer disputes, collector issues, and system inquiries.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Ticket Subject or User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
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

      {/* Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Ticket ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No support tickets found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">
                      #{t.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white block">{t.user?.full_name || 'User'}</span>
                      <span className="text-xs text-slate-400 capitalize">{t.user?.role}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">{t.subject}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
                      >
                        Inspect & Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{selectedTicket.subject}</h3>
                <p className="text-xs text-slate-400 font-mono">#{selectedTicket.id}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl space-y-2 text-xs">
              <span className="text-slate-400 font-semibold uppercase block">Customer Message</span>
              <p className="text-slate-200 leading-relaxed text-sm">{selectedTicket.message}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-semibold">Change Ticket Status:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                  disabled={submitting}
                  className="px-3 py-1.5 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 text-xs font-bold rounded-lg border border-amber-500/30"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  disabled={submitting}
                  className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold rounded-lg"
                >
                  Resolve Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
