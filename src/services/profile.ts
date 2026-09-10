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
    const metaAvatar = metadata.avatar_url || metadata.picture || null;
    const metaName = metadata.full_name || metadata.name || "";

    const { data: created, error: insertError } = await supabase.rpc(
      "ensure_my_profile",
      {
        p_full_name: metaName,
        p_phone: metadata.phone ?? null,
        p_role: metadata.role ?? null,
      },
    );

    if (insertError) {
      throw insertError;
    }

    const profileData = created as Profile;
    if (metaAvatar && !profileData.avatar_url) {
      try {
        await supabase
          .from("profiles")
          .update({ avatar_url: metaAvatar })
          .eq("id", id);
        profileData.avatar_url = metaAvatar;
      } catch {
        // Non-critical if background update fails
      }
    }

    return profileData;
  }

  // Profile exists — auto-sync Google avatar and full_name if missing from DB profile
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user && session.user.id === id) {
      const meta = session.user.user_metadata ?? {};
      const metaAvatar = meta.avatar_url || meta.picture || null;
      const metaName = meta.full_name || meta.name || null;

      const updates: { avatar_url?: string; full_name?: string } = {};

      if (metaAvatar && !data.avatar_url) {
        updates.avatar_url = metaAvatar;
        data.avatar_url = metaAvatar;
      }
      if (metaName && (!data.full_name || data.full_name.trim() === "")) {
        updates.full_name = metaName;
        data.full_name = metaName;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", id);
      }
    }
  } catch (syncErr) {
    // Non-blocking sync attempt
    console.warn("Profile metadata sync error:", syncErr);
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

  const ext = (mimeType.split("/")[1] || fileUri.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  // Using timestamp ensures uniqueness and prevents cache collisions
  const filePath = `${userId}/avatar_${Date.now()}.${ext}`;

  let fileBody: any;
  try {
    const response = await fetch(fileUri);
    if (!response.ok) throw new Error("Unable to read the selected image.");
    fileBody = await response.blob();
  } catch {
    // Native fallback via expo-file-system legacy
    const legacyFs = await import("expo-file-system/legacy");
    const base64 = await legacyFs.readAsStringAsync(fileUri, {
      encoding: legacyFs.EncodingType.Base64,
    });
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    fileBody = bytes.buffer;
  }

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, fileBody, {
      upsert: true,
      contentType: mimeType,
    });

  if (uploadError) {
    console.warn("Supabase avatar storage error:", uploadError);
    if (
      (uploadError as any)?.message?.toLowerCase().includes("bucket not found") ||
      (uploadError as any)?.error === "Bucket not found" ||
      (uploadError as any)?.statusCode === 404 ||
      (uploadError as any)?.statusCode === "404"
    ) {
      // Fallback: If 'avatars' storage bucket is not created yet, store base64 Data URI
      // directly on the user profile so photo upload always succeeds.
      try {
        let base64Data: string;
        try {
          const legacyFs = await import("expo-file-system/legacy");
          base64Data = await legacyFs.readAsStringAsync(fileUri, {
            encoding: legacyFs.EncodingType.Base64,
          });
        } catch {
          const response = await fetch(fileUri);
          const blob = await response.blob();
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              resolve(res.includes(",") ? res.split(",")[1] : res);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        const finalDataUri = `data:${mimeType};base64,${base64Data}`;
        await updateProfile({ avatar_url: finalDataUri });
        return finalDataUri;
      } catch (fallbackErr) {
        console.warn("Avatar base64 fallback error:", fallbackErr);
      }
    }
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const finalAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
  await updateProfile({ avatar_url: finalAvatarUrl });

  return finalAvatarUrl;
}
