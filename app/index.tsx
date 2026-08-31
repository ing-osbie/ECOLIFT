import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { EcoliftLogo } from "@/components/ecolift-logo";
import { useAuth } from "@/src/context/AuthContext";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isOnboarded } = useApp();

  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const loadingWidth = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withTiming(1.0, {
      duration: 1200,
      easing: Easing.out(Easing.back(1.5)),
    });

    logoOpacity.value = withTiming(1.0, { duration: 1000 });

    loadingWidth.value = withTiming(width * 0.8, {
      duration: 2500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [loadingWidth, logoOpacity, logoScale]);

  useEffect(() => {
    if (loading) return;

    const timeout = setTimeout(() => {
      if (user) {
        if (user.role === "collector") {
          router.replace("/(tabs-collector)");
        } else {
          router.replace("/(tabs)");
        }
      } else if (isOnboarded) {
        router.replace("/login");
      } else {
        router.replace("/onboarding");
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading, user, isOnboarded, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const loadingAnimatedStyle = useAnimatedStyle(() => ({
    width: loadingWidth.value,
  }));

  return (
    <LinearGradient colors={["#0A7A3D", "#14B85A"]} style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <EcoliftLogo size={180} />
      </Animated.View>

      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingBar, loadingAnimatedStyle]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    position: "absolute",
    bottom: 80,
    width: width * 0.8,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    overflow: "hidden",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
  },
});
