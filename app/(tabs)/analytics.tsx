import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useColorScheme,
  Platform,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  G,
  Text as SvgText,
  Rect,
  Line,
  Polyline,
} from "react-native-svg";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { PremiumWeightChart } from "@/components/PremiumWeightChart";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const {
    totalCalories,
    goals,
    last7Days,
    allDays,
    currentStreak,
    weekStatus,
  } = useNutrition();
  const [selectedTime, setSelectedTime] = useState("90 Days");
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isFocused]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const distanceToSunday = -dayOfWeek;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + distanceToSunday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const weeklyData = useMemo(() => {
    return weekDates.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const log = last7Days.find((l) => l?.date === dateStr);

      const d = new Date(date);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const cals =
        log && log.entries
          ? log.entries.reduce((sum, e) => sum + e.calories, 0)
          : 0;
      const pCals =
        log && log.entries
          ? log.entries.reduce((sum, e) => sum + e.protein * 4, 0)
          : 0;
      const cCals =
        log && log.entries
          ? log.entries.reduce((sum, e) => sum + e.carbs * 4, 0)
          : 0;
      const fCals =
        log && log.entries
          ? log.entries.reduce((sum, e) => sum + e.fat * 9, 0)
          : 0;
      const computedCals = pCals + cCals + fCals;
      const other = Math.max(0, cals - computedCals);

      return {
        day: dayName,
        total: cals,
        p: pCals,
        c: cCals,
        f: fCals,
        other,
      };
    });
  }, [weekDates, last7Days]);

  let filteredLogs = allDays;
  if (selectedTime === "90 Days") filteredLogs = allDays.slice(-90);
  else if (selectedTime === "6 Months") filteredLogs = allDays.slice(-180);
  else if (selectedTime === "1 Year") filteredLogs = allDays.slice(-365);

  const historicalWeightData = useMemo(() => {
    const dataCount =
      selectedTime === "90 Days"
        ? 90
        : selectedTime === "6 Months"
          ? 180
          : selectedTime === "1 Year"
            ? 365
            : 30;
    
    const weightMap = new Map();
    allDays.forEach(l => {
      if (l && l.date && l.weight) {
        weightMap.set(l.date, l.weight);
      }
    });

    const result = [];
    let lastWeight = goals.currentWeight || 150;

    // Use currentWeight as baseline for furthest historical point if no log found
    for (let i = dataCount; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const weight = weightMap.get(dateStr);
      if (weight !== undefined) {
        lastWeight = weight;
      }

      result.push({
        value: lastWeight,
        date: dateStr,
      });
    }
    return result;
  }, [selectedTime, goals.currentWeight, allDays]);

  const myWeight = goals.currentWeight || 150;
  const targetWeight = goals.targetWeight || 120;

  const progressWeight = Math.max(2, Math.min((myWeight / targetWeight) * 100, 100));

  let bmi = 0;
  if (goals.heightFt && goals.heightIn && myWeight) {
    const inches = goals.heightFt * 12 + goals.heightIn;
    const meters = inches * 0.0254;
    // myWeight is in lbs, convert to kg
    const weightKg = myWeight * 0.453592;
    bmi = weightKg / (meters * meters);
  } else {
    bmi = 22; // default healthy fallback
  }

  let bmiStatusText = "Healthy";
  if (bmi < 18.5) bmiStatusText = "Underweight";
  else if (bmi >= 25 && bmi < 30) bmiStatusText = "Overweight";
  else if (bmi >= 30) bmiStatusText = "Obese";

  let bmiColor = "#81c784";
  if (bmiStatusText === "Underweight") bmiColor = "#64b5f6";
  else if (bmiStatusText === "Overweight") bmiColor = "#ffb74d";
  else if (bmiStatusText === "Obese") bmiColor = "#e57373";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 20,
            paddingBottom: 170,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>

        {/* Top Cards: My Weight & Day Streak */}
        <View style={styles.topCardsRow}>
          {/* My Weight Card */}
          <View style={styles.smallCard}>
            <Text style={styles.smallCardLabel}>My Weight</Text>
            <Text style={styles.weightValue}>
              {myWeight} <Text style={styles.weightUnit}>lbs</Text>
            </Text>
            <View style={styles.weightProgressTrack}>
              <View
                style={[
                  styles.weightProgressFill,
                  { width: `${progressWeight}%` },
                ]}
              />
            </View>
            <Text style={styles.goalHint}>
              Goal <Text style={styles.goalHintBold}>{targetWeight} lbs</Text>
            </Text>
            <Pressable
              onPress={() => router.push("/log-weight")}
              style={({ pressed }) => [
                styles.logWeightButton,
                { opacity: pressed ? 0.9 : 1 },
              ]}>
              <Text style={styles.logWeightText}>Log Weight</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>

          {/* Day Streak Card */}
          <Pressable
            onPress={() => router.push("/streak")}
            style={styles.smallCard}>
            <View style={styles.streakFlameContainer}>
              <Ionicons
                name="flame"
                size={70}
                color="#FF9F1C"
                style={styles.flameIcon}
              />
              <View style={styles.streakNumberBubble}>
                <Text style={styles.streakNumberText}>{currentStreak}</Text>
              </View>
            </View>
            <Text style={styles.streakLabel}>Day streak</Text>
            <View style={styles.streakWeekRow}>
              {weekDates.map((d, i) => {
                const dayName = d.toLocaleDateString("en-US", {
                  weekday: "short",
                })[0];
                const dateStr = d.toISOString().split("T")[0];
                const hasLog = last7Days.some(
                  (log) =>
                    log?.date === dateStr &&
                    log.entries &&
                    log.entries.length > 0,
                );
                return (
                  <View key={i} style={styles.streakDayDot}>
                    <Text style={styles.streakDayText}>{dayName}</Text>
                    <View
                      style={[
                        styles.dotCircle,
                        hasLog && { backgroundColor: "#FF9F1C" },
                      ]}>
                      {hasLog && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Pressable>
        </View>

        {/* Weight Progress Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weight Progress</Text>
            <View style={styles.goalPill}>
              <Ionicons name="flag-outline" size={14} color="#444" />
              <Text style={styles.goalPillText}>
                {Math.round(progressWeight)}%{" "}
                <Text style={styles.goalPillSub}>of goal</Text>
              </Text>
            </View>
          </View>

          <View style={styles.weightChartContainer}>
            <PremiumWeightChart
              data={historicalWeightData}
              goal={targetWeight}
            />
          </View>

          {/* Time Selector Inside Card */}
          <View style={styles.cardTimeSelector}>
            {[
              { label: "90D", value: "90 Days" },
              { label: "6M", value: "6 Months" },
              { label: "1Y", value: "1 Year" },
              { label: "ALL", value: "All time" },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setSelectedTime(item.value)}
                style={[
                  styles.cardTimeOption,
                  selectedTime === item.value && styles.cardTimeOptionActive,
                ]}>
                <Text
                  style={[
                    styles.cardTimeOptionText,
                    selectedTime === item.value &&
                      styles.cardTimeOptionTextActive,
                  ]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              Great job! Consistency is key, and you're mastering it!
            </Text>
          </View>
        </View>

        {/* Total Calories Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total calories</Text>
          <View style={styles.calorieValueRow}>
            <Text style={styles.mainCalorieValue}>
              {(totalCalories || 0).toFixed(1)}{" "}
              <Text style={styles.mainCalorieUnit}>cals</Text>
            </Text>
          </View>

          <View style={styles.calorieChartContainer}>
            <WeeklyBarChart
              data={weeklyData}
              goal={goals.dailyCalories || 2500}
            />
          </View>

          <View style={styles.calorieLegend}>
            <View style={styles.legendItem}>
              <MaterialCommunityIcons
                name="food-drumstick"
                size={16}
                color="#e57373"
              />
              <Text style={styles.legendText}>Protein</Text>
            </View>
            <View style={styles.legendItem}>
              <MaterialCommunityIcons name="barley" size={18} color="#ffb74d" />
              <Text style={styles.legendText}>Carbs</Text>
            </View>
            <View style={styles.legendItem}>
              <MaterialCommunityIcons name="peanut" size={16} color="#5a8bed" />
              <Text style={styles.legendText}>Fats</Text>
            </View>
          </View>

          <View style={styles.motivationalPill}>
            <Text style={styles.motivationalText}>
              Getting started is the hardest part. You're ready!
            </Text>
          </View>
        </View>

        {/* Your BMI Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your BMI</Text>
          <View style={styles.bmiValueRow}>
            <Text style={styles.bmiValue}>{bmi.toFixed(2)}</Text>
            <View style={styles.bmiStatusRow}>
              <Text style={styles.bmiStatusLabel}>Your weight is</Text>
              <View
                style={[styles.bmiStatusBadge, { backgroundColor: bmiColor }]}>
                <Text style={styles.bmiStatusText}>{bmiStatusText}</Text>
              </View>
            </View>
            {/* <Ionicons name="help-circle-outline" size={22} color="#ccc" /> */}
          </View>

          <BMIGauge value={bmi} />

          <View style={styles.bmiLegend}>
            <View style={styles.bmiLegendItem}>
              <View
                style={[styles.bmiLegendDot, { backgroundColor: "#64b5f6" }]}
              />
              <Text style={styles.bmiLegendText}>Underweight</Text>
            </View>
            <View style={styles.bmiLegendItem}>
              <View
                style={[styles.bmiLegendDot, { backgroundColor: "#81c784" }]}
              />
              <Text style={styles.bmiLegendText}>Healthy</Text>
            </View>
            <View style={styles.bmiLegendItem}>
              <View
                style={[styles.bmiLegendDot, { backgroundColor: "#ffb74d" }]}
              />
              <Text style={styles.bmiLegendText}>Overweight</Text>
            </View>
            <View style={styles.bmiLegendItem}>
              <View
                style={[styles.bmiLegendDot, { backgroundColor: "#e57373" }]}
              />
              <Text style={styles.bmiLegendText}>Obese</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// --- Helper Components ---

const WeeklyBarChart = React.memo(({ data, goal }: { data: any[]; goal: number }) => {
  const barData = useMemo(() => data.map((item) => ({
    value: item.total || 0,
    label: item.day,
    frontColor: "#111",
  })), [data]);

  const maxValue = useMemo(() => 
    Math.max(...data.map((d) => d.total || 0), goal || 2500) * 1.1,
  [data, goal]);

  return (
    <View style={{ marginTop: 10, alignItems: "center" }}>
      <BarChart
        data={barData}
        barWidth={15}
        noOfSections={4}
        barBorderRadius={20}
        frontColor="#111"
        yAxisTextStyle={{ color: "#bbb", fontSize: 10 }}
        xAxisLabelTextStyle={{ color: "#bbb", fontSize: 10, marginTop: 4 }}
        yAxisColor="transparent"
        xAxisColor="#f1f1f5"
        hideRules={false}
        rulesType="dashed"
        rulesColor="#f1f1f5"
        initialSpacing={20}
        spacing={(SCREEN_WIDTH - 60) / Math.max(data.length, 1) - 22}
        maxValue={maxValue || 2500}
        yAxisLabelWidth={60}
      />
    </View>
  );
});

const BMIGauge = React.memo(({ value }: { value: number }) => {
  const min = 15;
  const max = 35;
  const clamped = Math.min(Math.max(value, min), max);
  const percentage = ((clamped - min) / (max - min)) * 100;

  return (
    <View style={styles.bmiGaugeOuter}>
      <LinearGradient
        colors={["#64b5f6", "#81c784", "#ffb74d", "#e57373"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bmiGaugeBar}
      />
      <View style={[styles.bmiPointer, { left: `${percentage}%` }]} />
    </View>
  );
});


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 20, gap: 20 },
  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
    letterSpacing: -0.5,
  },

  // Top Cards Row
  topCardsRow: {
    flexDirection: "row",
    gap: 16,
  },
  smallCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: "#f0f0f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    alignItems: "center",
  },
  smallCardLabel: {
    fontSize: 16,
    color: "#888",
    fontWeight: "500",
    marginBottom: 8,
  },
  logWeightButton: {
    backgroundColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 66,
    width: "100%",
  },
  logWeightText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  weightValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },
  weightUnit: {
    fontSize: 20,
    color: "#111",
  },
  weightProgressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    marginVertical: 12,
    overflow: "hidden",
  },
  weightProgressFill: {
    height: "100%",
    backgroundColor: "#22C55E", // Theme green
    borderRadius: 3,
  },
  goalHint: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  goalHintBold: {
    color: "#444",
    fontWeight: "700",
  },
  nextWeightInBox: {
    backgroundColor: "#f5f5f9",
    width: "100%",
    padding: 10,
    borderRadius: 16,
    alignItems: "center",
  },
  nextWeightLabel: {
    fontSize: 13,
    color: "#999",
  },
  nextWeightValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginTop: 2,
  },

  streakFlameContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    height: 70,
  },
  flameIcon: {
    marginTop: -10,
  },
  streakNumberBubble: {
    position: "absolute",
    bottom: 5,
    minWidth: 28,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#f5e6d3", // Beige border as seen in image
    paddingHorizontal: 4,
  },
  streakNumberText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FF9F1C",
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF9F1C",
    marginBottom: 12,
  },
  streakWeekRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  streakDayDot: {
    alignItems: "center",
    gap: 4,
  },
  streakDayText: {
    fontSize: 10,
    color: "#aaa",
    fontWeight: "600",
  },
  dotCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#eee",
  },

  // Card-specific Time Selector
  cardTimeSelector: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 30,
    padding: 5,
    marginTop: 16,
  },
  cardTimeOption: {
    flex: 1,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 56,
  },
  cardTimeOptionActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTimeOptionText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Poppins_500Medium",
  },
  cardTimeOptionTextActive: {
    color: "#111",
    fontFamily: "Poppins_600SemiBold",
  },

  successBanner: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 36,
    marginTop: 16,
    alignItems: "center",
  },
  successBannerText: {
    fontSize: 8,
    color: "#059669",
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  // Generic Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f0f0f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  goalPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },
  goalPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
  },
  goalPillSub: {
    fontWeight: "500",
    color: "#888",
  },

  // Weight Chart
  weightChartContainer: {
    width: "100%",
  },

  // Calorie Stats
  calorieValueRow: {
    marginBottom: 10,
  },
  mainCalorieValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111",
  },
  mainCalorieUnit: {
    fontSize: 18,
    color: "#999",
    fontWeight: "500",
  },
  calorieChartContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  calorieLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },
  motivationalPill: {
    backgroundColor: "#f0fff4",
    padding: 12,
    borderRadius: 36,
    alignItems: "center",
  },
  motivationalText: {
    fontSize: 10,
    color: "#2f855a",
    fontWeight: "600",
    textAlign: "center",
  },

  // BMI
  bmiValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 15,
  },
  bmiValue: {
    fontSize: SCREEN_WIDTH > 400 ? 42 : 30,
    fontWeight: "700",
    color: "#111",
  },
  bmiStatusRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bmiStatusLabel: {
    fontSize: SCREEN_WIDTH > 400 ? 15 : 13,
    color: "#888",
  },
  bmiStatusBadge: {
    backgroundColor: "#48bb78",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bmiStatusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  bmiGaugeOuter: {
    height: 30,
    width: "100%",
    justifyContent: "center",
    marginVertical: 10,
  },
  bmiGaugeBar: {
    height: 8,
    borderRadius: 4,
    width: "100%",
  },
  bmiPointer: {
    position: "absolute",
    width: 2,
    height: 18,
    backgroundColor: "#111",
    top: 6,
  },
  bmiLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 0,
  },
  bmiLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bmiLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bmiLegendText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
});
