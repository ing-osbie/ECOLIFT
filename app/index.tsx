import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Image } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/theme";
import Svg, { Defs, Pattern, Rect, Path } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isOnboarded } = useApp();

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(32);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16);
  const loaderOpacity = useSharedValue(0);
  const loaderWidth = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
      logoTranslateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.cubic) });
    }, 100);

    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      textTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });
    }, 400);

    setTimeout(() => {
      loaderOpacity.value = withTiming(1, { duration: 800 });
      loaderWidth.value = withTiming(width * 0.48, { duration: 2500, easing: Easing.bezier(0.65, 0, 0.35, 1) });
    }, 800);
  }, []);

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      if (user) {
        router.replace(user.role === "collector" ? "/(tabs-collector)" : "/(tabs)");
      } else if (isOnboarded) {
        router.replace("/login");
      } else {
        router.replace("/onboarding");
      }
    }, 3200);
    return () => clearTimeout(timeout);
  }, [loading, user, isOnboarded, router]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const loaderContainerStyle = useAnimatedStyle(() => ({
    opacity: loaderOpacity.value,
  }));

  const loaderBarStyle = useAnimatedStyle(() => ({
    width: loaderWidth.value,
  }));

  return (
    <View style={styles.container}>
      {/* Leaf pattern background */}
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
        <Defs>
          <Pattern id="leaf" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Path d="M40 20 Q60 40 40 70 Q20 40 40 20 Z" fill={Colors.primary} opacity="0.03" />
            <Path d="M10 50 Q25 65 10 90 Q-5 65 10 50 Z" fill={Colors.primary} opacity="0.015" />
            <Path d="M70 10 Q85 25 70 50 Q55 25 70 10 Z" fill={Colors.primary} opacity="0.015" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#leaf)" />
      </Svg>

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida/AEtjO1XcXV5fbdHGNsqeCGly0UlSej52rtC_mjiNz-wgtk0IBvm41436Cn7_bH9IuDiDvPj1XQSSO44Hr7AyapNiRtQB5kBbalFGbLkan0qIhiWUqxd8wsp5doOx5bEsgKli46jrIB_MALi29-JIacOn2bNGMtxgtTwDyKeQcm2blObJA3fmUpgrt2IV1okVTRPF8nMFwl28EpQTFJGxSZp_CpCW8WoJpcSQKvN-XoqbMu_XpGLQPiuWQgR6DJaPWS5IlNcQiXDOgKPOvw" }}
            style={styles.logoImage}
          />
        </Animated.View>

        {/* Mission text */}
        <Animated.Text style={[styles.missionText, textStyle]}>
          Revolutionizing recycling,{"\n"}one pickup at a time.
        </Animated.Text>

        {/* Progress bar */}
        <Animated.View style={[styles.loaderTrack, loaderContainerStyle]}>
          <Animated.View style={[styles.loaderBar, loaderBarStyle]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoWrapper: {
    width: 128,
    height: 128,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 40,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  missionText: {
    fontSize: 18,
    fontFamily: "Poppins-Medium",
    color: "#404944",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 40,
  },
  loaderTrack: {
    width: width * 0.48,
    height: 4,
    backgroundColor: "#dce2f3",
    borderRadius: 4,
    overflow: "hidden",
  },
  loaderBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
});
