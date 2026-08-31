import { supabase } from "./supabase";

export async function testSupabase() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Supabase Error:", error.message);
    return;
  }

  console.log("Supabase Connected:", data);
}
