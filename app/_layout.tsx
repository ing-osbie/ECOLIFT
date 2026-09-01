import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";

import { AppContextProvider } from "@/context/AppContext";
import { AuthProvider } from "@/src/context/AuthContext";

// Keep native splash visible while loading resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <AppContextProvider>
        <StatusBar style="dark" />

        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: {
              backgroundColor: "#FFFFFF",
            },
          }}
        >
          {/* Splash */}
          <Stack.Screen name="index" />

          {/* Authentication */}
          <Stack.Screen name="login" />

          {/* Onboarding */}
          <Stack.Screen name="onboarding" />

          {/* User verification */}
          <Stack.Screen name="upload-id" />

          {/* Driver check-in — declared before tab groups to prevent route collision */}
          <Stack.Screen name="driver-checkin" />

          {/* Main user app */}
          <Stack.Screen name="(tabs)" />

          {/* Collector app */}
          <Stack.Screen name="(tabs-collector)" />

          {/* Other screens */}
          <Stack.Screen
            name="notifications"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />

          <Stack.Screen name="support" />

          <Stack.Screen name="call" />

          <Stack.Screen name="chat" />

          <Stack.Screen name="receipt" />

          <Stack.Screen name="top-up" />

          <Stack.Screen name="payment-methods" />

          <Stack.Screen name="save-address" />

          <Stack.Screen name="change-date" />

          <Stack.Screen name="vehicle-type" />

          <Stack.Screen name="recycling-centres" />

          <Stack.Screen name="rewards" />
        </Stack>
      </AppContextProvider>
    </AuthProvider>
  );
}
