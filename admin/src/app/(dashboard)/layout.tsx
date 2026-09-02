'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { getCurrentAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client';
import { AdminRole } from '@/types/admin';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('Admin User');
  const [role, setRole] = useState<AdminRole>('super_admin');

  useEffect(() => {
    async function checkAuth() {
      try {
        const admin = await getCurrentAdmin();
        if (!admin) {
          router.replace('/login');
          return;
        }
        setAdminName(admin.profile?.full_name || admin.user.email || 'Admin');
        setRole(admin.role);
      } catch (err) {
        console.warn('Auth check error:', err);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wider text-slate-400">
            Securing EcoLift Admin Session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar role={role} onSignOut={handleSignOut} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header adminName={adminName} role={role} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
