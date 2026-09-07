import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import { useAuth } from "@/src/context/AuthContext";
import { useApp } from "@/context/AppContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const LOGO_REMOTE_URI =
  "https://lh3.googleusercontent.com/aida/AEtjO1WV8X6zDeLucqhQN-VklK3HXKfnCqh-O-OoFAopiqv2Eu0grrnceTTcyEZn3NADJl4GnsxQ8K97lUBoYa0qteYCBkFIFGJiDa2RtcfMUg6htWx6cdxyF7Arlt3_wr1XeWCmKOOX6YXnrefjhPJ01uCm1eGAB21g-7HS2OkVEefGf-kHAAh84UyNVBatPHlOg5XrWROiHgaBVruk_BxWl6OACNEVt8TVM1dNZqxe3JuHJHVUIp2XuaCmdXfZnmTwaA3-jy64itxAVA";
const localLogo = require("../assets/images/ecolift-logo.png");

// Design tokens from provided Tailwind HTML specification
const THEME = {
  light: {
    surface: "#f9f9ff",
    onSurface: "#151c27",
    onSurfaceVariant: "#404944",
    primary: "#003527",
    surfaceVariant: "#dce2f3",
    patternColor: "#003527",
  },
  dark: {
    surface: "#0f1512",
    onSurface: "#ebf1ff",
    onSurfaceVariant: "#a0aaa4",
    primary: "#6cf8bb",
    surfaceVariant: "rgba(255, 255, 255, 0.12)",
    patternColor: "#95d3ba",
  },
};

const LOADER_WIDTH = 192; // w-48 = 192px

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isOnboarded, isDarkMode } = useApp();
  const [imageError, setImageError] = useState(false);

  const colors = isDarkMode ? THEME.dark : THEME.light;

  // Animation shared values matching HTML transitions
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(32); // translate-y-8 = 32px

  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(16); // translate-y-4 = 16px

  const loaderOpacity = useSharedValue(0);
  const loaderWidth = useSharedValue(0);

  useEffect(() => {
    // Easing curve from HTML: cubic-bezier(0.16, 1, 0.3, 1)
    const cubicSmooth = Easing.bezier(0.16, 1, 0.3, 1);
    // Loader easing curve from HTML: cubic-bezier(0.65, 0, 0.35, 1)
    const loaderSmooth = Easing.bezier(0.65, 0, 0.35, 1);

    const animationTimers = [
      // 1. Logo transition: 1s cubic-bezier(0.16, 1, 0.3, 1) at 100ms
      setTimeout(() => {
        logoOpacity.value = withTiming(1, { duration: 1000, easing: cubicSmooth });
        logoTranslateY.value = withTiming(0, { duration: 1000, easing: cubicSmooth });
      }, 100),

      // 2. Text transition: 0.8s cubic-bezier(0.16, 1, 0.3, 1) at 400ms (100ms + 0.3s delay)
      setTimeout(() => {
        textOpacity.value = withTiming(1, { duration: 800, easing: cubicSmooth });
        textTranslateY.value = withTiming(0, { duration: 800, easing: cubicSmooth });
      }, 400),

      // 3. Loader container transition: opacity 0.8s at 700ms (100ms + 0.6s delay)
      setTimeout(() => {
        loaderOpacity.value = withTiming(1, { duration: 800 });
      }, 700),

      // 4. Loader bar transition: width 2.5s cubic-bezier(0.65, 0, 0.35, 1) at 900ms (100ms + 0.8s delay)
      setTimeout(() => {
        loaderWidth.value = withTiming(LOADER_WIDTH, { duration: 2500, easing: loaderSmooth });
      }, 900),
    ];

    return () => animationTimers.forEach(clearTimeout);
  }, [loaderOpacity, loaderWidth, logoOpacity, logoTranslateY, textOpacity, textTranslateY]);

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
    }, 3500);
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
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Subtle Organic Leaf Pattern */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <Pattern
            id="leaf-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Path
              d="M40 20 Q60 40 40 70 Q20 40 40 20 Z"
              fill={colors.patternColor}
              opacity={0.03}
            />
            <Path
              d="M10 50 Q25 65 10 90 Q-5 65 10 50 Z"
              fill={colors.patternColor}
              opacity={0.015}
            />
            <Path
              d="M70 10 Q85 25 70 50 Q55 25 70 10 Z"
              fill={colors.patternColor}
              opacity={0.015}
            />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#leaf-pattern)" />
      </Svg>

      {/* Main Content: px-margin-mobile (20px), pt-[25vh], pb-[30vh] */}
      <View
        style={[
          styles.content,
          {
            paddingTop: SCREEN_HEIGHT * 0.25,
            paddingBottom: SCREEN_HEIGHT * 0.3,
          },
        ]}
      >
        {/* App Logo: w-32 h-32 rounded-3xl overflow-hidden shadow-xl mb-xl (64px) */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <Image
            source={imageError ? localLogo : { uri: LOGO_REMOTE_URI }}
            onError={() => setImageError(true)}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Mission Statement: font-body-lg text-body-lg text-on-surface-variant max-w-[280px] mb-lg (40px) */}
        <Animated.Text
          style={[
            styles.missionText,
            { color: colors.onSurfaceVariant },
            textStyle,
          ]}
        >
          Revolutionizing recycling, one pickup at a time.
        </Animated.Text>

        {/* Loading Indicator Track: w-48 h-1 bg-surface-variant rounded-full overflow-hidden shadow-sm */}
        <Animated.View
          style={[
            styles.loaderTrack,
            { backgroundColor: colors.surfaceVariant },
            loaderContainerStyle,
          ]}
        >
          {/* Loading Indicator Bar: h-full bg-primary rounded-full */}
          <Animated.View
            style={[
              styles.loaderBar,
              { backgroundColor: colors.primary },
              loaderBarStyle,
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20, // px-margin-mobile
    position: "relative",
    zIndex: 10,
  },
  logoWrapper: {
    width: 128, // w-32
    height: 128, // h-32
    borderRadius: 24, // rounded-3xl
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10, // shadow-xl
    marginBottom: 64, // mb-xl (64px)
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  missionText: {
    fontSize: 18, // text-body-lg (18px)
    lineHeight: 28, // lineHeight: 28px
    fontFamily: "Poppins-Regular",
    textAlign: "center",
    maxWidth: 280, // max-w-[280px]
    marginBottom: 40, // mb-lg (40px)
  },
  loaderTrack: {
    width: LOADER_WIDTH, // w-48 = 192px
    height: 4, // h-1 = 4px
    borderRadius: 9999, // rounded-full
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // shadow-sm
  },
  loaderBar: {
    height: "100%",
    borderRadius: 9999, // rounded-full
  },
});
