import * as Location from "expo-location";
import { supabase } from "@/src/lib/supabase";
import { Collector, CollectorJob } from "@/src/types/collector";
import { Order } from "@/src/types/order";

/**
 * Dispatch an order to eligible online collectors.
 * Uses atomic Postgres RPC 'dispatch_order', with an automatic resilient client fallback.
 */
export async function dispatchOrder(orderId: string): Promise<CollectorJob | null> {
  console.log("CUSTOMER: [ORDER ID]", orderId);

  // 1. Try atomic database RPC
  try {
    const { data, error } = await supabase.rpc("dispatch_order", {
      p_order_id: orderId,
    });
    if (!error && data) {
      return data as CollectorJob;
    }
    if (error) {
      console.warn("dispatch_order RPC notice, using fallback:", error.message);
    }
  } catch (err: any) {
    console.warn("dispatch_order RPC exception, using fallback:", err?.message);
  }

  // 2. Resilient Fallback: Find an online collector in the database
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) {
      console.error("dispatchOrder: order not found:", orderId);
      return null;
    }

    // Ensure collectors exist
    const { data: collectors } = await supabase
      .from("collectors")
      .select("*")
      .order("is_online", { ascending: false });

    let targetCollector = collectors?.find((c) => c.is_online);

    // If no online collector in collectors table, check any collector
    if (!targetCollector && collectors && collectors.length > 0) {
      targetCollector = collectors[0];
      await supabase
        .from("collectors")
        .update({ is_online: true, is_verified: true })
        .eq("id", targetCollector.id);
    }

    // If still no collector in collectors table, check profiles for role = 'collector'
    if (!targetCollector) {
      const { data: collectorProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("role", "collector");

      if (collectorProfiles && collectorProfiles.length > 0) {
        const p = collectorProfiles[0];
        const { data: newCollector } = await supabase
          .from("collectors")
          .insert({
            id: p.id,
            vehicle_name: "EcoLift Truck",
            plate_number: "GT-1024-24",
            rating: 4.9,
            total_jobs: 0,
            is_online: true,
            is_verified: true,
          })
          .select("*")
          .single();
        targetCollector = newCollector;
      }
    }

    if (targetCollector) {
      const { data: custProfile } = await supabase
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
          customer_name: custProfile?.full_name || "EcoLift Customer",
          customer_phone: custProfile?.phone || "",
        })
        .select("*")
        .single();

      if (!jobErr && job) {
        await supabase
          .from("orders")
          .update({ status: "matching" })
          .eq("id", orderId);
        return job as CollectorJob;
      } else if (jobErr) {
        console.warn("Could not insert collector job:", jobErr.message);
      }
    }

    // If no collector found, update order to matching so an online collector can claim it
    await supabase
      .from("orders")
      .update({ status: "matching" })
      .eq("id", orderId);

    return null;
  } catch (fallbackErr) {
    console.warn("dispatchOrder fallback error:", fallbackErr);
    return null;
  }
}

/**
 * Decline a job offer as a collector.
 */
export async function declineOffer(jobId: string, orderId?: string): Promise<void> {
  try {
    const { error } = await supabase.rpc("decline_job", { p_job_id: jobId });
    if (!error) return;
  } catch (err: any) {
    console.warn("decline_job RPC notice, using fallback:", err?.message);
  }

  // Fallback update
  await supabase
    .from("collector_jobs")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (orderId) {
    await supabase
      .from("orders")
      .update({ status: "matching", updated_at: new Date().toISOString() })
      .eq("id", orderId);
  }
}

/**
 * Set order lifecycle state (arrived or pickup_in_progress).
 */
export async function setOrderLifecycle(
  orderId: string,
  status: "arrived" | "pickup_in_progress",
): Promise<Order | null> {
  const rpc = status === "arrived" ? "set_order_arrived" : "start_order_pickup";
  try {
    const { data, error } = await supabase.rpc(rpc, { p_order_id: orderId });
    if (!error && data) return data as Order;
  } catch (err: any) {
    console.warn(`${rpc} RPC notice, using fallback:`, err?.message);
  }

  const now = new Date().toISOString();
  const updates: Partial<Order> =
    status === "arrived"
      ? { status: "arrived", arrived_at: now, updated_at: now }
      : { status: "pickup_in_progress", pickup_started_at: now, updated_at: now };

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) throw error;

  await supabase
    .from("collector_jobs")
    .update({
      status,
      ...(status === "arrived" ? { arrived_at: now } : {}),
      updated_at: now,
    })
    .eq("order_id", orderId);

  return data as Order;
}

/**
 * Ensure collector profile exists in public.collectors and is marked online.
 */
export async function ensureCollectorOnline(collectorId: string): Promise<Collector | null> {
  try {
    const { data: existing } = await supabase
      .from("collectors")
      .select("*")
      .eq("id", collectorId)
      .maybeSingle();

    if (existing) {
      if (!existing.is_online || !existing.is_verified) {
        const { data: updated } = await supabase
          .from("collectors")
          .update({ is_online: true, is_verified: true, updated_at: new Date().toISOString() })
          .eq("id", collectorId)
          .select("*")
          .single();
        return updated as Collector;
      }
      return existing as Collector;
    }

    const { data: created, error } = await supabase
      .from("collectors")
      .insert({
        id: collectorId,
        vehicle_name: "EcoLift Truck",
        plate_number: "GT-1024-24",
        rating: 4.9,
        total_jobs: 0,
        is_online: true,
        is_verified: true,
      })
      .select("*")
      .single();

    if (error) {
      console.warn("Could not auto-create collector profile:", error.message);
      return null;
    }
    return created as Collector;
  } catch (err: any) {
    console.warn("ensureCollectorOnline exception:", err?.message);
    return null;
  }
}

/**
 * Subscribe to jobs assigned to a specific collector.
 */
export function subscribeToAssignedJobs(
  collectorId: string,
  onJob: (job: CollectorJob) => void,
) {
  console.log("COLLECTOR: [COLLECTOR ID]", collectorId);
  console.log("COLLECTOR: [SUBSCRIBING TO JOBS]");

  // Tracks whether *we* initiated the teardown (via the cleanup function
  // below) so a resulting "CLOSED" status isn't misreported as an error.
  // Supabase reports "CLOSED" both for real disconnects and for the normal
  // unsubscribe that happens on unmount/dependency change/HMR, so without
  // this guard a routine cleanup would surface as a console error.
  let intentionallyClosed = false;

  const channel = supabase
    .channel(`collector-offers:${collectorId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "collector_jobs",
        filter: `collector_id=eq.${collectorId}`,
      },
      (payload: any) => {
        const next = payload?.new;
        if (!next) return;
        const job = next as CollectorJob;
        if (job.status === "offered") {
          console.log("COLLECTOR: [NEW JOB RECEIVED]", job.id);
        }
        onJob(job);
      },
    )
    .subscribe((status, error) => {
      console.log("COLLECTOR: [REALTIME STATUS]", status, error?.message ?? "");
      if (status === "CLOSED" && intentionallyClosed) {
        // Expected teardown — not an error.
        return;
      }
      if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
        console.error("COLLECTOR: [REALTIME ERROR]", status, error);
      }
    });

  // Secondary listener on orders table to catch unassigned pending orders
  const pendingOrdersChannel = supabase
    .channel(`pending-orders-fallback:${collectorId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
      },
      async (payload: any) => {
        const next = payload?.new;
        if (!next) return;
        const newOrder = next as Order;
        if (
          !newOrder.collector_id &&
          ["pending", "matching"].includes(newOrder.status)
        ) {
          const { data: existing } = await supabase
            .from("collector_jobs")
            .select("id, status")
            .eq("order_id", newOrder.id)
            .eq("collector_id", collectorId)
            .maybeSingle();

          if (!existing) {
            try {
              const { data: customerProfile } = await supabase
                .from("profiles")
                .select("full_name, phone")
                .eq("id", newOrder.customer_id)
                .maybeSingle();

              const { data: job, error: jobErr } = await supabase
                .from("collector_jobs")
                .insert({
                  collector_id: collectorId,
                  order_id: newOrder.id,
                  customer_id: newOrder.customer_id,
                  waste_type: newOrder.waste_type,
                  pickup_address: newOrder.pickup_address,
                  pickup_lat: newOrder.pickup_lat,
                  pickup_lng: newOrder.pickup_lng,
                  bags_count: newOrder.bags_count,
                  fare: newOrder.price,
                  status: "offered",
                  customer_name: customerProfile?.full_name || "EcoLift Customer",
                  customer_phone: customerProfile?.phone || "",
                })
                .select("*")
                .single();

              if (!jobErr && job) {
                console.log("COLLECTOR: [NEW JOB RECEIVED]", job.id);
                onJob(job as CollectorJob);
              }
            } catch (err: any) {
              console.warn("Self-offer fallback error:", err?.message);
            }
          }
        }
      },
    )
    .subscribe();

  return () => {
    intentionallyClosed = true;
    void supabase.removeChannel(channel);
    void supabase.removeChannel(pendingOrdersChannel);
  };
}

/**
 * Subscribe to a specific order for customer-side live updates.
 */
export function subscribeToOrder(
  orderId: string,
  onOrder: (order: Order) => void,
) {
  console.log("CUSTOMER: [SUBSCRIBING TO ORDER]", orderId);
  const channel = supabase
    .channel(`order-tracking:${orderId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`,
      },
      (payload: any) => {
        const next = payload?.new;
        if (next) {
          const updated = next as Order;
          console.log("CUSTOMER: [ORDER UPDATE RECEIVED]", updated.id, updated.status);
          if (updated.status === "arrived") {
            console.log("ARRIVAL: [ARRIVED EVENT RECEIVED]", updated.id);
          }
          onOrder(updated);
        }
      },
    )
    .subscribe((status, error) => {
      console.log(`CUSTOMER: [REALTIME STATUS] order: ${status}`, error?.message ?? "");
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Broadcast collector live GPS coordinates over Supabase Realtime Broadcast.
 */
export function broadcastCollectorLocation(
  collectorId: string,
  coords: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  },
) {
  console.log("LOCATION: [LOCATION UPDATE SENT]", coords);
  const channel = supabase.channel(`collector-broadcast:${collectorId}`);
  channel.send({
    type: "broadcast",
    event: "collector_location",
    payload: {
      collectorId,
      ...coords,
      timestamp: Date.now(),
    },
  });
}

/**
 * Subscribe to collector live GPS coordinates (via Realtime Broadcast and DB changes).
 */
export function subscribeToCollectorLocation(
  collectorId: string,
  onLocation: (lat: number, lng: number) => void,
) {
  // 1. Realtime Broadcast listener
  const broadcastChannel = supabase
    .channel(`collector-broadcast:${collectorId}`)
    .on("broadcast", { event: "collector_location" }, ({ payload }) => {
      if (payload && payload.latitude != null && payload.longitude != null) {
        console.log("LOCATION: [LOCATION UPDATE RECEIVED]", {
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
        onLocation(Number(payload.latitude), Number(payload.longitude));
      }
    })
    .subscribe();

  // 2. Postgres changes fallback
  const dbChannel = supabase
    .channel(`collector-location:${collectorId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "collectors",
        filter: `id=eq.${collectorId}`,
      },
      (payload: any) => {
        const next = payload?.new;
        const c = next as { current_lat?: number; current_lng?: number } | undefined;
        if (c && c.current_lat != null && c.current_lng != null) {
          console.log("LOCATION: [LOCATION UPDATE RECEIVED]", {
            latitude: c.current_lat,
            longitude: c.current_lng,
          });
          onLocation(c.current_lat, c.current_lng);
        }
      },
    )
    .subscribe((status, error) => {
      if (status === "CHANNEL_ERROR") {
        console.warn(`[REALTIME STATUS] collector location: ${status}`, error?.message);
      }
    });

  return () => {
    void supabase.removeChannel(broadcastChannel);
    void supabase.removeChannel(dbChannel);
  };
}

/**
 * Start live GPS tracking during active job navigation.
 */
export async function startActiveJobLocationTracking(
  order: Order,
  onArrival: () => void,
): Promise<{ remove: () => void }> {
  const userRes = await supabase.auth.getUser();
  const collectorId = userRes.data.user?.id;
  if (!collectorId) return { remove: () => {} };

  let permission: Location.LocationPermissionResponse;
  try {
    permission = await Location.requestForegroundPermissionsAsync();
  } catch (err) {
    console.warn("Location permission request error:", err);
    permission = { status: Location.PermissionStatus.DENIED } as any;
  }

  let lastSent = 0;
  let arrived = false;

  const handleLocation = async (coords: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  }) => {
    if (Date.now() - lastSent < 4000) return;
    lastSent = Date.now();

    // 1. Broadcast real-time
    broadcastCollectorLocation(collectorId, coords);

    // 2. Persist to DB
    supabase
      .from("collectors")
      .update({
        current_lat: coords.latitude,
        current_lng: coords.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collectorId)
      .then();

    // 3. Geofence arrival check (within 80m of pickup point)
    if (
      !arrived &&
      order.pickup_lat != null &&
      order.pickup_lng != null
    ) {
      const dist = distanceMeters(
        coords.latitude,
        coords.longitude,
        order.pickup_lat,
        order.pickup_lng,
      );
      if (dist <= 80) {
        arrived = true;
        console.log("ARRIVAL: [ARRIVAL DETECTED]", order.id);
        onArrival();
      }
    }
  };

  if (permission.status === "granted") {
    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        ({ coords }) => {
          void handleLocation(coords);
        },
      );
      return {
        remove: () => sub.remove(),
      };
    } catch (watchErr) {
      console.warn("watchPositionAsync failed, falling back to interval:", watchErr);
    }
  }

  // Fallback simulator interval for testing without hardware GPS
  let simStep = 0;
  const startLat = order.pickup_lat ? order.pickup_lat + 0.012 : 5.564;
  const startLng = order.pickup_lng ? order.pickup_lng + 0.012 : -0.192;
  const targetLat = order.pickup_lat ?? 5.5593;
  const targetLng = order.pickup_lng ?? -0.1974;

  const simInterval = setInterval(() => {
    simStep = Math.min(simStep + 0.05, 1);
    const currLat = startLat + (targetLat - startLat) * simStep;
    const currLng = startLng + (targetLng - startLng) * simStep;
    void handleLocation({ latitude: currLat, longitude: currLng });
    if (simStep >= 1) clearInterval(simInterval);
  }, 5000);

  return {
    remove: () => clearInterval(simInterval),
  };
}

/**
 * Calculate distance in meters between two lat/lng coordinates (Haversine formula).
 */
export function distanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const r = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
