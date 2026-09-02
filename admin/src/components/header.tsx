'use client';

import React from 'react';
import { Bell, Search, ShieldCheck, User } from 'lucide-react';
import { AdminRole } from '@/types/admin';

interface HeaderProps {
  title?: string;
  adminName?: string;
  role?: AdminRole;
  unreadCount?: number;
  onSearch?: (query: string) => void;
}

export function Header({
  title = 'Overview',
  adminName = 'Operations Admin',
  role = 'super_admin',
  unreadCount = 3,
  onSearch,
}: HeaderProps) {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-6">
        {/* Search Input */}
        {onSearch && (
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders, users, tickets..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        )}

        {/* Notifications Button */}
        <button className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center border-2 border-slate-900">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Profile Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
            {adminName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{adminName}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 font-medium capitalize">
              {role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
