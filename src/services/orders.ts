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
    .insert({ ...input, customer_id: userId, status: "matching" })
    .select("*")
    .single();

  if (error) throw error;

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
  const { data, error } = await supabase.rpc("accept_order", {
    p_order_id: orderId,
  });

  if (error) throw error;

  return data as Order;
}

export async function completeOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase.rpc("complete_order", {
    p_order_id: orderId,
  });

  if (error) throw error;

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
 * Real-time subscription for a single order by ID.
 */
export function subscribeToOrderById(
  orderId: string,
  onOrderUpdate: (order: Order) => void,
) {
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
          onOrderUpdate(payload.new as Order);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
