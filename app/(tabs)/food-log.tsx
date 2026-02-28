import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { CalorieRing } from "@/components/CalorieRing";

type Tab = "today" | "yesterday";

export default function FoodLogScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors("light"); // the screenshot is very light, force light colors for consistent look
  const insets = useSafeAreaInsets();

  const {
    todayLog,
    weekLogs,
    goals,
    isAnalyzing,
    analyzingImage,
    analyzingPercent,
    scanResult,
  } = useNutrition();

  const [activeTab, setActiveTab] = useState<Tab>("today");

  const yesterdayLog = weekLogs.length > 0 ? weekLogs[5] : null;

  const currentLog = activeTab === "today" ? todayLog : yesterdayLog;

  const totalCalories =
    currentLog?.entries.reduce((sum, e) => sum + e.calories, 0) || 0;
  const totalProtein =
    currentLog?.entries.reduce((sum, e) => sum + e.protein, 0) || 0;
  const totalCarbs =
    currentLog?.entries.reduce((sum, e) => sum + e.carbs, 0) || 0;
  const totalFat = currentLog?.entries.reduce((sum, e) => sum + e.fat, 0) || 0;

  const caloriesLeft = Math.max(0, goals.dailyCalories - totalCalories);
  const proteinLeft = Math.max(0, goals.proteinGoal - totalProtein);
  const carbsLeft = Math.max(0, goals.carbsGoal - totalCarbs);
  const fatLeft = Math.max(0, goals.fatGoal - totalFat);

  const calProgress = totalCalories / goals.dailyCalories;

  useEffect(() => {
    if (!isAnalyzing && scanResult) {
      router.push("/scan-result");
    }
  }, [isAnalyzing, scanResult]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 24,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 140, // extra padding for bottom bar
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🍏 Cal AI</Text>
        </View>

        {/* Date Tabs */}
        <View style={styles.dateTabs}>
          <Pressable
            onPress={() => setActiveTab("today")}
            style={styles.dateTab}>
            <Text
              style={[
                styles.dateTabText,
                activeTab === "today" && styles.dateTabActiveText,
              ]}>
              Today
            </Text>
            {activeTab === "today" && <View style={styles.dateTabDot} />}
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("yesterday")}
            style={styles.dateTab}>
            <Text
              style={[
                styles.dateTabText,
                activeTab === "yesterday" && styles.dateTabActiveText,
              ]}>
              Yesterday
            </Text>
            {activeTab === "yesterday" && <View style={styles.dateTabDot} />}
          </Pressable>
        </View>

        {/* Calories Card */}
        <View style={styles.caloriesCard}>
          <View style={styles.caloriesTextContainer}>
            <Text style={styles.caloriesNumber}>{caloriesLeft}</Text>
            <Text style={styles.caloriesLabel}>Calories left</Text>
          </View>
          <View style={styles.caloriesRingContainer}>
            <CalorieRing
              progress={calProgress}
              size={90}
              strokeWidth={8}
              color="#000"
              trackColor="#F3F4F6">
              <Ionicons name="flame" size={24} color="#000" />
            </CalorieRing>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <View style={styles.macroCard}>
            <Text style={styles.macroVal}>{proteinLeft}g</Text>
            <Text style={styles.macroLbl}>Protein left</Text>
            <View
              style={[
                styles.macroIconBg,
                { borderColor: "#FEE2E2", backgroundColor: "#fff" },
              ]}>
              <View
                style={[
                  styles.macroIconBgInner,
                  { backgroundColor: "#FEE2E2" },
                ]}>
                <Ionicons name="nutrition" size={14} color="#EF4444" />
              </View>
            </View>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroVal}>{carbsLeft}g</Text>
            <Text style={styles.macroLbl}>Carbs left</Text>
            <View
              style={[
                styles.macroIconBg,
                { borderColor: "#FFEDD5", backgroundColor: "#fff" },
              ]}>
              <View
                style={[
                  styles.macroIconBgInner,
                  { backgroundColor: "#FFEDD5" },
                ]}>
                <Ionicons name="pizza" size={14} color="#F97316" />
              </View>
            </View>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroVal}>{fatLeft}g</Text>
            <Text style={styles.macroLbl}>Fat left</Text>
            <View
              style={[
                styles.macroIconBg,
                { borderColor: "#E0F2FE", backgroundColor: "#fff" },
              ]}>
              <View
                style={[
                  styles.macroIconBgInner,
                  { backgroundColor: "#E0F2FE" },
                ]}>
                <Ionicons name="water" size={14} color="#0EA5E9" />
              </View>
            </View>
          </View>
        </View>

        {/* Recently Eaten */}
        <Text style={styles.sectionTitle}>Recently eaten</Text>

        {isAnalyzing && activeTab === "today" && (
          <View style={styles.analyzingCard}>
            <View style={styles.analyzingContent}>
              <View style={styles.analyzingImageContainer}>
                {analyzingImage ? (
                  <Image
                    source={{ uri: analyzingImage }}
                    style={styles.analyzingImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.analyzingImagePlaceholder,
                      { backgroundColor: "#F3F4F6" },
                    ]}
                  />
                )}
                <View style={styles.analyzingOverlay}>
                  <CalorieRing
                    progress={analyzingPercent / 100}
                    size={48}
                    strokeWidth={4}
                    color="#fff"
                    trackColor="rgba(255,255,255,0.3)">
                    <Text style={[styles.analyzingPercent, { color: "#fff" }]}>
                      {analyzingPercent}%
                    </Text>
                  </CalorieRing>
                </View>
              </View>

              <View style={styles.analyzingTextContainer}>
                <Text style={styles.analyzingTitle}>Analyzing food...</Text>
                <View style={styles.skeletonBars}>
                  <View
                    style={[
                      styles.skeletonLine,
                      { backgroundColor: "#E5E7EB" },
                    ]}
                  />
                  <View style={styles.skeletonRow}>
                    <View
                      style={[
                        styles.skeletonLineShort,
                        { backgroundColor: "#E5E7EB" },
                      ]}
                    />
                    <View
                      style={[
                        styles.skeletonLineShort,
                        { backgroundColor: "#E5E7EB" },
                      ]}
                    />
                    <View
                      style={[
                        styles.skeletonLineShort,
                        { backgroundColor: "#E5E7EB" },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.analyzingSubtext}>
                  We'll notify you when done!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Render Entries */}
        {currentLog?.entries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryImagePlaceholder}>
              {entry.imageUri ? (
                <Image
                  source={{ uri: entry.imageUri }}
                  style={{ width: 60, height: 60, borderRadius: 12 }}
                />
              ) : (
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <Ionicons name="restaurant" size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View style={styles.entryInfo}>
              <Text style={styles.entryName}>{entry.name}</Text>
              <Text style={styles.entryTime}>
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.entryRight}>
              <Text style={styles.entryCal}>{entry.calories} kcal</Text>
            </View>
          </View>
        ))}

        {!currentLog?.entries.length && !isAnalyzing ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text
              style={{ color: "#9CA3AF", fontFamily: "Poppins_400Regular" }}>
              No entries yet.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { transform: [{ scale: pressed ? 0.92 : 1 }] },
        ]}
        onPress={() => {
          if (Platform.OS !== "web")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/scanner");
        }}>
        <View style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Match background from image
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  header: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#000",
  },
  dateTabs: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  dateTab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dateTabText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
  },
  dateTabActiveText: {
    color: "#000",
  },
  dateTabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#000",
    marginTop: 4,
  },
  caloriesCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  caloriesTextContainer: {
    flex: 1,
  },
  caloriesNumber: {
    fontSize: 36,
    fontFamily: "Poppins_700Bold",
    color: "#000",
  },
  caloriesLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    marginTop: -4,
  },
  caloriesRingContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  macroVal: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#000",
  },
  macroLbl: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    marginBottom: 16,
  },
  macroIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  macroIconBgInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
    marginTop: 8,
  },
  analyzingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  analyzingContent: {
    flexDirection: "row",
    gap: 16,
  },
  analyzingImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  analyzingImage: {
    width: "100%",
    height: "100%",
  },
  analyzingImagePlaceholder: {
    width: "100%",
    height: "100%",
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingPercent: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },
  analyzingTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  analyzingTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
    marginBottom: 8,
  },
  skeletonBars: {
    gap: 6,
    marginBottom: 12,
  },
  skeletonLine: {
    height: 4,
    borderRadius: 2,
    width: "80%",
  },
  skeletonRow: {
    flexDirection: "row",
    gap: 8,
  },
  skeletonLineShort: {
    height: 4,
    borderRadius: 2,
    width: "25%",
  },
  analyzingSubtext: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  entryImagePlaceholder: {
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
  },
  entryTime: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  entryRight: {
    alignItems: "flex-end",
  },
  entryCal: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#000",
  },
  entryCalLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 90,
    zIndex: 100,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
