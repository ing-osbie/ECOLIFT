'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Radio,
  ClipboardList,
  Truck,
  Users,
  Wallet,
  Landmark,
  Headphones,
  Bell,
  Sliders,
  BarChart3,
  ShieldAlert,
  LogOut,
  Recycle,
} from 'lucide-react';
import { AdminRole } from '@/types/admin';

interface SidebarProps {
  role?: AdminRole;
  onSignOut?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: AdminRole[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'admin', 'operations', 'finance', 'support', 'dispatcher'],
  },
  {
    label: 'Live Dispatch',
    href: '/dispatch',
    icon: Radio,
    allowedRoles: ['super_admin', 'admin', 'operations', 'dispatcher'],
    badge: 'LIVE',
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: ClipboardList,
    allowedRoles: ['super_admin', 'admin', 'operations', 'dispatcher'],
  },
  {
    label: 'Collectors',
    href: '/collectors',
    icon: Truck,
    allowedRoles: ['super_admin', 'admin', 'operations', 'dispatcher'],
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: Users,
    allowedRoles: ['super_admin', 'admin', 'operations', 'support'],
  },
  {
    label: 'Finance & Payments',
    href: '/finance',
    icon: Landmark,
    allowedRoles: ['super_admin', 'admin', 'finance'],
  },
  {
    label: 'Wallet Management',
    href: '/wallets',
    icon: Wallet,
    allowedRoles: ['super_admin', 'admin', 'finance'],
  },
  {
    label: 'Support Tickets',
    href: '/support',
    icon: Headphones,
    allowedRoles: ['super_admin', 'admin', 'support'],
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    allowedRoles: ['super_admin', 'admin', 'operations', 'support'],
  },
  {
    label: 'Vehicles & Fleet',
    href: '/vehicles',
    icon: Sliders,
    allowedRoles: ['super_admin', 'admin', 'operations'],
  },
  {
    label: 'Analytics & Reports',
    href: '/analytics',
    icon: BarChart3,
    allowedRoles: ['super_admin', 'admin', 'operations', 'finance'],
  },
  {
    label: 'Audit Logs',
    href: '/audit-logs',
    icon: ShieldAlert,
    allowedRoles: ['super_admin', 'admin', 'finance'],
  },
];

export function Sidebar({ role = 'super_admin', onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(role)
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Recycle className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide">EcoLift</h1>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
            Admin Control Plane
          </span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">Access Level</span>
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {role.replace('_', ' ')}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Sign Out */}
      {onSignOut && (
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
