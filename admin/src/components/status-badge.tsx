'use client';

import React from 'react';

type StatusType =
  | 'pending'
  | 'matching'
  | 'confirmed'
  | 'en_route'
  | 'completed'
  | 'cancelled'
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'active'
  | 'suspended'
  | 'online'
  | 'offline';

interface StatusBadgeProps {
  status: StatusType | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase();

  const getStyle = () => {
    switch (normalized) {
      case 'completed':
      case 'resolved':
      case 'active':
      case 'online':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'en_route':
      case 'in_progress':
      case 'matching':
      case 'confirmed':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'pending':
      case 'open':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'cancelled':
      case 'suspended':
      case 'offline':
      case 'closed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {status?.replace('_', ' ')}
    </span>
  );
}
