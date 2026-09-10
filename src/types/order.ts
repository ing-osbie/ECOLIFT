export type WasteType =
  | "household"
  | "recyclables"
  | "commercial"
  | "bulk_construction"
  | "organic"
  | "e_waste";

export type OrderStatus =
  | "pending"
  | "matching"
  | "confirmed"
  | "en_route"
  | "arrived"
  | "pickup_in_progress"
  | "completed"
  | "cancelled";

export type PaymentMethodType = "cash" | "momo" | "card" | "wallet";

export interface Order {
  id: string;
  customer_id: string;
  collector_id?: string | null;
  vehicle_type_id?: string | null;
  waste_type: WasteType;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  pickup_address?: string | null;
  disposal_lat?: number | null;
  disposal_lng?: number | null;
  disposal_address?: string | null;
  pickup_date?: string | null;
  bags_count: number;
  price: number;
  status: OrderStatus;
  payment_method: PaymentMethodType;
  rating?: number | null;
  review?: string | null;
  special_instructions?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  accepted_at?: string | null;
  arrived_at?: string | null;
  pickup_started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderInput {
  waste_type: WasteType;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_address?: string;
  disposal_lat?: number;
  disposal_lng?: number;
  disposal_address?: string;
  pickup_date?: string;
  bags_count?: number;
  vehicle_type_id?: string;
  price?: number;
  payment_method?: PaymentMethodType;
  special_instructions?: string;
}
