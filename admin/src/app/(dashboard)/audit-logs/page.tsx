'use client';

import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '@/lib/supabase/admin';
import { AdminAuditLog } from '@/types/admin';
import { formatDate } from '@/lib/utils';
import { ShieldAlert, Search, Lock, RefreshCcw } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.warn('Audit logs load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.target_entity.toLowerCase().includes(q) ||
      (log.admin_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Immutable Admin Audit Logs
            </h2>
          </div>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Read-only system audit trail logging all privileged administrative actions, wallet adjustments, and role updates.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Lock Notice */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Audit records are cryptographically timestamped and cannot be deleted or edited by any administrator.</span>
        </div>
        <span className="font-mono text-emerald-400 font-bold">SECURITY LEVEL: HIGH</span>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Action, Admin Name, Target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Admin Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-sans">
                    No audit records match the specified filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{formatDate(log.created_at)}</td>
                    <td className="px-6 py-4 font-sans font-semibold text-white">
                      {log.admin_name || 'Admin User'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {log.admin_role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-400">{log.action}</td>
                    <td className="px-6 py-4 text-slate-300">{log.target_entity} ({log.target_id || 'N/A'})</td>
                    <td className="px-6 py-4 text-slate-400 truncate max-w-xs">
                      {JSON.stringify(log.metadata || {})}
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
