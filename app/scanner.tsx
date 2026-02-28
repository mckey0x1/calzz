import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Platform } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useNutrition } from "@/lib/nutrition-context";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const { analyzeFood } = useNutrition();
  const cameraRef = React.useRef<any>(null);

  // Animation values for the scanning line
  const scanLineY = useSharedValue(0);

  useEffect(() => {
    // Start scanning line animation up and down the box
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(250, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // Infinite repeat
      false,
    );
  }, []);

  const animatedLineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scanLineY.value }],
    };
  });

  if (!permission) {
    // Camera permissions are still loading
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
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
            styles.closeButton,
            { top: insets.top + 20, left: 20, position: "absolute" },
          ]}
          onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
    if (scanned) return;
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

      // Navigate back to dashboard first
      router.back();

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

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef}>
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.6)",
            "transparent",
            "transparent",
            "rgba(0,0,0,0.8)",
          ]}
          locations={[0, 0.2, 0.8, 1]}
          style={StyleSheet.absoluteFill}>
          {/* Top Bar Navigation */}
          <View style={[styles.topBar, { paddingTop: insets.top + 20 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <View style={styles.flashButton}>
              <Ionicons name="flash-off" size={24} color="#fff" />
            </View>
          </View>

          {/* Scanner Reticle Overlay */}
          <View style={styles.scanAreaContainer}>
            <View style={styles.scanBox}>
              <Animated.View style={[styles.scanLine, animatedLineStyle]}>
                <LinearGradient
                  colors={["transparent", "#d8e9ba", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanText}>Center food in frame to scan</Text>
          </View>

          {/* Bottom Controls */}
          <View
            style={[styles.bottomBar, { paddingBottom: insets.bottom + 40 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.captureButtonOuter,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
              onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </Pressable>
          </View>
        </LinearGradient>
      </CameraView>
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
    backgroundColor: "#d8e9ba",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
  },
  permissionButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  scanAreaContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBox: {
    width: 250,
    height: 250,
    position: "relative",
    marginBottom: 30,
  },
  scanLine: {
    width: "100%",
    height: 3,
    backgroundColor: "transparent",
    shadowColor: "#d8e9ba",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#d8e9ba",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomBar: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
});
