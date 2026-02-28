import React, { useEffect, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useThemeColors } from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { useNutrition } from "@/lib/nutrition-context";
import { CalorieRing } from "@/components/CalorieRing";
import { GlassCard } from "@/components/GlassCard";
import { MacroBar } from "@/components/MacroBar";

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    goals,
    todayLog,
    addWater,
    removeWater,
    isAnalyzing,
    analyzingImage,
    setAnalyzing,
    analyzingPercent,
    scanResult,
  } = useNutrition();
  const { user } = useAuth();
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Alex";

  const remaining = Math.max(0, goals.dailyCalories - totalCalories);
  const progress = totalCalories / goals.dailyCalories;

  const proteinPercent =
    goals.proteinGoal > 0 ? totalProtein / goals.proteinGoal : 0;
  const aiInsight =
    proteinPercent < 0.5
      ? "You're under your protein goal today. Try adding some chicken or Greek yogurt."
      : progress > 0.9
        ? "Almost at your calorie target! Consider a light evening snack."
        : progress < 0.3
          ? "Great start to the day! Keep logging your meals to stay on track."
          : "Looking good! You're maintaining a balanced intake today.";

  useEffect(() => {
    if (!isAnalyzing && scanResult) {
      router.push("/scan-result");
    }
  }, [isAnalyzing, scanResult]);

  function handleAddWater() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addWater();
  }

  function handleRemoveWater() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeWater();
  }

  const waterPercent = Math.min(todayLog.waterGlasses / goals.waterGoal, 1);
  const stepsPercent = Math.min(todayLog.steps / goals.stepsGoal, 1);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 40,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                overflow: "hidden",
                backgroundColor: colors.glassBg,
              }}>
              {user?.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={24}
                  color={colors.tint}
                  style={{ alignSelf: "center", marginTop: 10 }}
                />
              )}
            </View>
            <View>
              <Text
                style={[
                  styles.greeting,
                  {
                    color: colors.text,
                    fontSize: 18,
                    fontFamily: "Poppins_700Bold",
                  },
                ]}>
                Hello {firstName} 👋
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13,
                  fontFamily: "Poppins_400Regular",
                  marginTop: 2,
                }}>
                Get ready
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.bellButton,
              {
                backgroundColor: colors.surfaceElevated,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <Ionicons name="notifications" size={22} color={colors.text} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <GlassCard style={styles.calorieCard}>
          <View style={styles.calorieContent}>
            <CalorieRing
              progress={progress}
              size={160}
              strokeWidth={12}
              color={colors.tint}
              trackColor={colors.progressRingBg}>
              <Text style={[styles.calorieNumber, { color: colors.text }]}>
                {remaining}
              </Text>
              <Text
                style={[styles.calorieLabel, { color: colors.textSecondary }]}>
                remaining
              </Text>
            </CalorieRing>

            <View style={styles.calorieSummary}>
              <View style={styles.summaryItem}>
                <View
                  style={[styles.summaryDot, { backgroundColor: colors.tint }]}
                />
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: colors.textSecondary },
                  ]}>
                  Eaten
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {totalCalories}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View
                  style={[
                    styles.summaryDot,
                    { backgroundColor: colors.accentEmerald },
                  ]}
                />
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: colors.textSecondary },
                  ]}>
                  Goal
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {goals.dailyCalories}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <View
                  style={[
                    styles.summaryDot,
                    { backgroundColor: colors.accentOrange },
                  ]}
                />
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: colors.textSecondary },
                  ]}>
                  Burned
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  320
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Macros
        </Text>
        <GlassCard>
          <View style={styles.macroContainer}>
            <MacroBar
              label="Protein"
              current={totalProtein}
              goal={goals.proteinGoal}
              color={colors.proteinColor}
            />
            <MacroBar
              label="Carbs"
              current={totalCarbs}
              goal={goals.carbsGoal}
              color={colors.carbsColor}
            />
            <MacroBar
              label="Fat"
              current={totalFat}
              goal={goals.fatGoal}
              color={colors.fatColor}
            />
          </View>
        </GlassCard>

        {isAnalyzing && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, marginTop: 8 },
              ]}>
              Recently eaten
            </Text>
            <GlassCard style={styles.analyzingCard}>
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
                        { backgroundColor: colors.border },
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
                      <Text
                        style={[styles.analyzingPercent, { color: "#fff" }]}>
                        {analyzingPercent}%
                      </Text>
                    </CalorieRing>
                  </View>
                </View>

                <View style={styles.analyzingTextContainer}>
                  <Text style={[styles.analyzingTitle, { color: colors.text }]}>
                    Analyzing food...
                  </Text>

                  {/* Skeletons */}
                  <View style={styles.skeletonBars}>
                    <View
                      style={[
                        styles.skeletonLine,
                        { backgroundColor: colors.border },
                      ]}
                    />
                    <View style={styles.skeletonRow}>
                      <View
                        style={[
                          styles.skeletonLineShort,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonLineShort,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonLineShort,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.analyzingSubtext,
                      { color: colors.textTertiary },
                    ]}>
                    We'll notify you when done!
                  </Text>
                </View>
              </View>
            </GlassCard>
          </>
        )}

        <GlassCard style={styles.aiCard}>
          <LinearGradient
            colors={["rgba(108,92,231,0.08)", "rgba(0,184,148,0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.aiHeader}>
            <View
              style={[
                styles.aiIconBg,
                { backgroundColor: colors.tint + "20" },
              ]}>
              <Ionicons name="sparkles" size={16} color={colors.tint} />
            </View>
            <Text style={[styles.aiTitle, { color: colors.tint }]}>
              AI Insight
            </Text>
          </View>
          <Text style={[styles.aiText, { color: colors.text }]}>
            {aiInsight}
          </Text>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Activity
        </Text>
        <View style={styles.activityRow}>
          <GlassCard style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="water" size={20} color={colors.waterColor} />
              <Text
                style={[styles.activityTitle, { color: colors.textSecondary }]}>
                Water
              </Text>
            </View>
            <Text style={[styles.activityValue, { color: colors.text }]}>
              {todayLog.waterGlasses}
              <Text
                style={[styles.activityUnit, { color: colors.textTertiary }]}>
                /{goals.waterGoal}
              </Text>
            </Text>
            <View
              style={[
                styles.waterTrack,
                { backgroundColor: colors.progressRingBg },
              ]}>
              <View
                style={[
                  styles.waterFill,
                  {
                    backgroundColor: colors.waterColor,
                    width: `${waterPercent * 100}%` as any,
                  },
                ]}
              />
            </View>
            <View style={styles.waterButtons}>
              <Pressable
                onPress={handleRemoveWater}
                style={({ pressed }) => [
                  styles.waterBtn,
                  { opacity: pressed ? 0.6 : 1 },
                ]}>
                <Feather name="minus" size={16} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={handleAddWater}
                style={({ pressed }) => [
                  styles.waterBtn,
                  styles.waterBtnAdd,
                  {
                    backgroundColor: colors.waterColor + "20",
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}>
                <Feather name="plus" size={16} color={colors.waterColor} />
              </Pressable>
            </View>
          </GlassCard>

          <GlassCard style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <MaterialCommunityIcons
                name="shoe-print"
                size={20}
                color={colors.accentEmerald}
              />
              <Text
                style={[styles.activityTitle, { color: colors.textSecondary }]}>
                Steps
              </Text>
            </View>
            <Text style={[styles.activityValue, { color: colors.text }]}>
              {todayLog.steps.toLocaleString()}
            </Text>
            <View
              style={[
                styles.waterTrack,
                { backgroundColor: colors.progressRingBg },
              ]}>
              <View
                style={[
                  styles.waterFill,
                  {
                    backgroundColor: colors.accentEmerald,
                    width: `${stepsPercent * 100}%` as any,
                  },
                ]}
              />
            </View>
            <Text style={[styles.stepsGoal, { color: colors.textTertiary }]}>
              Goal: {goals.stepsGoal.toLocaleString()}
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  greeting: { fontSize: 14, fontFamily: "Poppins_400Regular" },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  calorieCard: { marginTop: 4 },
  calorieContent: { alignItems: "center", gap: 20 },
  calorieNumber: { fontSize: 36, fontFamily: "Poppins_700Bold" },
  calorieLabel: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginTop: -2,
  },
  calorieSummary: { flexDirection: "row", gap: 24 },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryDot: { width: 6, height: 6, borderRadius: 3 },
  summaryLabel: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  summaryValue: { fontSize: 16, fontFamily: "Poppins_600SemiBold" },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", marginTop: 8 },
  macroContainer: { gap: 14 },
  aiCard: { overflow: "hidden" },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  aiIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitle: { fontSize: 13, fontFamily: "Poppins_600SemiBold" },
  aiText: { fontSize: 14, fontFamily: "Poppins_400Regular", lineHeight: 20 },
  activityRow: { flexDirection: "row", gap: 12 },
  activityCard: { flex: 1 },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  activityTitle: { fontSize: 13, fontFamily: "Poppins_500Medium" },
  activityValue: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
  },
  activityUnit: { fontSize: 14, fontFamily: "Poppins_400Regular" },
  waterTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 10,
  },
  waterFill: { height: "100%", borderRadius: 3 },
  waterButtons: { flexDirection: "row", gap: 8 },
  waterBtn: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  waterBtnAdd: {},
  stepsGoal: { fontSize: 12, fontFamily: "Poppins_400Regular", marginTop: 2 },
  analyzingCard: {
    padding: 16,
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
  },
});
