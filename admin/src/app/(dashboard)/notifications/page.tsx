'use client';

import React, { useState } from 'react';
import { sendAdminNotification } from '@/lib/supabase/admin';
import { Bell, Send, ShieldAlert, CheckCircle2, Users, Truck } from 'lucide-react';

export default function NotificationsPage() {
  const [targetGroup, setTargetGroup] = useState<'all' | 'customers' | 'collectors'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      await sendAdminNotification(targetGroup, title, body);
      alert('Broadcast notification successfully sent!');
      setTitle('');
      setBody('');
      setConfirmModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Admin Broadcast Notification Center
            </h2>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Send system announcements, policy updates, and service alerts to platform users.
            </p>
          </div>
        </div>
      </div>

      {/* Broadcast Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Target Audience
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTargetGroup('all')}
              className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                targetGroup === 'all'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                  : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Users</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetGroup('customers')}
              className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                targetGroup === 'customers'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                  : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers Only</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetGroup('collectors')}
              className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                targetGroup === 'collectors'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                  : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Collectors Only</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Service Maintenance Alert"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Notification Body Content *
            </label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your official announcement here..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!title.trim() || !body.trim()}
          onClick={() => setConfirmModal(true)}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>Review & Send Broadcast</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-white text-base">Confirm Mass Notification</h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to broadcast this message to{' '}
              <strong className="text-emerald-400 uppercase">{targetGroup}</strong>? This action cannot be undone.
            </p>

            <div className="bg-slate-800/60 p-3.5 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-bold block">{title}</span>
              <span className="text-slate-300 block">{body}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="py-2.5 bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcast}
                disabled={loading}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {loading ? 'Sending...' : 'Confirm Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
