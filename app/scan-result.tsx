import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { LinearGradient } from "expo-linear-gradient";



export default function ScanResultScreen() {
  const colors = useThemeColors("light");
  const insets = useSafeAreaInsets();
  const { addFoodEntry, scanResult, todayLog, weekLogs, clearScanResult } =
    useNutrition();
  const { entryId } = useLocalSearchParams();

  // 1. Look up existing entry if viewing history
  const existingEntry = entryId
    ? [...(todayLog.entries || []), ...weekLogs.flatMap((l) => l.entries || [])].find(
        (e) => e.id === entryId,
      )
    : null;

  // 2. Determine initial data source (either old log or fresh scan)
  const [localData, setLocalData] = useState<any>(() => {
    if (existingEntry) {
      return {
        name: existingEntry.name,
        calories: existingEntry.calories,
        carbs: existingEntry.carbs,
        protein: existingEntry.protein,
        fat: existingEntry.fat,
        score: existingEntry.confidence || 8,
        time: new Date(existingEntry.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        image: existingEntry.imageUri || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
      };
    }
    return scanResult;
  });

  const currentScan = localData;
  const [quantity, setQuantity] = useState(1);
  const isReadOnly = !!existingEntry;

  useEffect(() => {
    // If we're on a new scan and landed without data, grab what we can
    if (!entryId && !localData && scanResult) {
      setLocalData(scanResult);
    }

    return () => {
      // Clear global scan result when leaving screen
      clearScanResult();
    };
  }, []);

  // Crash prevention: If for some reason we navigate here without any data, go back safely
  if (!currentScan) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontFamily: "Poppins_500Medium", color: "#6B7280" }}>No food data found.</Text>
        <Pressable 
          style={{ marginTop: 20, padding: 12, backgroundColor: "#1A1A1A", borderRadius: 12 }} 
          onPress={() => router.back()}
        >
          <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  function handleSave() {
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // If we're just viewing an existing entry, 'Done' just goes back
    if (isReadOnly) {
      clearScanResult();
      router.back();
      return;
    }

    addFoodEntry({
      name: currentScan.name,
      calories: currentScan.calories * quantity,
      protein: currentScan.protein * quantity,
      carbs: currentScan.carbs * quantity,
      fat: currentScan.fat * quantity,
      meal: "lunch",
      confidence: 95,
      imageUri: currentScan.image,
    });
    clearScanResult();
    router.back()
  }

  function handleClose() {
    clearScanResult();
    router.replace("/food-log");
  }

  function modifyQuantity(amount: number) {
    if (isReadOnly) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setQuantity((prev) => Math.max(1, prev + amount));
  }

  const MacroCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
  }) => (
    <View style={styles.macroCard}>
      <View style={[styles.macroIconBg, { backgroundColor: color + "15" }]}>
        {icon}
      </View>
      <View style={styles.macroTextCol}>
        <Text style={styles.macroValue}>{value}</Text>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ──── Header Background Image ──── */}
      <ImageBackground
        source={{ uri: currentScan.image }}
        style={styles.imageBackground}
        resizeMode="cover">
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "transparent", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.headerBtn} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <View style={styles.headerSpacer} />
        </View>
      </ImageBackground>

      {/* ──── Sliding Bottom Sheet Area ──── */}
      <View style={styles.bottomSheetWrapper}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}>
            {/* Header / Title Row */}
            <View style={styles.titleSection}>
              <View style={styles.titleInfo}>
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text style={styles.timeText}>{currentScan.time}</Text>
                </View>
                <Text style={styles.foodTitle}>{currentScan.name}</Text>
              </View>

              {!isReadOnly && (
                <View style={styles.quantityPicker}>
                  <Pressable
                    onPress={() => modifyQuantity(-1)}
                    style={styles.qtyBtn}>
                    <Ionicons name="remove" size={18} color="#1A1A1A" />
                  </Pressable>
                  <Text style={styles.qtyText}>{quantity}</Text>
                  <Pressable
                    onPress={() => modifyQuantity(1)}
                    style={styles.qtyBtn}>
                    <Ionicons name="add" size={18} color="#1A1A1A" />
                  </Pressable>
                </View>
              )}
            </View>

            {/* Main Stats (Calories & Score) */}
            <View style={styles.mainStatsRow}>
              <View style={[styles.statBox, { backgroundColor: "#F8FAFC" }]}>
                <View
                  style={[styles.statIconWrap, { backgroundColor: "#1A1A1A" }]}>
                  <Ionicons name="flame" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.statBoxValue}>
                    {currentScan.calories * quantity}
                  </Text>
                  <Text style={styles.statBoxLabel}>Total Calories</Text>
                </View>
              </View>

              <View style={[styles.statBox, { backgroundColor: "#F0FDF4" }]}>
                <View
                  style={[styles.statIconWrap, { backgroundColor: "#22C55E" }]}>
                  <Ionicons name="leaf" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.statBoxValue}>
                    {currentScan.score}/10
                  </Text>
                  <Text style={styles.statBoxLabel}>Health Score</Text>
                </View>
              </View>
            </View>

            {/* Macros Section */}
            <Text style={styles.sectionHeader}>Macronutrients</Text>
            <View style={styles.macrosGrid}>
              <MacroCard
                icon={
                  <FontAwesome5
                    name="drumstick-bite"
                    size={14}
                    color="#e65c5c"
                  />
                }
                label="Protein"
                value={`${currentScan.protein * quantity}g`}
                color="#e65c5c"
              />
              <MacroCard
                icon={
                  <MaterialCommunityIcons
                    name="barley"
                    size={18}
                    color="#e89e5d"
                  />
                }
                label="Carbs"
                value={`${currentScan.carbs * quantity}g`}
                color="#e89e5d"
              />
              <MacroCard
                icon={
                  <MaterialCommunityIcons
                    name="peanut"
                    size={18}
                    color="#5a8bed"
                  />
                }
                label="Fat"
                value={`${currentScan.fat * quantity}g`}
                color="#5a8bed"
              />
            </View>
          </ScrollView>
        </View>

        {/* ──── Footer Actions ──── */}
        <View style={[styles.footer, { paddingBottom: insets.bottom || 24 }]}>
          {/* {!isReadOnly && (
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Edit</Text>
            </Pressable>
          )} */}
          <Pressable style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>
              {isReadOnly ? "Done" : "Add to Log"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageBackground: {
    width: "100%",
    aspectRatio: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  headerSpacer: {
    width: 44,
  },
  bottomSheetWrapper: {
    position: "absolute",
    top: "40%", // Start slightly above the bottom of the image to overlap
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 16,
  },
  titleInfo: {
    flex: 1,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
  },
  foodTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    lineHeight: 32,
  },
  quantityPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  qtyText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    width: 32,
    textAlign: "center",
  },
  mainStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statBoxValue: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    lineHeight: 24,
  },
  statBoxLabel: {
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  macrosGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  macroIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  macroTextCol: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(243,244,246,0.8)",
    gap: 12,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 100,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: "#1A1A1A",
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
});
