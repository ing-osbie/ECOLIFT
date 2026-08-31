import type { WasteType } from "./order";

export interface ScheduledPickup {
  id: string;
  user_id: string;
  frequency: string;
  days: string[];
  address?: string | null;
  waste_type: WasteType;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateScheduledPickupInput {
  frequency: string;
  days: string[];
  address?: string;
  waste_type: WasteType;
  enabled?: boolean;
}
