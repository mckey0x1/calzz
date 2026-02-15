import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/constants/colors";
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
  } = useNutrition();

  const remaining = Math.max(0, goals.dailyCalories - totalCalories);
  const progress = totalCalories / goals.dailyCalories;

  const proteinPercent = goals.proteinGoal > 0 ? totalProtein / goals.proteinGoal : 0;
  const aiInsight =
    proteinPercent < 0.5
      ? "You're under your protein goal today. Try adding some chicken or Greek yogurt."
      : progress > 0.9
      ? "Almost at your calorie target! Consider a light evening snack."
      : progress < 0.3
      ? "Great start to the day! Keep logging your meals to stay on track."
      : "Looking good! You're maintaining a balanced intake today.";

  function handleAddWater() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addWater();
  }

  function handleRemoveWater() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeWater();
  }

  const waterPercent = Math.min(todayLog.waterGlasses / goals.waterGoal, 1);
  const stepsPercent = Math.min(todayLog.steps / goals.stepsGoal, 1);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good {getTimeOfDay()}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
          </View>
          <View style={[styles.todayBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorder }]}>
            <Text style={[styles.todayText, { color: colors.tint }]}>Today</Text>
          </View>
        </View>

        <GlassCard style={styles.calorieCard}>
          <View style={styles.calorieContent}>
            <CalorieRing
              progress={progress}
              size={160}
              strokeWidth={12}
              color={colors.tint}
              trackColor={colors.progressRingBg}
            >
              <Text style={[styles.calorieNumber, { color: colors.text }]}>{remaining}</Text>
              <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>remaining</Text>
            </CalorieRing>

            <View style={styles.calorieSummary}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryDot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Eaten</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{totalCalories}</Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryDot, { backgroundColor: colors.accentEmerald }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Goal</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{goals.dailyCalories}</Text>
              </View>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryDot, { backgroundColor: colors.accentOrange }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Burned</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>320</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Macros</Text>
        <GlassCard>
          <View style={styles.macroContainer}>
            <MacroBar label="Protein" current={totalProtein} goal={goals.proteinGoal} color={colors.proteinColor} />
            <MacroBar label="Carbs" current={totalCarbs} goal={goals.carbsGoal} color={colors.carbsColor} />
            <MacroBar label="Fat" current={totalFat} goal={goals.fatGoal} color={colors.fatColor} />
          </View>
        </GlassCard>

        <GlassCard style={styles.aiCard}>
          <LinearGradient
            colors={[
              colorScheme === "dark" ? "rgba(139,124,247,0.15)" : "rgba(108,92,231,0.08)",
              colorScheme === "dark" ? "rgba(0,217,165,0.1)" : "rgba(0,184,148,0.05)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.aiHeader}>
            <View style={[styles.aiIconBg, { backgroundColor: colors.tint + "20" }]}>
              <Ionicons name="sparkles" size={16} color={colors.tint} />
            </View>
            <Text style={[styles.aiTitle, { color: colors.tint }]}>AI Insight</Text>
          </View>
          <Text style={[styles.aiText, { color: colors.text }]}>{aiInsight}</Text>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Activity</Text>
        <View style={styles.activityRow}>
          <GlassCard style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Ionicons name="water" size={20} color={colors.waterColor} />
              <Text style={[styles.activityTitle, { color: colors.textSecondary }]}>Water</Text>
            </View>
            <Text style={[styles.activityValue, { color: colors.text }]}>
              {todayLog.waterGlasses}<Text style={[styles.activityUnit, { color: colors.textTertiary }]}>/{goals.waterGoal}</Text>
            </Text>
            <View style={[styles.waterTrack, { backgroundColor: colors.progressRingBg }]}>
              <View
                style={[
                  styles.waterFill,
                  { backgroundColor: colors.waterColor, width: `${waterPercent * 100}%` as any },
                ]}
              />
            </View>
            <View style={styles.waterButtons}>
              <Pressable onPress={handleRemoveWater} style={({ pressed }) => [styles.waterBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <Feather name="minus" size={16} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={handleAddWater} style={({ pressed }) => [styles.waterBtn, styles.waterBtnAdd, { backgroundColor: colors.waterColor + "20", opacity: pressed ? 0.6 : 1 }]}>
                <Feather name="plus" size={16} color={colors.waterColor} />
              </Pressable>
            </View>
          </GlassCard>

          <GlassCard style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <MaterialCommunityIcons name="shoe-print" size={20} color={colors.accentEmerald} />
              <Text style={[styles.activityTitle, { color: colors.textSecondary }]}>Steps</Text>
            </View>
            <Text style={[styles.activityValue, { color: colors.text }]}>
              {todayLog.steps.toLocaleString()}
            </Text>
            <View style={[styles.waterTrack, { backgroundColor: colors.progressRingBg }]}>
              <View
                style={[
                  styles.waterFill,
                  { backgroundColor: colors.accentEmerald, width: `${stepsPercent * 100}%` as any },
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
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  greeting: { fontSize: 14, fontFamily: "DMSans_400Regular" },
  title: { fontSize: 28, fontFamily: "DMSans_700Bold", marginTop: 2 },
  todayBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  todayText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  calorieCard: { marginTop: 4 },
  calorieContent: { alignItems: "center", gap: 20 },
  calorieNumber: { fontSize: 36, fontFamily: "DMSans_700Bold" },
  calorieLabel: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: -2 },
  calorieSummary: { flexDirection: "row", gap: 24 },
  summaryItem: { alignItems: "center", gap: 4 },
  summaryDot: { width: 6, height: 6, borderRadius: 3 },
  summaryLabel: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  summaryValue: { fontSize: 16, fontFamily: "DMSans_600SemiBold" },
  sectionTitle: { fontSize: 18, fontFamily: "DMSans_700Bold", marginTop: 8 },
  macroContainer: { gap: 14 },
  aiCard: { overflow: "hidden" },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  aiIconBg: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aiTitle: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  aiText: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 20 },
  activityRow: { flexDirection: "row", gap: 12 },
  activityCard: { flex: 1 },
  activityHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  activityTitle: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  activityValue: { fontSize: 24, fontFamily: "DMSans_700Bold", marginBottom: 8 },
  activityUnit: { fontSize: 14, fontFamily: "DMSans_400Regular" },
  waterTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 10 },
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
  stepsGoal: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
});
