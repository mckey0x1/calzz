import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import Svg, { Polyline, Circle, Line, Rect } from "react-native-svg";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { GlassCard } from "@/components/GlassCard";
import { CalorieRing } from "@/components/CalorieRing";

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const {
    weekLogs,
    todayLog,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    goals,
  } = useNutrition();

  const allLogs = useMemo(() => [...weekLogs, todayLog], [weekLogs, todayLog]);

  const weeklyCalories = useMemo(() => {
    return allLogs.map((log) => ({
      date: log.date,
      total: log.entries.reduce((sum, e) => sum + e.calories, 0),
    }));
  }, [allLogs]);

  const avgCalories = useMemo(() => {
    const total = weeklyCalories.reduce((sum, d) => sum + d.total, 0);
    return Math.round(total / weeklyCalories.length);
  }, [weeklyCalories]);

  const weights = useMemo(() => {
    return allLogs
      .filter((l) => l.weight)
      .map((l) => ({ date: l.date, weight: l.weight! }));
  }, [allLogs]);

  const healthScore = useMemo(() => {
    let score = 50;
    const calPercent = totalCalories / goals.dailyCalories;
    if (calPercent > 0.7 && calPercent < 1.1) score += 15;
    else if (calPercent > 0.5) score += 8;

    const proteinPercent = totalProtein / goals.proteinGoal;
    if (proteinPercent > 0.7) score += 15;
    else if (proteinPercent > 0.4) score += 8;

    if (todayLog.waterGlasses >= goals.waterGoal * 0.7) score += 10;
    if (todayLog.steps >= goals.stepsGoal * 0.7) score += 10;

    return Math.min(score, 100);
  }, [totalCalories, totalProtein, todayLog, goals]);

  const totalMacroGrams = totalProtein + totalCarbs + totalFat;
  const proteinPct =
    totalMacroGrams > 0
      ? Math.round((totalProtein / totalMacroGrams) * 100)
      : 0;
  const carbsPct =
    totalMacroGrams > 0 ? Math.round((totalCarbs / totalMacroGrams) * 100) : 0;
  const fatPct =
    totalMacroGrams > 0 ? Math.round((totalFat / totalMacroGrams) * 100) : 0;

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
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>

        <GlassCard style={styles.healthScoreCard}>
          <LinearGradient
            colors={[
              colorScheme === "dark"
                ? "rgba(0,217,165,0.12)"
                : "rgba(0,184,148,0.06)",
              colorScheme === "dark"
                ? "rgba(139,124,247,0.12)"
                : "rgba(108,92,231,0.06)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.healthScoreContent}>
            <CalorieRing
              progress={healthScore / 100}
              size={100}
              strokeWidth={8}
              color={colors.accentEmerald}
              trackColor={colors.progressRingBg}>
              <Text style={[styles.healthScoreValue, { color: colors.text }]}>
                {healthScore}
              </Text>
            </CalorieRing>
            <View style={styles.healthScoreInfo}>
              <View style={styles.healthScoreHeader}>
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={colors.accentEmerald}
                />
                <Text
                  style={[
                    styles.healthScoreLabel,
                    { color: colors.accentEmerald },
                  ]}>
                  AI Health Score
                </Text>
              </View>
              <Text
                style={[
                  styles.healthScoreDesc,
                  { color: colors.textSecondary },
                ]}>
                {healthScore >= 80
                  ? "Excellent! You're making great choices today."
                  : healthScore >= 60
                    ? "Good progress. Focus on hitting your protein and water targets."
                    : "Room to improve. Log more meals and stay hydrated."}
              </Text>
            </View>
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Weekly Calories
        </Text>
        <GlassCard>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartAvg, { color: colors.textSecondary }]}>
              Avg:{" "}
              <Text
                style={{ color: colors.text, fontFamily: "Poppins_700Bold" }}>
                {avgCalories} cal
              </Text>
            </Text>
            <View
              style={[
                styles.goalLine,
                { backgroundColor: colors.accentEmerald + "30" },
              ]}>
              <Text
                style={[styles.goalLineText, { color: colors.accentEmerald }]}>
                Goal: {goals.dailyCalories}
              </Text>
            </View>
          </View>
          <WeeklyBarChart
            data={weeklyCalories}
            goal={goals.dailyCalories}
            colors={colors}
          />
        </GlassCard>

        {weights.length > 1 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Weight Trend
            </Text>
            <GlassCard>
              <WeightLineChart data={weights} colors={colors} />
            </GlassCard>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Macro Balance
        </Text>
        <GlassCard>
          <View style={styles.macroBalanceRow}>
            <MacroPieSlice
              label="Protein"
              value={proteinPct}
              color={colors.proteinColor}
              colors={colors}
            />
            <MacroPieSlice
              label="Carbs"
              value={carbsPct}
              color={colors.carbsColor}
              colors={colors}
            />
            <MacroPieSlice
              label="Fat"
              value={fatPct}
              color={colors.fatColor}
              colors={colors}
            />
          </View>
          <View
            style={[
              styles.macroBalanceBar,
              { backgroundColor: colors.progressRingBg },
            ]}>
            {totalMacroGrams > 0 && (
              <>
                <View
                  style={[
                    styles.macroSegment,
                    { backgroundColor: colors.proteinColor, flex: proteinPct },
                  ]}
                />
                <View
                  style={[
                    styles.macroSegment,
                    { backgroundColor: colors.carbsColor, flex: carbsPct },
                  ]}
                />
                <View
                  style={[
                    styles.macroSegment,
                    { backgroundColor: colors.fatColor, flex: fatPct },
                  ]}
                />
              </>
            )}
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Weekly Summary
        </Text>
        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Feather name="target" size={20} color={colors.tint} />
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {
                weeklyCalories.filter(
                  (d) =>
                    Math.abs(d.total - goals.dailyCalories) <
                    goals.dailyCalories * 0.15,
                ).length
              }
              /7
            </Text>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Days on target
            </Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Feather
              name="trending-up"
              size={20}
              color={colors.accentEmerald}
            />
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {Math.round(
                (weeklyCalories.reduce((s, d) => s + d.total, 0) / 1000) * 10,
              ) / 10}
              k
            </Text>
            <Text
              style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Total cal this week
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

function WeeklyBarChart({
  data,
  goal,
  colors,
}: {
  data: { date: string; total: number }[];
  goal: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const maxVal = Math.max(...data.map((d) => d.total), goal) * 1.1;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <View style={styles.barChart}>
      <View style={styles.barChartBars}>
        {data.slice(-7).map((d, i) => {
          const height = maxVal > 0 ? (d.total / maxVal) * 120 : 0;
          const isOverGoal = d.total > goal;
          return (
            <View key={d.date} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height,
                      backgroundColor: isOverGoal
                        ? colors.warningOrange
                        : colors.tint,
                      borderRadius: 6,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: colors.textTertiary }]}>
                {days[i] || d.date.slice(-2)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function WeightLineChart({
  data,
  colors,
}: {
  data: { date: string; weight: number }[];
  colors: ReturnType<typeof useThemeColors>;
}) {
  const chartW = 280;
  const chartH = 100;
  const padding = 20;
  const minW = Math.min(...data.map((d) => d.weight)) - 1;
  const maxW = Math.max(...data.map((d) => d.weight)) + 1;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartW - padding * 2);
    const y =
      chartH -
      padding -
      ((d.weight - minW) / (maxW - minW)) * (chartH - padding * 2);
    return `${x},${y}`;
  });

  return (
    <View style={styles.lineChart}>
      <Svg width={chartW} height={chartH}>
        <Polyline
          points={points.join(" ")}
          fill="none"
          stroke={colors.accentEmerald}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (chartW - padding * 2);
          const y =
            chartH -
            padding -
            ((d.weight - minW) / (maxW - minW)) * (chartH - padding * 2);
          return (
            <Circle key={i} cx={x} cy={y} r={4} fill={colors.accentEmerald} />
          );
        })}
      </Svg>
      <View style={styles.weightLabels}>
        <Text style={[styles.weightLabel, { color: colors.textTertiary }]}>
          {data[0]?.weight.toFixed(1)} kg
        </Text>
        <Text style={[styles.weightLabel, { color: colors.textTertiary }]}>
          {data[data.length - 1]?.weight.toFixed(1)} kg
        </Text>
      </View>
    </View>
  );
}

function MacroPieSlice({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.macroSlice}>
      <View style={[styles.macroSliceDot, { backgroundColor: color }]} />
      <Text style={[styles.macroSliceLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.macroSliceValue, { color: colors.text }]}>
        {value}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 24 },
  title: { fontSize: 28, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", marginTop: 8 },
  healthScoreCard: { overflow: "hidden" },
  healthScoreContent: { flexDirection: "row", alignItems: "center", gap: 20 },
  healthScoreValue: { fontSize: 28, fontFamily: "Poppins_700Bold" },
  healthScoreInfo: { flex: 1, gap: 6 },
  healthScoreHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  healthScoreLabel: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  healthScoreDesc: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartAvg: { fontSize: 13, fontFamily: "Poppins_400Regular" },
  goalLine: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  goalLineText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
  barChart: { alignItems: "center" },
  barChartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    height: 140,
    alignItems: "flex-end",
  },
  barColumn: { flex: 1, alignItems: "center", gap: 6 },
  barWrapper: { height: 120, justifyContent: "flex-end" },
  bar: { width: 24, minHeight: 4 },
  barLabel: { fontSize: 11, fontFamily: "Poppins_500Medium" },
  lineChart: { alignItems: "center", paddingVertical: 8 },
  weightLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  weightLabel: { fontSize: 12, fontFamily: "Poppins_500Medium" },
  macroBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  macroSlice: { alignItems: "center", gap: 4 },
  macroSliceDot: { width: 10, height: 10, borderRadius: 5 },
  macroSliceLabel: { fontSize: 12, fontFamily: "Poppins_400Regular" },
  macroSliceValue: { fontSize: 18, fontFamily: "Poppins_700Bold" },
  macroBalanceBar: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    overflow: "hidden",
  },
  macroSegment: { height: "100%" },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, alignItems: "center", gap: 6 },
  summaryValue: { fontSize: 22, fontFamily: "Poppins_700Bold" },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
});
