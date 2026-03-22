import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Image,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { CalorieRing } from "@/components/CalorieRing";
import { LinearGradient } from "expo-linear-gradient";

type Tab = "today" | "yesterday";

// ── Animated progress bar for micronutrients ──
function MicroProgressBar({
  current,
  goal,
  color,
  label,
  unit,
  icon,
}: {
  current: number;
  goal: number;
  color: string;
  label: string;
  unit: string;
  icon: React.ReactNode;
}) {
  const progress = Math.min(current / goal, 1);
  return (
    <View style={microStyles.row}>
      <View style={[microStyles.iconCircle, { backgroundColor: color + "18" }]}>
        {icon}
      </View>
      <View style={microStyles.barContent}>
        <View style={microStyles.labelRow}>
          <Text style={microStyles.label}>{label}</Text>
          <Text style={microStyles.value}>
            {current}
            <Text style={microStyles.goalText}>
              /{goal}
              {unit}
            </Text>
          </Text>
        </View>
        <View style={microStyles.trackBar}>
          <View
            style={[
              microStyles.fillBar,
              { width: `${progress * 100}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function FoodLogScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(colorScheme);

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
    (currentLog?.entries || []).reduce((sum, e) => sum + e.calories, 0) || 0;
  const totalProtein =
    (currentLog?.entries || []).reduce((sum, e) => sum + e.protein, 0) || 0;
  const totalCarbs =
    (currentLog?.entries || []).reduce((sum, e) => sum + e.carbs, 0) || 0;
  const totalFat = (currentLog?.entries || []).reduce((sum, e) => sum + e.fat, 0) || 0;
  const totalFiber =
    (currentLog?.entries || []).reduce((sum, e) => sum + (e.fiber || 0), 0) || 0;
  const totalSugar =
    (currentLog?.entries || []).reduce((sum, e) => sum + (e.sugar || 0), 0) || 0;
  const totalSodium =
    (currentLog?.entries || []).reduce((sum, e) => sum + (e.sodium || 0), 0) || 0;

  const caloriesLeft = Math.max(0, goals.dailyCalories - totalCalories);
  const proteinLeft = Math.max(0, goals.proteinGoal - totalProtein);
  const carbsLeft = Math.max(0, goals.carbsGoal - totalCarbs);
  const fatLeft = Math.max(0, goals.fatGoal - totalFat);

  const calProgress = totalCalories / goals.dailyCalories;
  const proteinProgress = totalProtein / goals.proteinGoal;
  const carbsProgress = totalCarbs / goals.carbsGoal;
  const fatProgress = totalFat / goals.fatGoal;

  useEffect(() => {
    if (!isAnalyzing && scanResult) {
      router.push("/scan-result");
    }
  }, [isAnalyzing, scanResult]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      {/* Background Gradient – same as before */}
      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 24,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 170,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* ───── Header ───── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Food log</Text>
        </View>

        {/* ───── Date Tabs ───── */}
        <View style={styles.dateTabs}>
          {(["today", "yesterday"] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                if (Platform.OS !== "web") Haptics.selectionAsync();
              }}
              style={[
                styles.dateTab,
                activeTab === tab && styles.dateTabActive,
              ]}>
              <Text
                style={[
                  styles.dateTabText,
                  activeTab === tab && styles.dateTabActiveText,
                ]}>
                {tab === "today" ? "Today" : "Yesterday"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ───── Calories Hero Card ───── */}
        <View style={[styles.heroCard, { backgroundColor: "#fff" }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroNumber}>{caloriesLeft}</Text>
            <Text style={styles.heroLabel}>Calories left</Text>
            <View style={styles.caloriesEaten}>
              <Ionicons name="flame" size={14} color="#6B7280" />
              <Text style={styles.caloriesEatenText}>
                {totalCalories} eaten
              </Text>
            </View>
          </View>
          <View style={styles.heroRing}>
            <CalorieRing
              progress={calProgress}
              size={100}
              strokeWidth={10}
              color="#1A1A1A"
              trackColor="#E5E7EB">
              <Text style={styles.heroRingPercent}>
                {Math.round(calProgress * 100)}%
              </Text>
            </CalorieRing>
          </View>
        </View>

        {/* ───── Macros Row ───── */}
        <View style={styles.macrosRow}>
          {/* Protein */}
          <View style={[styles.macroCard, { backgroundColor: "#fff" }]}>
            <View style={styles.macroTop}>
              <CalorieRing
                progress={proteinProgress}
                size={44}
                strokeWidth={5}
                color="#e65c5c"
                trackColor="#FEE2E2">
                <MaterialCommunityIcons
                  name="food-drumstick"
                  size={14}
                  color="#e65c5c"
                />
              </CalorieRing>
            </View>
            <Text style={styles.macroVal}>{proteinLeft}g</Text>
            <Text style={styles.macroLbl}>Protein left</Text>
          </View>

          {/* Carbs */}
          <View style={[styles.macroCard, { backgroundColor: "#fff" }]}>
            <View style={styles.macroTop}>
              <CalorieRing
                progress={carbsProgress}
                size={44}
                strokeWidth={5}
                color="#e89e5d"
                trackColor="#FFEDD5">
                <MaterialCommunityIcons
                  name="barley"
                  size={14}
                  color="#e89e5d"
                />
              </CalorieRing>
            </View>
            <Text style={styles.macroVal}>{carbsLeft}g</Text>
            <Text style={styles.macroLbl}>Carbs left</Text>
          </View>

          {/* Fat */}
          <View style={[styles.macroCard, { backgroundColor: "#fff" }]}>
            <View style={styles.macroTop}>
              <CalorieRing
                progress={fatProgress}
                size={44}
                strokeWidth={5}
                color="#5a8bed"
                trackColor="#DBEAFE">
                <MaterialCommunityIcons
                  name="peanut"
                  size={14}
                  color="#5a8bed"
                />
              </CalorieRing>
            </View>
            <Text style={styles.macroVal}>{fatLeft}g</Text>
            <Text style={styles.macroLbl}>Fat left</Text>
          </View>
        </View>

        {/* ───── Micronutrients Card ───── */}
        <View style={[styles.microCard, { backgroundColor: "#fff" }]}>
          <Text style={styles.sectionTitle}>Micronutrients</Text>
          <MicroProgressBar
            current={totalFiber}
            goal={goals.fiberGoal || 38}
            color="#9b5de5"
            label="Fiber"
            unit="g"
            icon={
              <MaterialCommunityIcons
                name="food-apple"
                size={16}
                color="#9b5de5"
              />
            }
          />
          <MicroProgressBar
            current={totalSugar}
            goal={goals.sugarGoal || 64}
            color="#f15bb5"
            label="Sugar"
            unit="g"
            icon={
              <MaterialCommunityIcons
                name="spoon-sugar"
                size={16}
                color="#f15bb5"
              />
            }
          />
          <MicroProgressBar
            current={totalSodium}
            goal={goals.sodiumGoal || 2300}
            color="#F59E0B"
            label="Sodium"
            unit="mg"
            icon={
              <MaterialCommunityIcons name="shaker" size={16} color="#F59E0B" />
            }
          />
        </View>

        {/* ───── Recently Eaten ───── */}
        <Text style={styles.recentTitle}>Recently eaten</Text>

        {/* Analyzing Card */}
        {isAnalyzing && activeTab === "today" && (
          <View style={[styles.analyzingCard, { backgroundColor: "#fff" }]}>
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
          <Pressable
            key={entry.id}
            style={[styles.entryCard, { backgroundColor: "#fff" }]}
            onPress={() =>
              router.push({
                pathname: "/scan-result",
                params: { entryId: entry.id },
              })
            }>
            <View style={styles.entryImageWrap}>
              {entry.imageUri ? (
                <Image
                  source={{ uri: entry.imageUri }}
                  style={styles.entryImage}
                />
              ) : (
                <View style={styles.entryImageFallback}>
                  <Ionicons name="restaurant" size={22} color="#9CA3AF" />
                </View>
              )}
            </View>

            <View style={styles.entryInfo}>
              <Text style={styles.entryName} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={styles.entryTime}>
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={styles.entryRight}>
              <Text style={styles.entryCal}>{entry.calories}</Text>
              <Text style={styles.entryCalLabel}>kcal</Text>
            </View>

            {/* Mini macros pills */}
            <View style={styles.entryPills}>
              <View style={[styles.pill, { backgroundColor: "#FEE2E2" }]}>
                <Text style={[styles.pillText, { color: "#e65c5c" }]}>
                  P {entry.protein}g
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: "#FFEDD5" }]}>
                <Text style={[styles.pillText, { color: "#e89e5d" }]}>
                  C {entry.carbs}g
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: "#DBEAFE" }]}>
                <Text style={[styles.pillText, { color: "#5a8bed" }]}>
                  F {entry.fat}g
                </Text>
              </View>
            </View>
          </Pressable>
        ))}

        {!(currentLog?.entries?.length) && !isAnalyzing ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="restaurant-outline" size={40} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtitle}>
              Scan or log your first meal to get started
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* ───── Micronutrient progress bar styles ───── */
const microStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  barContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: "#374151",
  },
  value: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  goalText: {
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
  },
  trackBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  fillBar: {
    height: "100%",
    borderRadius: 3,
  },
});

/* ───── Main styles ───── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  /* Header */
  header: {
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },

  /* Date tabs – pill style */
  dateTabs: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  dateTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dateTabActive: {
    backgroundColor: "#1A1A1A",
  },
  dateTabText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
  },
  dateTabActiveText: {
    color: "#fff",
  },

  /* Hero calorie card */
  heroCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  heroLeft: {
    flex: 1,
  },
  heroNumber: {
    fontSize: 42,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    lineHeight: 48,
  },
  heroLabel: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    marginTop: -2,
  },
  caloriesEaten: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  caloriesEatenText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
  },
  heroRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroRingPercent: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
  },

  /* Macros Row */
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  macroCard: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  macroTop: {
    marginBottom: 10,
  },
  macroVal: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    marginTop: 2,
  },
  macroLbl: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    marginTop: -1,
  },

  /* Micronutrients Card */
  microCard: {
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },

  /* Recently Eaten */
  recentTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginTop: 4,
  },

  /* Analyzing */
  analyzingCard: {
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  analyzingContent: {
    flexDirection: "row",
    gap: 16,
  },
  analyzingImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 18,
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
    color: "#1A1A1A",
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

  /* Entry Cards */
  entryCard: {
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  entryImageWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  entryImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  entryImageFallback: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  entryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    flex: 1,
  },
  entryTime: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
    marginLeft: 8,
  },
  entryRight: {
    position: "absolute",
    right: 16,
    top: 16,
    alignItems: "flex-end",
  },
  entryCal: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
  },
  entryCalLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
    marginTop: -2,
  },

  /* Mini pills */
  entryPills: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },

  /* Empty state */
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
});
