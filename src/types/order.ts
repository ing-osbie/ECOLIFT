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
  pickup_date?: string | null;
  bags_count: number;
  price: number;
  status: OrderStatus;
  payment_method: PaymentMethodType;
  rating?: number | null;
  review?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderInput {
  waste_type: WasteType;
  pickup_lat?: number;
  pickup_lng?: number;
  pickup_address?: string;
  pickup_date?: string;
  bags_count?: number;
  vehicle_type_id?: string;
  price?: number;
  payment_method?: PaymentMethodType;
}
