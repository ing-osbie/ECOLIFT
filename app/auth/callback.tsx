import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * OAuth callback route.
 *
 * On web, after a full-page redirect through Google, Supabase appends the
 * auth code to this URL. We exchange it for a session and then redirect the
 * user into the app.
 */
export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (user.role === "collector") {
        router.replace("/(tabs-collector)");
      } else {
        router.replace("/(tabs)");
      }
    } else {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0A7A3D" />
      <Text style={styles.text}>Completing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  text: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#0B3D2E",
  },
});
