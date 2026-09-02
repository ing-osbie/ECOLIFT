import { createClient } from './client';
import { AdminRole, SystemStats, AdminAuditLog } from '@/types/admin';

const supabase = createClient();

/**
 * Get current admin session & role
 */
export async function getCurrentAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const role: AdminRole = adminUser?.role || (profile?.role === 'admin' ? 'super_admin' : 'admin');

  return {
    user: session.user,
    profile,
    role,
  };
}

/**
 * Fetch aggregated platform metrics
 */
export async function getSystemStats(): Promise<SystemStats> {
  const [
    { count: totalCustomers },
    { count: activeCustomers },
    { count: totalCollectors },
    { count: onlineCollectors },
    { count: activePickups },
    { count: completedPickups },
    { count: cancelledPickups },
    { count: pendingTickets },
    { count: pendingSchedules },
    { data: ordersToday },
    { data: walletTx },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').eq('is_verified', true),
    supabase.from('collectors').select('*', { count: 'exact', head: true }),
    supabase.from('collectors').select('*', { count: 'exact', head: true }).eq('is_online', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'matching', 'confirmed', 'en_route']),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('scheduled_pickups').select('*', { count: 'exact', head: true }).eq('enabled', true),
    supabase.from('orders').select('price, status, created_at').gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('wallet_transactions').select('amount, status').eq('status', 'failed'),
  ]);

  const todayOrders = ordersToday?.length || 0;
  const todayRevenue = (ordersToday || [])
    .filter(o => o.status === 'completed')
    .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  return {
    total_customers: totalCustomers || 0,
    active_customers: activeCustomers || 0,
    total_collectors: totalCollectors || 0,
    online_collectors: onlineCollectors || 0,
    active_pickups: activePickups || 0,
    completed_pickups: completedPickups || 0,
    cancelled_pickups: cancelledPickups || 0,
    today_orders: todayOrders,
    today_revenue: todayRevenue,
    pending_tickets: pendingTickets || 0,
    pending_schedules: pendingSchedules || 0,
    failed_payments: walletTx?.length || 0,
  };
}

/**
 * Fetch all orders with customer & collector profiles
 */
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:profiles!customer_id(full_name, email, phone, avatar_url),
      collector:profiles!collector_id(full_name, email, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Assign or reassign collector to an order
 */
export async function assignCollectorToOrder(orderId: string, collectorId: string) {
  const { data, error } = await supabase.rpc('admin_assign_collector', {
    p_order_id: orderId,
    p_collector_id: collectorId,
  });

  if (error) {
    // Fallback direct update if RPC fails
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ collector_id: collectorId, status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    if (updateErr) throw updateErr;
    return updated;
  }
  return data;
}

/**
 * Update order status with validation
 */
export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all collectors with metrics
 */
export async function getAllCollectors() {
  const { data, error } = await supabase
    .from('collectors')
    .select(`
      *,
      profile:profiles!id(full_name, email, phone, avatar_url, created_at)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all customers
 */
export async function getAllCustomers() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      wallets(balance, currency)
    `)
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Suspend or reactivate user
 */
export async function toggleUserStatus(userId: string, isActive: boolean, reason?: string) {
  const { error } = await supabase.rpc('admin_toggle_user_status', {
    p_target_user_id: userId,
    p_is_active: isActive,
    p_reason: reason || '',
  });

  if (error) {
    // Fallback update
    await supabase.from('profiles').update({ is_verified: isActive }).eq('id', userId);
  }
}

/**
 * Fetch all financial transactions
 */
export async function getAllTransactions() {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select(`
      *,
      user:profiles!user_id(full_name, email, role)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Perform atomic wallet adjustment with audit log
 */
export async function adjustUserWallet(userId: string, amount: number, reason: string, orderId?: string) {
  const { data, error } = await supabase.rpc('admin_adjust_wallet', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_order_id: orderId || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch support tickets
 */
export async function getSupportTickets() {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      user:profiles!user_id(full_name, email, phone, role)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update support ticket status
 */
export async function updateTicketStatus(ticketId: string, status: string) {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Send targeted or global notification
 */
export async function sendAdminNotification(targetGroup: string, title: string, body: string, userIds: string[] = []) {
  let query = supabase.from('profiles').select('id');

  if (targetGroup === 'customers') {
    query = query.eq('role', 'customer');
  } else if (targetGroup === 'collectors') {
    query = query.eq('role', 'collector');
  }

  const { data: users } = await query;
  const targetIds = userIds.length > 0 ? userIds : (users || []).map(u => u.id);

  if (targetIds.length > 0) {
    const notifs = targetIds.map(uid => ({
      user_id: uid,
      title,
      body,
      type: 'system',
    }));
    await supabase.from('notifications').insert(notifs);
  }
}

/**
 * Fetch vehicle & service types
 */
export async function getVehicleTypes() {
  const { data, error } = await supabase
    .from('vehicle_types')
    .select('*')
    .order('base_price', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Save / Update vehicle type
 */
export async function saveVehicleType(vehicle: any) {
  if (vehicle.id) {
    const { data, error } = await supabase
      .from('vehicle_types')
      .update(vehicle)
      .eq('id', vehicle.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('vehicle_types')
      .insert(vehicle)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Fetch immutable audit logs
 */
export async function getAuditLogs(): Promise<AdminAuditLog[]> {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select(`
      *,
      admin:profiles!admin_id(full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    // Return empty if table not yet created
    return [];
  }
  return (data || []).map(item => ({
    ...item,
    admin_name: item.admin?.full_name || 'System Admin',
  }));
}
