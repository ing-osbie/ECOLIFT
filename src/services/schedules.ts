import { supabase } from "@/src/lib/supabase";
import {
    CreateScheduledPickupInput,
    ScheduledPickup,
} from "@/src/types/schedule";
import { getCurrentUserId } from "./auth";

export async function getSchedules(
  userId?: string,
): Promise<ScheduledPickup[]> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return [];

  const { data, error } = await supabase
    .from("scheduled_pickups")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    if (!error.message.includes("schema cache")) console.error("Error loading schedules:", error.message);
    return [];
  }

  return (data ?? []) as ScheduledPickup[];
}

export async function createSchedule(
  input: CreateScheduledPickupInput,
): Promise<ScheduledPickup | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("scheduled_pickups")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();

  if (error) throw error;

  return data as ScheduledPickup;
}

export async function updateSchedule(
  scheduleId: string,
  updates: Partial<ScheduledPickup>,
): Promise<ScheduledPickup | null> {
  const { data, error } = await supabase
    .from("scheduled_pickups")
    .update(updates)
    .eq("id", scheduleId)
    .select("*")
    .single();

  if (error) throw error;

  return data as ScheduledPickup;
}

export async function toggleSchedule(
  scheduleId: string,
  enabled: boolean,
): Promise<ScheduledPickup | null> {
  return updateSchedule(scheduleId, { enabled });
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from("scheduled_pickups")
    .delete()
    .eq("id", scheduleId);

  if (error) throw error;
}
