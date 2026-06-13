import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";

export default function FreeScansCountdownScreen() {
  const insets = useSafeAreaInsets();
  const { freeScansUsed, MAX_FREE_SCANS } = useAuth();

  const scansLeft = Math.max(0, MAX_FREE_SCANS - freeScansUsed);

  // If somehow they got here with 0 left, just boot them to paywall immediately
  useEffect(() => {
    if (scansLeft <= 0) {
      router.replace("/paywall");
    }
  }, [scansLeft]);

  const handleUseScan = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace("/scanner");
  };

  const handleUpgrade = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace("/paywall");
  };

  if (scansLeft <= 0) return null; // Avoid flicker

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.topBar,
          { top: Platform.OS === "web" ? 20 : insets.top + 20 },
        ]}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.brandText}>Calzz</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <MaterialCommunityIcons name="line-scan" size={48} color="#000000ff" />
          </View>
        </View>

        <Text style={styles.title}>Free Scans Remaining</Text>


        <Text style={styles.subtitle}>
          You have {scansLeft} free scan{scansLeft === 1 ? "" : "s"} left to track your nutrition with AI. 
          Upgrade to Premium for unlimited scanning!
        </Text>
      </View>

      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: insets.bottom + 70 },
        ]}>
        <Pressable
          style={({ pressed }) => [
            styles.upgradeButton,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handleUpgrade}>
          <LinearGradient
            colors={["#111111", "#222222"]}
            style={styles.upgradeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Ionicons name="star" size={20} color="#FDE047" />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.useScanButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleUseScan}>
          <Text style={styles.useScanText}>Skip & Use 1 Free Scan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  brandText: {
    fontSize: 25,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  numberContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  numberText: {
    fontSize: 54,
    fontFamily: "Poppins_800ExtraBold",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    gap: 0,
  },
  upgradeButton: {
    borderRadius: 100,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  upgradeGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 10,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  useScanButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  useScanText: {
    color: "#4A4A4A",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
