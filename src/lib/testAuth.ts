import { supabase } from "./supabase";

export async function testAuth() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.log("Auth Error:", error.message);
  } else {
    console.log("Supabase Auth Connected:", data);
  }
}
