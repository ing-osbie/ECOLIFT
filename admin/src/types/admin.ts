export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'operations'
  | 'finance'
  | 'support'
  | 'dispatcher';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  department?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_role: string;
  action: string;
  target_entity: string;
  target_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  created_at: string;
  admin_name?: string;
}

export interface SystemStats {
  total_customers: number;
  active_customers: number;
  total_collectors: number;
  online_collectors: number;
  active_pickups: number;
  completed_pickups: number;
  cancelled_pickups: number;
  today_orders: number;
  today_revenue: number;
  pending_tickets: number;
  pending_schedules: number;
  failed_payments: number;
}

export interface AdminNotificationInput {
  target_group: 'all' | 'customers' | 'collectors' | 'specific';
  target_user_ids?: string[];
  title: string;
  body: string;
}

export interface WalletAdjustmentInput {
  target_user_id: string;
  amount: number;
  reason: string;
  order_id?: string;
}
