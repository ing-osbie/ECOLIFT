import { supabase } from "@/src/lib/supabase";
import { UserRole } from "@/src/types/auth";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

const REDIRECT_URL = makeRedirectUri({
  scheme: "ecoliftapp",
  path: "auth/callback",
});
console.log("GOOGLE REDIRECT URL:", REDIRECT_URL);

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  _role: UserRole,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        // Elevated roles are provisioned server-side after registration.
        role: "customer",
      },
    },
  });

  if (error) throw error;

  return data;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: Linking.createURL("/reset-password"),
  });

  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function getEmailForFullName(fullName: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_login_email_by_name", {
    p_full_name: fullName.trim(),
  });

  if (error) throw error;
  return typeof data === "string" ? data : null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user?.id ?? null;
}

/**
 * Sign in / sign up with Google using Supabase's OAuth flow.
 * Opens an in-app browser (native) or navigates (web) to the Google consent
 * screen, then exchanges the returned authorization code for a session.
 *
 * @returns `true` if a session was established, `false` if the user cancelled
 *          the OAuth flow (dismissed/closed the browser session).
 */
export async function signInWithGoogle(): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Unable to start Google sign-in.");

  // On web, perform a full-page redirect to the provider. Supabase will
  // detect the session from the callback URL (detectSessionInUrl is true on
  // web) and the /auth/callback route completes the flow.
  if (Platform.OS === "web") {
    window.location.assign(data.url);
    // The page navigates away; indicate the flow is "in progress" but not
    // cancelled. The caller should not navigate on this branch.
    return false;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);

  if (result.type !== "success") {
    // User cancelled, dismissed, or the session closed before completing.
    return false;
  }

  const code = extractCodeFromUrl(result.url);
  const { error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) throw sessionError;

  return true;
}

function extractCodeFromUrl(url: string): string {
  const parsed = new URL(url);

  // OAuth providers append error/error_description on failure.
  const oauthError = parsed.searchParams.get("error");
  if (oauthError) {
    throw new Error(
      parsed.searchParams.get("error_description") ||
        "Google sign-in was not completed.",
    );
  }

  const code = parsed.searchParams.get("code");
  if (!code) {
    throw new Error("No authorization code found in the callback URL.");
  }
  return code;
}
