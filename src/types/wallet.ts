import type { PaymentMethodType } from "./order";

export type TransactionType = "credit" | "debit";
export type TransactionStatus =
  | "pending"
  | "successful"
  | "failed"
  | "refunded";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string | null;
  reference?: string | null;
  created_at?: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: PaymentMethodType;
  label?: string | null;
  details?: Record<string, unknown> | null;
  is_default: boolean;
  created_at?: string;
}
