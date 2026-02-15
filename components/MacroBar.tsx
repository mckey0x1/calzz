import React, { useEffect } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useThemeColors } from "@/constants/colors";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, goal, color, unit = "g" }: MacroBarProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(current / goal, 1), {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [current, goal]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <Text style={[styles.value, { color: colors.text }]}>
          {current}<Text style={[styles.unit, { color: colors.textTertiary }]}>/{goal}{unit}</Text>
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.progressRingBg }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, animatedStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  value: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
  unit: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
