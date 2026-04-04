import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useNutrition } from "@/lib/nutrition-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Network from "expo-network";
import { StyleSheet, Text, View, Pressable, Platform, Animated } from "react-native";
import React, { useState, useEffect, useRef } from "react";

// Types
type TabOption = "scan_food" | "barcode" | "library";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabOption>("scan_food");

  const { analyzeFood, lookupBarcode } = useNutrition();
  const cameraRef = useRef<any>(null);

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

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera to scan food
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable
          style={[
            styles.closeTopButton,
            { top: insets.top + 20, left: 20, position: "absolute" },
          ]}
          onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
    if (scanned) return;

    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected && networkState.isConnected !== null) {
      showToast("No network connection. Please check your internet.");
      return;
    }

    try {
      setScanned(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      let base64Image = "";
      let uri = "";

      if (cameraRef.current) {
        // Capture photo and get base64
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
        });
        base64Image = photo.base64 || "";
        uri = photo.uri || "";
      } else {
        // Fallback simulation
        uri =
          "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?auto=format&fit=crop&q=80&w=1000";
      }

      if (!uri) return; // If we didn't get an image, don't proceed to log

      // Navigate specifically to the dashboard to show analysis progress
      router.replace("/(tabs)");

      // Trigger actual AI analysis
      if (base64Image) {
        analyzeFood(base64Image, uri);
      } else {
        analyzeFood("", uri);
      }
    } catch (error) {
      console.error("Camera capture error:", error);
      setScanned(false);
    }
  };

  const handleTabPress = async (tab: TabOption) => {
    setActiveTab(tab);
    if (tab === "library") {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected && networkState.isConnected !== null) {
        showToast("No network connection. Please check your internet.");
        setActiveTab("scan_food");
        return;
      }

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          allowsEditing: false,
          base64: true,
          quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const base64Image = result.assets[0].base64 || "";
          const uri = result.assets[0].uri || "";

          router.replace("/(tabs)");
          // analyze existing photo
          if (base64Image) {
            analyzeFood(base64Image, uri);
          } else {
            analyzeFood("", uri);
          }
        } else {
          // Revert to scan tab if they close the image picker
          setActiveTab("scan_food");
        }
      } catch (error) {
        console.error("Image picker error:", error);
        setActiveTab("scan_food");
      }
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
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

      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        ref={cameraRef}
        enableTorch={flashOn}
        onBarcodeScanned={
          activeTab === "barcode" && !scanned
            ? async ({ data }) => {
                const networkState = await Network.getNetworkStateAsync();
                if (!networkState.isConnected && networkState.isConnected !== null) {
                  showToast("No network connection. Please check your internet.");
                  return;
                }

                if (scanned) return;
                setScanned(true);
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                }
                router.replace("/(tabs)");
                // Fetch product nutrition from Open Food Facts
                lookupBarcode(data);
              }
            : undefined
        }
      />
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.5)",
          "transparent",
          "transparent",
          "rgba(0,0,0,0.8)",
        ]}
        locations={[0, 0.2, 0.7, 1]}
        style={StyleSheet.absoluteFill}>
        {/* Top Bar Navigation */}
        <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.topControlButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.back()}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>

          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>Calzz</Text>
          </View>

          {/* Empty view to balance out the close button for true centering */}
          <View style={{ width: 40 }} />
        </View>

        {/* Central Area (Clear for camera view) */}
        <View style={styles.scanAreaContainer}>
          {activeTab === "barcode" && (
            <View style={styles.barcodeOverlay}>
              <View style={styles.overlayRow}>
                <View style={styles.overlayCorner} />
                <View
                  style={[
                    styles.overlayCorner,
                    { transform: [{ rotate: "90deg" }] },
                  ]}
                />
              </View>
              <View style={styles.overlayRow}>
                <View
                  style={[
                    styles.overlayCorner,
                    { transform: [{ rotate: "270deg" }] },
                  ]}
                />
                <View
                  style={[
                    styles.overlayCorner,
                    { transform: [{ rotate: "180deg" }] },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Bottom Area */}
        <View
          style={[styles.bottomArea, { paddingBottom: insets.bottom + 24 }]}>
          {/* Mode Selection Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[
                styles.tab,
                activeTab === "scan_food" && styles.activeTab,
              ]}
              onPress={() => handleTabPress("scan_food")}>
              <MaterialCommunityIcons
                name="line-scan"
                size={20}
                color={activeTab === "scan_food" ? "#000" : "#A1A1AA"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "scan_food" && styles.activeTabText,
                ]}>
                Scan Food
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === "barcode" && styles.activeTab]}
              onPress={() => handleTabPress("barcode")}>
              <Ionicons
                name="barcode-outline"
                size={20}
                color={activeTab === "barcode" ? "#000" : "#A1A1AA"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "barcode" && styles.activeTabText,
                ]}>
                Barcode
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, activeTab === "library" && styles.activeTab]}
              onPress={() => handleTabPress("library")}>
              <Ionicons
                name="images-outline"
                size={20}
                color={activeTab === "library" ? "#000" : "#A1A1AA"}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "library" && styles.activeTabText,
                ]}>
                Library
              </Text>
            </Pressable>
          </View>

          {/* Camera Controls */}
          <View style={styles.cameraControlsContainer}>
            {/* Flash Button */}
            <Pressable style={styles.flashButton} onPress={toggleFlash}>
              <Ionicons
                name={flashOn ? "flash" : "flash-off"}
                size={20}
                color="#fff"
              />
            </Pressable>

            {/* Capture Button */}
            <Pressable
              style={({ pressed }) => [
                styles.captureButtonOuter,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
              onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </Pressable>

            {/* Spacer to balance the flex row */}
            <View style={styles.flashButtonEmpty} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
  },
  permissionButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  closeTopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  topControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: -0.5,
  },
  scanAreaContainer: {
    flex: 1,
  },
  bottomArea: {
    paddingHorizontal: 24,
    width: "100%",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(30,30,30,0.8)",
    borderRadius: 16,
    padding: 6,
    marginBottom: 32,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 4,
  },
  activeTab: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: "#A1A1AA",
    marginTop: 2,
  },
  activeTabText: {
    color: "#000",
  },
  cameraControlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  flashButtonEmpty: {
    width: 44,
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  barcodeOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 260,
    height: 260,
    marginTop: -130,
    marginLeft: -130,
    justifyContent: "space-between",
    padding: 2,
  },
  overlayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overlayCorner: {
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#fff",
    borderRadius: 4,
  },
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
});
