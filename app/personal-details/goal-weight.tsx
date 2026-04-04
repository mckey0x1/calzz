import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useNutrition } from "@/lib/nutrition-context";
import { useThemeColors } from "@/constants/colors";

const MIN_WEIGHT = 50;
const MAX_WEIGHT = 350;
const TICK_WIDTH = 8;
const LB_WIDTH = TICK_WIDTH * 10;

export default function SetGoalWeightScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined);
  const { goals, updateGoals } = useNutrition();

  const currentWeight = goals.currentWeight || 120;
  const targetWeight = goals.targetWeight || 120;

  const [weightState, setWeightState] = useState(targetWeight);

  const { width: RULER_WIDTH } = useWindowDimensions();
  const HALF_WIDTH = RULER_WIDTH / 2;

  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === "web" ? 40 : insets.top + 20;

  useEffect(() => {
    const initialScrollX = (targetWeight - MIN_WEIGHT) * LB_WIDTH;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialScrollX,
        animated: false,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [targetWeight]);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      let bounded = Math.max(0, value);
      const val = MIN_WEIGHT + bounded / LB_WIDTH;
      setWeightState(Math.round(val * 10) / 10);
    });
    return () => scrollX.removeListener(id);
  }, [scrollX]);

  const handleBack = () => router.back();

  const handleSave = () => {
    updateGoals({ targetWeight: weightState });
    router.back();
  };

  const currentWeightX = (currentWeight - MIN_WEIGHT) * LB_WIDTH;

  const gainWidth = scrollX.interpolate({
    inputRange: [currentWeightX, currentWeightX + 10000],
    outputRange: [0, 10000],
    extrapolate: "clamp",
  });
  const gainLeft = scrollX.interpolate({
    inputRange: [currentWeightX, currentWeightX + 10000],
    outputRange: [HALF_WIDTH, HALF_WIDTH - 10000],
    extrapolate: "clamp",
  });

  const loseWidth = scrollX.interpolate({
    inputRange: [currentWeightX - 10000, currentWeightX],
    outputRange: [10000, 0],
    extrapolate: "clamp",
  });
  const loseLeft = scrollX.interpolate({
    inputRange: [currentWeightX - 10000, currentWeightX],
    outputRange: [HALF_WIDTH, HALF_WIDTH],
    extrapolate: "clamp",
  });

  const data = Array.from(
    { length: MAX_WEIGHT - MIN_WEIGHT + 1 },
    (_, i) => MIN_WEIGHT + i,
  );

  const gainText =
    weightState > currentWeight
      ? "Gain Weight"
      : weightState < currentWeight
        ? "Lose Weight"
        : "Maintain Weight";

  const renderItem = ({ item }: { item: number }) => {
    return (
      <View style={styles.rulerBlock}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={styles.tickContainer}>
            <View
              style={[
                styles.tick,
                {
                  height: i === 0 ? 30 : i === 5 ? 20 : 12,
                  backgroundColor: i === 0 ? "#1A1A1A" : "#A0A0A0",
                },
              ]}
            />
          </View>
        ))}
        {item === Math.floor(currentWeight) && (
          <View
            style={[
              styles.currentWeightLabel,
              { left: (currentWeight % 1) * LB_WIDTH },
            ]}>
            <Text style={styles.currentWeightText}>
              {currentWeight.toFixed(1)} lbs
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      <View style={[styles.header, { marginTop: topInset }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: "#F7F7F7", opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Weight Goal</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.gainText}>{gainText}</Text>
          <Text style={styles.largeWeightText}>
            {weightState.toFixed(1)} lbs
          </Text>
        </View>

        <View style={styles.rulerWrapper}>
          <Animated.View
            style={[styles.shadedBox, { left: gainLeft, width: gainWidth }]}
          />
          <Animated.View
            style={[styles.shadedBox, { left: loseLeft, width: loseWidth }]}
          />

          <Animated.FlatList
            ref={flatListRef}
            data={data}
            keyExtractor={(item: any) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            snapToInterval={TICK_WIDTH}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            ListHeaderComponent={<View style={{ width: HALF_WIDTH }} />}
            ListFooterComponent={<View style={{ width: HALF_WIDTH }} />}
            renderItem={renderItem}
            getItemLayout={(data, index) => ({
              length: LB_WIDTH,
              offset: LB_WIDTH * index,
              index,
            })}
          />

          <View style={styles.centerPointer} />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleSave}>
          <Text style={styles.saveBtnText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  content: {
    flex: 1,
    marginTop: 40,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  gainText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  largeWeightText: {
    fontSize: 34,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  rulerWrapper: {
    position: "relative",
    height: 100,
    width: "100%",
  },
  shadedBox: {
    position: "absolute",
    height: 40,
    top: 30, // vertically centered with ticks
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  rulerBlock: {
    width: LB_WIDTH,
    flexDirection: "row",
    height: 100,
    alignItems: "center",
  },
  tickContainer: {
    width: TICK_WIDTH,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  tick: {
    width: 1,
    borderRadius: 1,
  },
  currentWeightLabel: {
    position: "absolute",
    top: 75,
    width: 80,
    marginLeft: -40,
    alignItems: "center",
  },
  currentWeightText: {
    fontSize: 12,
    color: "#1A1A1A",
    fontFamily: "Poppins_400Regular",
  },
  centerPointer: {
    position: "absolute",
    left: "50%",
    top: 10,
    height: 60,
    width: 2,
    marginLeft: -1,
    backgroundColor: "#1A1A1A",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
