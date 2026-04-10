import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { NotificationProvider } from "@/lib/notification-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { NutritionProvider, useNutrition } from "@/lib/nutrition-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { SpecialGothicExpandedOne_400Regular } from "@expo-google-fonts/special-gothic-expanded-one";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading: authLoading } = useAuth();
  const { setFirebaseUid } = useNutrition();

  useEffect(() => {
    setFirebaseUid(user ? user.uid : null);
  }, [user, setFirebaseUid]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    SpecialGothicExpandedOne_400Regular,
  });

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded && !authLoading) {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [fontsLoaded, authLoading]);

  if (!fontsLoaded || authLoading) {
    return null;
  }

  return (
    <NotificationProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="onboarding-questions"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="scanner"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="scan-result"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="feature-requests"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="personal-details"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="edit-nutrition-goals"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="streak"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="auto-generate-goals"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="log-weight"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="account-settings"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
      </Stack>
    </NotificationProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthProvider>
              <NutritionProvider>
                <RootLayoutNav />
              </NutritionProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
