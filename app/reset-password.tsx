import { Colors } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResetPassword() {
  const router = useRouter();
  const { requestPasswordReset, updatePassword, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (requestError: any) {
      setError(requestError?.message || "Unable to send the reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updatePassword(password);
      router.replace(user?.role === "collector" ? "/(tabs-collector)" : "/(tabs)");
    } catch (updateError: any) {
      setError(updateError?.message || "Unable to update your password.");
    } finally {
      setLoading(false);
    }
  };

  const isRecoverySession = Boolean(user);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>{isRecoverySession ? "Create a new password" : "Reset your password"}</Text>
        <Text style={styles.subtitle}>
          {isRecoverySession
            ? "Choose a strong password for your EcoLift account."
            : "We will send a secure password reset link to your email."}
        </Text>

        {!isRecoverySession ? (
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#6B7280"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {sent ? <Text style={styles.success}>Check your email for the secure reset link.</Text> : null}

        <TouchableOpacity style={styles.button} onPress={isRecoverySession ? handleUpdate : handleRequest} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{isRecoverySession ? "Update Password" : "Send Reset Link"}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/login")} style={styles.backButton}>
          <Text style={styles.backText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0FDF4", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, gap: 14, elevation: 4 },
  title: { fontSize: 24, fontFamily: "Poppins-Bold", color: Colors.primary },
  subtitle: { fontSize: 14, lineHeight: 21, fontFamily: "Poppins-Medium", color: "#4B5563" },
  input: { height: 52, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 14, paddingHorizontal: 14, fontFamily: "Poppins-Medium", color: "#111827" },
  button: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary },
  buttonText: { color: "#FFFFFF", fontFamily: "Poppins-Bold", fontSize: 14 },
  backButton: { alignItems: "center", paddingVertical: 8 },
  backText: { color: Colors.primary, fontFamily: "Poppins-SemiBold", fontSize: 13 },
  error: { color: "#BA1A1A", fontFamily: "Poppins-Medium", fontSize: 12 },
  success: { color: "#047857", fontFamily: "Poppins-Medium", fontSize: 12 },
});
