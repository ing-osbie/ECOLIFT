import { supabase } from "@/src/lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function AuthCallback() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();

  const [message, setMessage] = useState("Verifying your account…");

  useEffect(() => {
    let mounted = true;

    async function completeAuthentication() {
      try {
        // Handle OAuth/email verification errors returned by Supabase.
        if (params.error) {
          throw new Error(
            params.error_description || params.error || "Authentication failed.",
          );
        }

        // Supabase sends an authorization code to the callback.
        if (params.code) {
          setMessage("Completing authentication…");

          const { error } = await supabase.auth.exchangeCodeForSession(
            params.code,
          );

          if (error) throw error;
        }

        // Give Supabase a moment to persist the new session.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          throw new Error(
            "Verification completed, but no authenticated session was found.",
          );
        }

        if (!mounted) return;

        // Load the user's profile directly.
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!mounted) return;

        if (profile?.role === "collector") {
          router.replace("/(tabs-collector)");
        } else {
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Auth callback error:", error);

        if (!mounted) return;

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to complete account verification.",
        );

        // Give the user a moment to see the error.
        setTimeout(() => {
          if (mounted) {
            router.replace("/login");
          }
        }, 2500);
      }
    }

    completeAuthentication();

    return () => {
      mounted = false;
    };
  }, [params.code, params.error, params.error_description, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0A7A3D" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
    gap: 16,
  },
  text: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#0B3D2E",
    textAlign: "center",
  },
});
