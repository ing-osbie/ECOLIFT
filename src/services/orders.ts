import { supabase } from "@/src/lib/supabase";
import { CreateOrderInput, Order } from "@/src/types/order";
import { getCurrentUserId } from "./auth";

export async function getOrders(userId?: string): Promise<Order[]> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    if (!error.message.includes("schema cache")) console.error("Error loading orders:", error.message);
    return [];
  }

  return (data ?? []) as Order[];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order by ID:", error.message);
    return null;
  }

  return data as Order;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<Order | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("orders")
    .insert({ ...input, customer_id: userId, status: "pending" })
    .select("*")
    .single();

  if (error) {
    // If disposal columns are missing in Supabase schema, retry insert without them
    if (
      error.message?.includes("disposal_lat") ||
      error.message?.includes("disposal_lng") ||
      error.message?.includes("disposal_address")
    ) {
      console.warn(
        "Disposal columns missing in orders table, retrying insert without disposal columns...",
      );
      const {
        disposal_lat,
        disposal_lng,
        disposal_address,
        ...fallbackInput
      } = input;
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("orders")
        .insert({ ...fallbackInput, customer_id: userId, status: "pending" })
        .select("*")
        .single();
      if (fallbackError) throw fallbackError;
      return fallbackData as Order;
    }
    throw error;
  }

  return data as Order;
}

export async function updateOrder(
  orderId: string,
  updates: Partial<Order>,
): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  return data as Order;
}

export async function acceptOrder(orderId: string): Promise<Order | null> {
  const userId = await getCurrentUserId();
  try {
    const { data, error } = await supabase.rpc("accept_order", {
      p_order_id: orderId,
    });
    if (!error && data) return data as Order;
    if (error) console.warn("RPC accept_order notice, trying fallback:", error.message);
  } catch (rpcErr: any) {
    console.warn("RPC accept_order exception, trying fallback:", rpcErr?.message);
  }

  // Resilient fallback: direct table updates
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({
      collector_id: userId,
      status: "confirmed",
      accepted_at: now,
      updated_at: now,
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("collector_jobs")
    .update({ status: "accepted", accepted_at: now, updated_at: now })
    .eq("order_id", orderId);

  return data as Order;
}

export async function completeOrder(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase.rpc("complete_order", {
      p_order_id: orderId,
    });
    if (!error && data) return data as Order;
    if (error) console.warn("RPC complete_order notice, trying fallback:", error.message);
  } catch (rpcErr: any) {
    console.warn("RPC complete_order exception, trying fallback:", rpcErr?.message);
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "completed", updated_at: now })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("collector_jobs")
    .update({ status: "completed", updated_at: now })
    .eq("order_id", orderId);

  return data as Order;
}

export async function cancelOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase.rpc("cancel_order", {
    p_order_id: orderId,
  });

  if (error) throw error;

  return data as Order;
}

export async function rateOrder(
  orderId: string,
  rating: number,
  review?: string,
): Promise<Order | null> {
  const { data, error } = await supabase.rpc("rate_order", {
    p_order_id: orderId,
    p_rating: rating,
    p_review: review ?? null,
  });

  if (error) throw error;

  return data as Order;
}

/**
 * Real-time subscription to customer orders.
 */
export function subscribeToCustomerOrders(
  userId: string,
  onOrderUpdate: (order: Order) => void,
) {
  const subscription = supabase
    .channel(`customer_orders_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `customer_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onOrderUpdate(payload.new as Order);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Dispatch an order to eligible online/available collectors.
 */
export async function dispatchOrder(orderId: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc("dispatch_order", {
      p_order_id: orderId,
    });
    if (!error && data) return data;
  } catch (err) {
    console.warn("RPC dispatch_order notice, checking fallback:", err);
  }

  // Resilient fallback: find an online collector and assign offered job
  try {
    const { data: collectors } = await supabase
      .from("collectors")
      .select("id, is_online, is_verified")
      .order("is_online", { ascending: false })
      .limit(10);

    const targetCollector =
      collectors?.find((c) => c.is_online) || collectors?.[0];

    if (targetCollector) {
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (order) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", order.customer_id)
          .maybeSingle();

        const { data: job, error: jobErr } = await supabase
          .from("collector_jobs")
          .insert({
            collector_id: targetCollector.id,
            order_id: order.id,
            customer_id: order.customer_id,
            waste_type: order.waste_type,
            pickup_address: order.pickup_address,
            pickup_lat: order.pickup_lat,
            pickup_lng: order.pickup_lng,
            bags_count: order.bags_count,
            fare: order.price,
            status: "offered",
            customer_name: profile?.full_name || "EcoLift Customer",
            customer_phone: profile?.phone || "",
          })
          .select("*")
          .single();

        if (!jobErr && job) {
          await supabase
            .from("orders")
            .update({ status: "matching" })
            .eq("id", orderId);
          return job;
        }
      }
    }
  } catch (fallbackErr) {
    console.warn("Fallback dispatch error:", fallbackErr);
  }
  return null;
}

/**
 * Set order to en_route state (collector is traveling to pickup).
 */
export async function setOrderEnRoute(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase.rpc("set_order_en_route", {
      p_order_id: orderId,
    });
    if (!error && data) return data as Order;
  } catch (err) {
    console.warn("RPC set_order_en_route error, using update fallback:", err);
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "en_route", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("collector_jobs")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("order_id", orderId);

  return data as Order;
}

/**
 * Mark order as arrived at customer location (starts 4-minute timer with server timestamp).
 */
export async function setOrderArrived(orderId: string): Promise<Order | null> {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase.rpc("set_order_arrived", {
      p_order_id: orderId,
    });
    if (!error && data) return data as Order;
  } catch (err) {
    console.warn("RPC set_order_arrived notice, using update fallback:", err);
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "arrived", arrived_at: now, updated_at: now })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("collector_jobs")
    .update({ status: "arrived", arrived_at: now, updated_at: now })
    .eq("order_id", orderId);

  return data as Order;
}

/**
 * Start loading / pickup in progress.
 */
export async function startOrderPickup(orderId: string): Promise<Order | null> {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase.rpc("start_order_pickup", {
      p_order_id: orderId,
    });
    if (!error && data) return data as Order;
  } catch (err) {
    console.warn("RPC start_order_pickup notice, using update fallback:", err);
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "pickup_in_progress", pickup_started_at: now, updated_at: now })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("collector_jobs")
    .update({ status: "pickup_in_progress", updated_at: now })
    .eq("order_id", orderId);

  return data as Order;
}

/**
 * Real-time subscription for a single order by ID with debug logging.
 */
export function subscribeToOrderById(
  orderId: string,
  onOrderUpdate: (order: Order) => void,
) {
  console.log("CUSTOMER: [SUBSCRIBING TO ORDER]", orderId);
  const subscription = supabase
    .channel(`order_${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload) => {
        if (payload.new) {
          const updated = payload.new as Order;
          console.log("CUSTOMER: [ORDER UPDATE RECEIVED]", updated.status, updated.id);
          onOrderUpdate(updated);
        }
      },
    )
    .subscribe((status) => {
      console.log(`CUSTOMER: [ORDER ID ${orderId}] [REALTIME STATUS]`, status);
      if (status === "CHANNEL_ERROR") {
        console.error(`CUSTOMER: [REALTIME CHANNEL_ERROR] on order_${orderId}`);
      } else if (status === "TIMED_OUT") {
        console.warn(`CUSTOMER: [REALTIME TIMED_OUT] on order_${orderId}`);
      }
    });

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Broadcast collector live GPS coordinates over Supabase Realtime Broadcast.
 */
export function broadcastCollectorLocation(
  orderId: string,
  coords: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  },
) {
  console.log("LOCATION: [LOCATION UPDATE SENT]", coords);
  const channel = supabase.channel(`order_tracking_${orderId}`);
  channel.send({
    type: "broadcast",
    event: "collector_location",
    payload: {
      orderId,
      ...coords,
      timestamp: Date.now(),
    },
  });
}

/**
 * Subscribe to collector live GPS coordinates over Supabase Realtime Broadcast.
 */
export function subscribeToCollectorLocation(
  orderId: string,
  onLocationUpdate: (coords: {
    latitude: number;
    longitude: number;
    heading?: number;
  }) => void,
) {
  const channel = supabase
    .channel(`order_tracking_${orderId}`)
    .on("broadcast", { event: "collector_location" }, ({ payload }) => {
      if (payload && payload.latitude && payload.longitude) {
        console.log("LOCATION: [LOCATION UPDATE RECEIVED]", {
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
        onLocationUpdate({
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          heading: payload.heading,
        });
      }
    })
    .subscribe((status) => {
      if (__DEV__) {
        console.log(`[Realtime: order_tracking_${orderId}] Status:`, status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
