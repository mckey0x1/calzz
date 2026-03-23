import React, { useState } from "react";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { totalCalories, goals, last7Days, currentStreak, weekStatus } =
    useNutrition();
  const [selectedTime, setSelectedTime] = useState("90 Days");
  const router = useRouter();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const weeklyData = last7Days.map((log) => {
    const d = new Date(log.date);
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

  let latestWei = goals.currentWeight || 176;
  const weightData = last7Days.map((log) => {
    if (log && log.weight) {
      latestWei = log.weight;
      return log.weight;
    }
    return latestWei;
  });

  const myWeight = goals.currentWeight || 80;
  const targetWeight = goals.targetWeight || 75;
  const progressWeight = Math.min((myWeight / targetWeight) * 100, 100);

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
            {/* <View style={styles.nextWeightInBox}>
              <Text style={styles.nextWeightLabel}>Next weight-in:</Text>
              <Text style={styles.nextWeightValue}>2d</Text>
            </View> */}
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
              {last7Days.map((log, i) => {
                const dayName = new Date(log.date).toLocaleDateString("en-US", {
                  weekday: "short",
                })[0];
                return (
                  <View key={i} style={styles.streakDayDot}>
                    <Text style={styles.streakDayText}>{dayName}</Text>
                    <View
                      style={[
                        styles.dotCircle,
                        weekStatus[i] && { backgroundColor: "#FF9F1C" },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          </Pressable>
        </View>

        {/* Time Selector */}
        <View style={styles.timeSelectorContainer}>
          {["90 Days", "6 Months", "1 Year", "All time"].map((item) => (
            <Pressable
              key={item}
              onPress={() => setSelectedTime(item)}
              style={[
                styles.timeOption,
                selectedTime === item && styles.timeOptionActive,
              ]}>
              <Text
                style={[
                  styles.timeOptionText,
                  selectedTime === item && styles.timeOptionTextActive,
                ]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Goal Progress (Weight) Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Goal Progress</Text>
            <View style={styles.goalPill}>
              <Ionicons name="flag-outline" size={14} color="#444" />
              <Text style={styles.goalPillText}>
                {Math.round(progressWeight)}%{" "}
                <Text style={styles.goalPillSub}>of goal</Text>
              </Text>
              <Ionicons
                name="pencil-sharp"
                size={12}
                color="#ccc"
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>
          <View style={styles.weightChartContainer}>
            <WeightChartSvg data={weightData} goal={targetWeight} />
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

function WeeklyBarChart({ data, goal }: { data: any[]; goal: number }) {
  const chartHeight = 100;
  const chartWidth = SCREEN_WIDTH - 80;
  const barWidth = 14;
  const spacing = (chartWidth - 20) / 6;

  return (
    <View style={{ marginTop: 10 }}>
      <Svg width={chartWidth} height={chartHeight + 40}>
        {/* Horizontal Dash Lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <G key={i}>
            <Line
              x1="25"
              y1={chartHeight - (i * chartHeight) / 4}
              x2={chartWidth}
              y2={chartHeight - (i * chartHeight) / 4}
              stroke="#f1f1f5"
              strokeWidth="1"
              strokeDasharray="4, 4"
            />
            <SvgText
              x="0"
              y={chartHeight - (i * chartHeight) / 4 + 4}
              fontSize="12"
              fill="#bbb"
              fontWeight="500">
              0
            </SvgText>
          </G>
        ))}

        {/* Bars */}
        {data.map((item, i) => {
          const totalH = (item.total / (goal || 2500)) * chartHeight;
          const clampedH =
            item.total > 0 ? Math.min(Math.max(totalH, 4), chartHeight) : 0;

          let cRectH = 0,
            fRectH = 0,
            oRectH = 0;
          if (item.total > 0) {
            const scale = clampedH / item.total;
            cRectH = item.c * scale;
            fRectH = item.f * scale;
            oRectH = item.other * scale;
          } else {
            oRectH = clampedH;
          }

          const x = 35 + i * spacing;

          return (
            <G key={i}>
              {item.total > 0 && (
                <Rect
                  x={x - barWidth / 2}
                  y={chartHeight - clampedH}
                  width={barWidth}
                  height={clampedH}
                  rx={barWidth / 2}
                  fill="#e57373"
                />
              )}
              {item.total > 0 && (
                <>
                  {/* Carbs Stack (Orange) */}
                  <Rect
                    x={x - barWidth / 2}
                    y={chartHeight - clampedH}
                    width={barWidth}
                    height={fRectH + oRectH + cRectH}
                    rx={fRectH + oRectH + cRectH > barWidth ? barWidth / 2 : 0}
                    fill="#ffb74d"
                  />
                  {/* Fats Stack (Blue) */}
                  <Rect
                    x={x - barWidth / 2}
                    y={chartHeight - clampedH}
                    width={barWidth}
                    height={fRectH + oRectH}
                    rx={fRectH + oRectH > barWidth ? barWidth / 2 : 0}
                    fill="#5a8bed"
                  />
                  {/* Other Stack (Gray fallbacks for missing logic constraints) */}
                  {oRectH > 0 && (
                    <Rect
                      x={x - barWidth / 2}
                      y={chartHeight - clampedH}
                      width={barWidth}
                      height={oRectH}
                      rx={oRectH > barWidth ? barWidth / 2 : 0}
                      fill="#f1f1f5"
                    />
                  )}
                </>
              )}
              <SvgText
                x={x}
                y={chartHeight + 25}
                fontSize="12"
                fill="#999"
                fontWeight="500"
                textAnchor="middle">
                {item.day}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

function BMIGauge({ value }: { value: number }) {
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
}

function WeightChartSvg({ data, goal }: { data: number[]; goal: number }) {
  const chartW = SCREEN_WIDTH - 70;
  const chartH = 150;

  const validData = data.length > 0 ? data : [150];
  const minData = Math.min(...validData, goal) - 2;
  const maxData = Math.max(...validData, goal) + 2;
  const range = maxData - minData || 1;

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    gridLines.push(maxData - (i * range) / 4);
  }

  const stepX = (chartW - 45) / Math.max(validData.length - 1, 1);
  const points = validData
    .map((val, i) => {
      const x = 45 + i * stepX;
      const y = chartH - ((val - minData) / range) * chartH + 10;
      return `${x},${y}`;
    })
    .join(" ");

  const goalY = chartH - ((goal - minData) / range) * chartH + 10;

  return (
    <View style={{ width: "100%", height: chartH + 40, marginTop: 10 }}>
      <Svg
        width="100%"
        height={chartH + 40}
        viewBox={`0 0 ${chartW} ${chartH + 40}`}>
        {/* Grid Lines */}
        {gridLines.map((val, i) => {
          const y = i * (chartH / 4) + 10;
          return (
            <G key={i}>
              <Line
                x1="45"
                y1={y}
                x2={chartW}
                y2={y}
                stroke="#f1f1f5"
                strokeWidth="1"
                strokeDasharray="4, 4"
              />
              <SvgText
                x="0"
                y={y + 4}
                fontSize="14"
                fill="#bbb"
                fontWeight="400">
                {val.toFixed(1)}
              </SvgText>
            </G>
          );
        })}
        {/* Main Goal Line Bold */}
        <Line
          x1="45"
          y1={goalY}
          x2={chartW}
          y2={goalY}
          stroke="#000"
          strokeWidth="1.5"
        />
        {/* Weight Data Line */}
        {validData.length > 0 && (
          <Polyline
            points={points}
            fill="none"
            stroke="#111"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {validData.map((val, i) => {
          const x = 45 + i * stepX;
          const y = chartH - ((val - minData) / range) * chartH + 10;
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#111"
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}
      </Svg>
    </View>
  );
}

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
    padding: 20,
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
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
    marginBottom: 8,
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
    height: 6,
    backgroundColor: "#f5f5f9",
    borderRadius: 3,
    marginVertical: 12,
  },
  weightProgressFill: {
    height: "100%",
    backgroundColor: "#f1f1f5",
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

  // Time Selector
  timeSelectorContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f9",
    borderRadius: 20,
    padding: 4,
    justifyContent: "space-between",
  },
  timeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 16,
  },
  timeOptionActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  timeOptionText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "500",
  },
  timeOptionTextActive: {
    color: "#111",
    fontWeight: "700",
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
    borderRadius: 12,
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
    color: "#999",
    fontWeight: "500",
  },
});
