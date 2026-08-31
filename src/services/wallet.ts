import { supabase } from "@/src/lib/supabase";
import {
  PaymentMethod,
  TransactionType,
  Wallet,
  WalletTransaction,
} from "@/src/types/wallet";
import { getCurrentUserId } from "./auth";

export async function getWallet(userId?: string): Promise<Wallet | null> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return null;

  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  if (error) {
    if (!error.message.includes("schema cache")) console.error("Error loading wallet:", error.message);
    return null;
  }

  // Wallet missing — create it safely
  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from("wallets")
      .insert({ user_id: id })
      .select("*")
      .maybeSingle();

    if (insertError) {
      console.error("Error creating wallet:", insertError.message);
      return null;
    }
    return created as Wallet;
  }

  return data as Wallet;
}

export async function getTransactions(
  userId?: string,
): Promise<WalletTransaction[]> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return [];

  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading transactions:", error.message);
    return [];
  }

  return (data ?? []) as WalletTransaction[];
}

/**
 * Top up user wallet securely using database RPC.
 */
export async function topUpWallet(
  amount: number,
  description = "Wallet top-up",
  reference?: string,
): Promise<Wallet | null> {
  const { data, error } = await supabase.rpc("top_up_wallet", {
    p_amount: amount,
    p_description: description,
    p_reference: reference ?? null,
  });

  if (error) {
    console.error("RPC top_up_wallet error:", error.message);
    throw error;
  }

  return data as Wallet;
}

/**
 * Debit user wallet securely using database RPC.
 */
export async function debitWallet(
  amount: number,
  description = "Payment",
  reference?: string,
): Promise<Wallet | null> {
  const { data, error } = await supabase.rpc("debit_wallet", {
    p_amount: amount,
    p_description: description,
    p_reference: reference ?? null,
  });

  if (error) {
    console.error("RPC debit_wallet error:", error.message);
    throw error;
  }

  return data as Wallet;
}

export async function recordTransaction(
  userId: string,
  walletId: string,
  amount: number,
  type: TransactionType,
  status: "pending" | "successful" | "failed" | "refunded",
  description?: string,
): Promise<WalletTransaction | null> {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      wallet_id: walletId,
      amount,
      type,
      status,
      description,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error recording transaction:", error.message);
    return null;
  }

  return data as WalletTransaction;
}

export async function getPaymentMethods(
  userId?: string,
): Promise<PaymentMethod[]> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return [];

  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading payment methods:", error.message);
    return [];
  }

  return (data ?? []) as PaymentMethod[];
}

export async function savePaymentMethod(
  input: Omit<PaymentMethod, "id" | "user_id" | "created_at">,
): Promise<PaymentMethod | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("payment_methods")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();

  if (error) throw error;

  return data as PaymentMethod;
}
