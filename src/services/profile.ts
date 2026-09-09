import { supabase } from "@/src/lib/supabase";
import { Profile } from "@/src/types/auth";
import { getCurrentUserId } from "./auth";

export async function getProfile(userId?: string): Promise<Profile | null> {
  const id = userId ?? (await getCurrentUserId());
  if (!id) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle(); // won't crash if 0 rows

  if (error) {
    if (
      !error.message.includes("schema cache") &&
      !error.message.includes("JWT issued at future")
    ) {
      console.error("Error loading profile:", error.message);
    }
    return null;
  }

  // Profile row missing — only create it when an authenticated
  // Supabase session exists. This prevents auth.uid() from being NULL.
  if (!data) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return null;
    }

    const metadata = session.user.user_metadata ?? {};

    const { data: created, error: insertError } = await supabase.rpc(
      "ensure_my_profile",
      {
        p_full_name: metadata.full_name ?? "",
        p_phone: metadata.phone ?? null,
        p_role: metadata.role ?? null,
      },
    );

    if (insertError) {
      throw insertError;
    }

    return created as Profile;
  }

  return data as Profile;
}

export async function updateProfile(
  updates: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>,
): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw error;

  return data as Profile;
}

export async function uploadAvatar(
  fileUri: string,
  mimeType = "image/jpeg",
): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const ext = mimeType.split("/")[1] || "jpg";
  const filePath = `${userId}/avatar.${ext}`;
  const response = await fetch(fileUri);
  if (!response.ok) throw new Error("Unable to read the selected image.");
  const file = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: mimeType,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  await updateProfile({ avatar_url: urlData.publicUrl });

  return urlData.publicUrl;
}
