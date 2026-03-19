import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useColorScheme,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
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
} from "react-native-svg";
import { useThemeColors } from "@/constants/colors";

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fcfdfd", "#fcfdfd"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 20,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 150,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>

        {/* Top Cards Row */}
        <View style={styles.topCardsRow}>
          {/* Weight Card */}
          <View style={styles.weightCardWrapper}>
            <View style={styles.weightCardContent}>
              <Text style={styles.cardHeaderSmall}>Your Weight</Text>
              <Text style={styles.weightValueMain}>
                132.1 <Text style={styles.weightUnit}>lbs</Text>
              </Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: "15%" }]} />
              </View>
              <Text style={styles.goalText}>
                Goal <Text style={styles.goalTextBold}>140 lbs</Text>
              </Text>
            </View>
            <Pressable style={styles.logWeightBtn}>
              <Text style={styles.logWeightBtnText}>Log Weight</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </Pressable>
          </View>

          {/* Streak Card */}
          <View style={styles.streakCard}>
            <View style={styles.flameContainer}>
              <Ionicons
                name="flame"
                size={50}
                color="#FF9F1C"
                style={styles.flameIcon}
              />
              <Ionicons
                name="sparkles"
                size={14}
                color="#F3E5AB"
                style={styles.sparkle1}
              />
              <Ionicons
                name="sparkles"
                size={12}
                color="#F3E5AB"
                style={styles.sparkle2}
              />

              <View style={styles.streakNumberContainer}>
                <Text style={styles.streakNumber}>21</Text>
              </View>
            </View>
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>

            <View style={styles.weekRow}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => {
                const isChecked = i < 2;
                return (
                  <View key={i} style={styles.dayCol}>
                    <Text
                      style={[
                        styles.dayText,
                        isChecked && styles.dayTextActive,
                      ]}>
                      {day}
                    </Text>
                    {isChecked ? (
                      <View style={styles.checkedCircle}>
                        <Ionicons name="checkmark" size={10} color="#FFF" />
                      </View>
                    ) : (
                      <View style={styles.uncheckedCircle} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Weight Progress Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weight Progress</Text>
            <View style={styles.flagPill}>
              <Ionicons name="flag-outline" size={12} color="#444" />
              <Text style={styles.flagText}>
                80% <Text style={styles.flagSubText}>of goal</Text>
              </Text>
            </View>
          </View>

          <View style={styles.chartArea}>
            <ChartSvg />
          </View>

          {/* Time Selector */}
          <View style={styles.timeSelector}>
            <View style={styles.timeOptionBox}>
              <Text style={styles.timeOption}>90D</Text>
            </View>
            <View style={styles.timeOptionActive}>
              <Text style={styles.timeTextActive}>6M</Text>
            </View>
            <View style={styles.timeOptionBox}>
              <Text style={styles.timeOption}>1Y</Text>
            </View>
            <View style={styles.timeOptionBox}>
              <Text style={styles.timeOption}>ALL</Text>
            </View>
          </View>

          {/* Motivational Pill */}
          <View style={styles.motivationalPill}>
            <Text style={styles.motivationalText}>
              Great job! Consistency is key, and you're mastering it!
            </Text>
          </View>
        </View>

        {/* Daily Average Calories Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Average Calories</Text>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieValue}>
              2861 <Text style={styles.calorieUnit}>cal</Text>
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="arrow-up" size={14} color="#38b000" />
              <Text style={styles.calTrendText}>90%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ChartSvg() {
  const chartW = 300;

  // Adjusted path curves to roughly match the screenshot.
  // We use an SVG viewBox of 0 0 300 200
  // Line goes from left to right.
  const greenLineD =
    "M 5 140 Q 15 125, 20 120 T 35 130 T 45 140 T 70 80 Q 90 105, 100 120 T 140 100 T 155 105 T 170 65";
  const blackLineD = "M 170 65 Q 185 85, 190 100 T 220 70 T 280 60";

  const pathFillGreen = greenLineD + " L 170 180 L 5 180 Z";
  const pathFillBlack = blackLineD + " L 280 180 L 170 180 Z";

  return (
    <View style={{ width: "100%", height: 210, marginTop: 10 }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${chartW} 200`}>
        <Defs>
          <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#31d187" stopOpacity="0.15" />
            <Stop offset="1" stopColor="#31d187" stopOpacity="0" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradBlack" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#000000" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Y-axis grid lines & labels */}
        {[140, 135, 130, 125, 120].map((val, i) => {
          const y = i * 40 + 20;
          return (
            <G key={`y-${val}`}>
              <Line
                x1="25"
                y1={y}
                x2={chartW}
                y2={y}
                stroke="#f0f0f0"
                strokeWidth="1"
                strokeDasharray="3, 3"
              />
              <SvgText
                x="0"
                y={y + 4}
                fontSize="11"
                fill="#bbb"
                fontWeight="500">
                {val}
              </SvgText>
            </G>
          );
        })}

        {/* X-axis labels */}
        {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((month, i) => {
          const x = i * 45 + 25;
          return (
            <SvgText
              key={`x-${month}`}
              x={x}
              y="195"
              fontSize="11"
              fill="#bbb"
              fontWeight="500">
              {month}
            </SvgText>
          );
        })}

        {/* Fill Areas */}
        <Path d={pathFillGreen} fill="url(#grad)" />
        <Path d={pathFillBlack} fill="url(#gradBlack)" />

        {/* Line itself */}
        <Path d={greenLineD} fill="none" stroke="#26b872" strokeWidth="2.5" />
        <Path d={blackLineD} fill="none" stroke="#1c1c1c" strokeWidth="2.5" />

        {/* Data Point at Tooltip */}
        <Line
          x1="170"
          y1="65"
          x2="170"
          y2="180"
          stroke="#26b872"
          strokeWidth="1"
        />
        <Circle
          cx="170"
          cy="65"
          r="4.5"
          fill="#FFF"
          stroke="#26b872"
          strokeWidth="2"
        />

        {/* Tooltip */}
        <G x="145" y="15">
          <Rect width="80" height="42" rx="12" fill="#222" />
          <SvgText
            x="40"
            y="18"
            fontSize="12"
            fill="#FFF"
            fontWeight="700"
            textAnchor="middle">
            131.2 lbs
          </SvgText>
          <SvgText x="40" y="32" fontSize="10" fill="#999" textAnchor="middle">
            Sep 9, 2025
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfdfd" },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, color: "#111" },

  topCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    height: 180,
  },

  weightCardWrapper: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    justifyContent: "space-between",
  },
  weightCardContent: {
    padding: 18,
    alignItems: "center",
  },
  cardHeaderSmall: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
    marginBottom: 6,
  },
  weightValueMain: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#1c1c1e",
    borderRadius: 3,
  },
  goalText: {
    fontSize: 12,
    color: "#888",
  },
  goalTextBold: {
    fontWeight: "700",
    color: "#333",
  },
  logWeightBtn: {
    backgroundColor: "#1c1c1e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logWeightBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },

  streakCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  flameContainer: {
    position: "relative",
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "center",
    height: 70,
  },
  flameIcon: {
    position: "absolute",
    top: 5,
    textShadowColor: "rgba(255,159,28,0.4)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  sparkle1: {
    position: "absolute",
    top: -5,
    right: -25,
  },
  sparkle2: {
    position: "absolute",
    top: 10,
    left: -20,
  },
  streakNumberContainer: {
    position: "absolute",
    top: 25,
    alignItems: "center",
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFF",
  },
  streakTextContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  streakLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FF9F1C",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 2,
  },
  dayCol: {
    alignItems: "center",
    gap: 6,
  },
  dayText: {
    fontSize: 11,
    color: "#bbb",
    fontWeight: "700",
  },
  dayTextActive: {
    color: "#FF9F1C",
  },
  checkedCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF9F1C",
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckedCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#f0f0f0",
  },

  chartCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  flagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  flagText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111",
  },
  flagSubText: {
    fontWeight: "500",
    color: "#888",
  },
  chartArea: {
    width: "100%",
  },
  timeSelector: {
    flexDirection: "row",
    backgroundColor: "#f5f5f7",
    borderRadius: 20,
    padding: 4,
    marginTop: 10,
    justifyContent: "space-between",
  },
  timeOptionBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  timeOption: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  timeOptionActive: {
    flex: 1.2,
    backgroundColor: "#FFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  timeTextActive: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },
  motivationalPill: {
    backgroundColor: "#ecfaef",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    alignItems: "center",
  },
  motivationalText: {
    color: "#31d187",
    fontSize: 13,
    fontWeight: "700",
  },
  calorieRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
    gap: 8,
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111",
    lineHeight: 40,
  },
  calorieUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#aaa",
  },
  calTrendText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#38b000",
    marginLeft: 2,
  },
});
