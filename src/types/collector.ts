import type { WasteType } from "./order";

export type JobStatus =
  | "pending"
  | "offered"
  | "accepted"
  | "in_progress"
  | "en_route"
  | "arrived"
  | "pickup_in_progress"
  | "declined"
  | "completed"
  | "cancelled";

export interface VehicleType {
  id: string;
  name: string;
  description?: string | null;
  capacity_kg?: number | null;
  base_price: number;
  image_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Collector {
  id: string;
  vehicle_type_id?: string | null;
  vehicle_name?: string | null;
  plate_number?: string | null;
  rating: number;
  total_jobs: number;
  is_online: boolean;
  is_verified: boolean;
  id_front_url?: string | null;
  id_back_url?: string | null;
  current_lat?: number | null;
  current_lng?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CollectorJob {
  id: string;
  collector_id: string;
  order_id?: string | null;
  customer_id?: string | null;
  waste_type: WasteType;
  pickup_address?: string | null;
  fare: number;
  status: JobStatus;
  rating?: number | null;
  completed_at?: string | null;
  offered_at?: string | null;
  accepted_at?: string | null;
  arrived_at?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  bags_count?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCollectorInput {
  vehicle_type_id?: string;
  vehicle_name?: string;
  plate_number?: string;
  id_front_url?: string;
  id_back_url?: string;
}

export interface CreateCollectorJobInput {
  order_id?: string;
  customer_id?: string;
  waste_type: WasteType;
  pickup_address?: string;
  fare: number;
}
