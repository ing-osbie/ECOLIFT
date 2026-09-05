import { supabase } from "@/src/lib/supabase";
import {
  Collector,
  CollectorJob,
  CreateCollectorInput,
  CreateCollectorJobInput,
  VehicleType,
} from "@/src/types/collector";
import { Order } from "@/src/types/order";
import { getCurrentUserId } from "./auth";
import { acceptOrder, completeOrder } from "./orders";

export interface NearbyCollector {
  id: string;
  vehicle_name: string | null;
  plate_number: string | null;
  rating: number;
  total_jobs: number;
  current_lat: number | null;
  current_lng: number | null;
  distance_km: number;
}

export interface CollectorEarnings {
  total_earnings: number;
  week_earnings: number;
  month_earnings: number;
  total_jobs: number;
  completed_jobs: number;
}

export async function getVehicleTypes(): Promise<VehicleType[]> {
  const { data, error } = await supabase
    .from("vehicle_types")
    .select("*")
    .order("base_price", { ascending: true });

  if (error) {
    console.error("Error loading vehicle types:", error.message);
    return [];
  }

  return (data ?? []) as VehicleType[];
}

export async function getAvailableCollectors(): Promise<Collector[]> {
  const { data, error } = await supabase
    .from("collectors")
    .select("*")
    .eq("is_online", true)
    .eq("is_verified", true);

  if (error) {
    console.error("Error loading collectors:", error.message);
    return [];
  }

  return (data ?? []) as Collector[];
}

export async function getMyCollectorProfile(
  userId?: string,
): Promise<Collector | null> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return null;

  const { data, error } = await supabase
    .from("collectors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading collector profile:", error.message);
    return null;
  }

  return data as Collector;
}

export async function createCollectorProfile(
  input: CreateCollectorInput,
): Promise<Collector | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("collectors")
    .insert({ ...input, id: userId })
    .select("*")
    .single();

  if (error) throw error;

  return data as Collector;
}

export async function updateCollectorProfile(
  updates: Partial<Collector>,
): Promise<Collector | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("collectors")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;

  return data as Collector;
}

export async function setCollectorOnline(
  isOnline: boolean,
): Promise<Collector | null> {
  return updateCollectorProfile({ is_online: isOnline });
}

export async function setCollectorLocation(
  lat: number,
  lng: number,
): Promise<Collector | null> {
  return updateCollectorProfile({ current_lat: lat, current_lng: lng });
}

/**
 * Fetch pending unassigned orders available for collectors to accept.
 */
export async function getPendingOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .is("collector_id", null)
    .in("status", ["pending", "matching"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending orders:", error.message);
    return [];
  }

  return (data ?? []) as Order[];
}

export async function getCollectorJobs(
  userId?: string,
): Promise<CollectorJob[]> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return [];

  const { data, error } = await supabase
    .from("collector_jobs")
    .select("*")
    .eq("collector_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading collector jobs:", error.message);
    return [];
  }

  return (data ?? []) as CollectorJob[];
}

export async function createCollectorJob(
  input: CreateCollectorJobInput,
): Promise<CollectorJob | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("collector_jobs")
    .insert({ ...input, collector_id: userId })
    .select("*")
    .single();

  if (error) throw error;

  return data as CollectorJob;
}

export async function updateCollectorJob(
  jobId: string,
  updates: Partial<CollectorJob>,
): Promise<CollectorJob | null> {
  const { data, error } = await supabase
    .from("collector_jobs")
    .update(updates)
    .eq("id", jobId)
    .select("*")
    .single();

  if (error) throw error;

  return data as CollectorJob;
}

/**
 * Accept an order as a collector (atomic database RPC).
 */
export async function acceptJob(orderId: string): Promise<Order | null> {
  return acceptOrder(orderId);
}

/**
 * Complete a job (atomic database RPC).
 */
export async function completeCollectorJob(
  orderId: string,
): Promise<Order | null> {
  return completeOrder(orderId);
}

/**
 * Transition an order to en_route (collector-initiated, atomic RPC).
 */
export async function setOrderEnRoute(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase.rpc("set_order_en_route", {
    p_order_id: orderId,
  });

  if (error) throw error;

  return data as Order;
}

/**
 * Find nearby online & verified collectors (geolocation matching RPC).
 */
export async function findNearbyCollectors(
  lat: number,
  lng: number,
  radiusKm = 10,
): Promise<NearbyCollector[]> {
  const { data, error } = await supabase.rpc("find_nearby_collectors", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
  });

  if (error) {
    console.error("Error finding nearby collectors:", error.message);
    return [];
  }

  return (data ?? []) as NearbyCollector[];
}

/**
 * Get collector earnings summary (atomic RPC).
 */
export async function getCollectorEarnings(
  collectorId?: string,
): Promise<CollectorEarnings | null> {
  // 1. Try atomic RPC function
  try {
    const { data, error } = await supabase.rpc("get_collector_earnings", {
      p_collector_id: collectorId ?? null,
    });

    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        return {
          total_earnings: Number(row.total_earnings) || 0,
          week_earnings: Number(row.week_earnings) || 0,
          month_earnings: Number(row.month_earnings) || 0,
          total_jobs: Number(row.total_jobs) || 0,
          completed_jobs: Number(row.completed_jobs) || 0,
        };
      }
    }

    if (error) {
      console.warn(
        "RPC get_collector_earnings warning:",
        error.message,
        "— attempting direct query fallback.",
      );
    }
  } catch (rpcErr) {
    console.warn("RPC get_collector_earnings exception, falling back:", rpcErr);
  }

  // 2. Resilient fallback: compute directly from wallet_transactions & collector_jobs
  try {
    const targetId = collectorId || (await getCurrentUserId());
    if (!targetId) return null;

    const now = new Date();
    // Monday as start of week
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // 1st of month as start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [txRes, jobsRes] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("amount, type, created_at")
        .eq("user_id", targetId)
        .eq("type", "credit"),
      supabase
        .from("collector_jobs")
        .select("id, status")
        .eq("collector_id", targetId),
    ]);

    let totalEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;

    if (txRes.data) {
      for (const tx of txRes.data) {
        const amt = Number(tx.amount) || 0;
        const txDate = new Date(tx.created_at);
        totalEarnings += amt;
        if (txDate >= startOfWeek) weekEarnings += amt;
        if (txDate >= startOfMonth) monthEarnings += amt;
      }
    }

    const totalJobs = jobsRes.data ? jobsRes.data.length : 0;
    const completedJobs = jobsRes.data
      ? jobsRes.data.filter((j) => j.status === "completed").length
      : 0;

    return {
      total_earnings: totalEarnings,
      week_earnings: weekEarnings,
      month_earnings: monthEarnings,
      total_jobs: totalJobs,
      completed_jobs: completedJobs,
    };
  } catch (fallbackErr) {
    console.error("Error calculating collector earnings fallback:", fallbackErr);
    return null;
  }
}

/**
 * Real-time subscription to unassigned pending orders for active collectors.
 */
export function subscribeToPendingOrders(
  onNewPendingOrder: (order: Order) => void,
) {
  const subscription = supabase
    .channel("pending_orders_realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        const newOrder = payload.new as Order;
        if (
          !newOrder.collector_id &&
          ["pending", "matching"].includes(newOrder.status)
        ) {
          onNewPendingOrder(newOrder);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Real-time subscription to collector jobs.
 */
export function subscribeToCollectorJobs(
  collectorId: string,
  onJobUpdate: (job: CollectorJob) => void,
) {
  const subscription = supabase
    .channel(`collector_jobs_${collectorId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "collector_jobs",
        filter: `collector_id=eq.${collectorId}`,
      },
      (payload) => {
        if (payload.new) {
          onJobUpdate(payload.new as CollectorJob);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
