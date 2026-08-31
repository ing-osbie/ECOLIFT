import { supabase } from "@/src/lib/supabase";
import {
  CreateNotificationInput,
  NotificationItem,
} from "@/src/types/notification";
import { getCurrentUserId } from "./auth";

export async function getNotifications(
  userId?: string,
): Promise<NotificationItem[]> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    if (!error.message.includes("schema cache")) console.error("Error loading notifications:", error.message);
    return [];
  }

  return (data ?? []) as NotificationItem[];
}

export async function sendNotification(
  input: CreateNotificationInput,
  userId?: string,
): Promise<NotificationItem | null> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return null;

  const { data, error } = await supabase
    .from("notifications")
    .insert({ ...input, user_id: id })
    .select("*")
    .single();

  if (error) {
    console.error("Error sending notification:", error.message);
    return null;
  }

  return data as NotificationItem;
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", id);

  if (error) throw error;
}

export async function clearNotifications(userId?: string): Promise<void> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return;

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", id);

  if (error) throw error;
}

/**
 * Real-time subscription to notifications for a user.
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: NotificationItem) => void,
) {
  const subscription = supabase
    .channel(`user_notifications_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new) {
          onNewNotification(payload.new as NotificationItem);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}
