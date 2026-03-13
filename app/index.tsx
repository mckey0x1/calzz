import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Modal,
  Image,
  Animated,
} from "react-native";
import * as Network from "expo-network";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/GlassCard";

const SLIDES = [  {
    id: "1",
    title: "AI Nutrition Tracking",
    description:
      "Simply snap a photo of your food. Our advanced AI instantly analyzes calories and macros for you.",
    image: require("../assets/images/IMG_0290.png"),
  },
  {
    id: "2",
    title: "Personalized Goals",
    description:
      "Set your targets for weight, diet preferences, and hydration to get curated daily check-ins.",
    image: require("../assets/images/IMG_0291.png"),
  },
  {
    id: "3",
    title: "Smart Insights",
    description:
      "Receive real-time health scores and intelligent recommendations based on your progress.",
    image: require("../assets/images/IMG_0292.png"),
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors("light"); // we know this project is locked to light
  const { signInWithGoogle, isSigningIn, user, isLoading } = useAuth();

  const [activeIndex, setActiveIndex] = useState(0);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(""));
  };

  useEffect(() => {
    // Automatically skip onboarding if user is logged in
    if (!isLoading && user) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleNext = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // if (activeIndex === SLIDES.length - 1) {
    //   const networkState = await Network.getNetworkStateAsync();
    //   if (!networkState.isConnected && networkState.isConnected !== null) {
    //     showToast("No network connection. Please check your internet.");
    //     return;
    //   }
    // }

    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * width,
        animated: true,
      });
    } else {
      router.push("/onboarding-questions");
    }
  };

  const handleSignIn = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected && networkState.isConnected !== null) {
      showToast("No network connection. Please check your internet.");
      return;
    }

    setShowBottomSheet(true);
  };

  return (
    <View style={styles.container}>
      {toastMessage ? (
        <Animated.View
          style={[styles.toastContainer, { opacity: fadeAnim }]}
          pointerEvents="none">
          <Ionicons name="wifi-outline" size={20} color="#fff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}>
        {SLIDES.map((slide, index) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconHalo,
                  { backgroundColor: colors.tint + "20" },
                ]}
              />
              <View
                style={[
                  styles.iconHaloInner,
                  { backgroundColor: colors.tint + "40" },
                ]}
              />
              <Image
                source={slide.image}
                style={styles.slideImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text }]}>
                {slide.title}
              </Text>
              <Text
                style={[styles.description, { color: colors.textSecondary }]}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    activeIndex === index
                      ? colors.tint
                      : colors.textTertiary + "50",
                },
                activeIndex === index && { width: 24 },
              ]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          onPress={handleNext}>
          <LinearGradient
            colors={[colors.tint, colors.accentEmerald]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryGradient}>
            <Text style={styles.primaryButtonText}>
              {activeIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
            </Text>
            {activeIndex !== SLIDES.length - 1 && (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleSignIn}
          disabled={isSigningIn}>
          {isSigningIn ? (
            <ActivityIndicator color={colors.tint} size="small" />
          ) : (
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colors.textSecondary },
              ]}>
              Already have an account?{" "}
              <Text
                style={{
                  color: colors.tint,
                  fontFamily: "Poppins_700Bold",
                  textDecorationLine: "underline",
                }}>
                Sign in
              </Text>
            </Text>
          )}
        </Pressable>
      </View>

      <Modal
        visible={showBottomSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBottomSheet(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowBottomSheet(false)}
          />
          <View
            style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Welcome Back
              </Text>
              <Pressable
                onPress={() => setShowBottomSheet(false)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
                pressed && { opacity: 0.8 },
              ]}
              onPress={async () => {
                if (Platform.OS !== "web")
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await signInWithGoogle();
              }}
              disabled={isSigningIn}>
              {isSigningIn ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.text} />
                  <Text
                    style={[styles.googleButtonText, { color: colors.text }]}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            <Text style={[styles.termsText, { color: colors.textTertiary }]}>
              By signing in, you agree to our{"\n"}
              <Text
                style={[styles.linkText, { color: colors.tint }]}
                onPress={() => {
                  setShowBottomSheet(false);
                  router.push("/terms");
                }}>
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={[styles.linkText, { color: colors.tint }]}
                onPress={() => {
                  setShowBottomSheet(false);
                  router.push("/privacy-policy");
                }}>
                Privacy Policy
              </Text>
            </Text>
            <View style={{ height: insets.bottom + 20 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toastContainer: {
    position: "absolute",
    bottom: 300,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 999,
  },
  toastText: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 220, // space for bottom container
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
  },
  iconHalo: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  iconHaloInner: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  iconCard: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
  },
  slideImage: {
    width: 280,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
  },
  textContainer: {
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  primaryButton: {
    width: "100%",
    marginBottom: 16,
  },
  primaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 100,
    gap: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: 24,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  termsText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  linkText: {
    fontFamily: "Poppins_600SemiBold",
  },
});
