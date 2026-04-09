import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Dimensions,
  Image,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { useNutrition } from "@/lib/nutrition-context";
import { useNotifications } from "@/lib/notification-context";

import { useIsFocused } from "@react-navigation/native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ProgressRing = React.memo(function ProgressRing({
  size,
  progress,
  color,
  trackColor,
  strokeWidth,
  children,
}: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}>
      <Svg width={size} height={size}>
        <Circle
          stroke={trackColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { alignItems: "center", justifyContent: "center" },
        ]}>
        {children}
      </View>
    </View>
  );
});

let hasShownStreakThisSession = false;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    goals,
    todayLog,
    isAnalyzing,
    analyzingImage,
    analyzingPercent,
    scanResult,
    last7Days,
    currentStreak,
  } = useNutrition();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const dateScrollRef = useRef<ScrollView>(null);

  const { scheduleNotification } = useNotifications();

  const isFocused = useIsFocused();
  const streakSlideAnim = useRef(new Animated.Value(-200)).current;

  // Generate current week days (Sun -> Sat)
  const weekDays = useMemo(() => {
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

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      
      if (!hasShownStreakThisSession) {
        hasShownStreakThisSession = true;
        // Slide in custom toast
        Animated.spring(streakSlideAnim, {
          toValue: Platform.OS === 'web' ? 80 : insets.top + 10,
          useNativeDriver: true,
          bounciness: 12
        }).start();

        // Slide out after 4 seconds
        setTimeout(() => {
          Animated.timing(streakSlideAnim, {
            toValue: -200,
            duration: 400,
            useNativeDriver: true
          }).start();
        }, 6000);
      }
    }
  }, [isFocused, streakSlideAnim, insets.top]);

  useEffect(() => {
    if (!isAnalyzing && scanResult) {
      router.push("/scan-result");
    }
    // Automatically scroll to bottom when analysis starts to show the progress card
    if (isAnalyzing) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 10);
    }
  }, [isAnalyzing, scanResult]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  // Generate last 30 days — memoized to avoid creating 32 Date objects every render
  const dates = useMemo(() => {
    const result = [];
    for (let i = 30; i >= -1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d);
    }
    return result;
  }, []);

  const handleScroll = useCallback((event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(slide);
  }, []);

  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const selectedLog = useMemo(
    () => last7Days.find((l) => l?.date === selectedDateStr),
    [last7Days, selectedDateStr]
  );
  const selectedEntries = selectedLog?.entries || [];

  // Single-pass macro computation instead of 7 separate .reduce()
  const displayMacros = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0, sodium = 0;
    for (const e of selectedEntries) {
      calories += e.calories;
      protein += e.protein;
      carbs += e.carbs;
      fat += e.fat;
      fiber += e.fiber || 0;
      sugar += e.sugar || 0;
      sodium += e.sodium || 0;
    }
    return { calories, protein, carbs, fat, fiber, sugar, sodium };
  }, [selectedEntries]);

  const displayCalories = displayMacros.calories;
  const displayProtein = displayMacros.protein;
  const displayCarbs = displayMacros.carbs;
  const displayFat = displayMacros.fat;
  const displayFiber = displayMacros.fiber;
  const displaySugar = displayMacros.sugar;
  const displaySodium = displayMacros.sodium;

  const caloriesLeft = Math.max(
    (goals.dailyCalories || 2500) - displayCalories,
    0,
  );
  const calorieProgress = Math.min(
    displayCalories / (goals.dailyCalories || 2500),
    1,
  );

  const allRecentEntries = useMemo(
    () =>
      last7Days
        .filter((log) => !!log)
        .flatMap((log) => log.entries || [])
        .filter((e) => e.imageUri)
        .sort((a, b) => b.timestamp - a.timestamp),
    [last7Days]
  );

  const latestRecentUpload =
    allRecentEntries.length > 0 ? allRecentEntries[0] : null;

  const healthData = useMemo(() => {
    // 1. Calories adherence (40%)
    const calGoal = goals.dailyCalories || 2000;
    const calDiff = Math.abs(displayCalories - calGoal);
    const calScore = Math.max(0, (1 - calDiff / calGoal) * 4);

    // 2. Protein target (30%)
    const proGoal = goals.proteinGoal || 150;
    const proScore = Math.min(displayProtein / proGoal, 1) * 3;

    // 3. Balanced diet (20% - Carbs & Fats)
    const carbGoal = goals.carbsGoal || 200;
    const fatGoal = goals.fatGoal || 65;
    const carbScore = Math.min(displayCarbs / carbGoal, 1) * 1;
    const fatScore = Math.min(displayFat / fatGoal, 1) * 1;

    // 4. Junk penalty (10%)
    const sugarGoal = goals.sugarGoal || 64;
    const sodiumGoal = goals.sodiumGoal || 2300;
    const sugarPenalty = Math.max(0, (displaySugar - sugarGoal) / sugarGoal);
    const sodiumPenalty = Math.max(0, (displaySodium - sodiumGoal) / sodiumGoal);
    const junkScore = Math.max(0, (1 - (sugarPenalty + sodiumPenalty)) * 1);

    const totalRaw = calScore + proScore + carbScore + fatScore + junkScore;
    return {
      score: Math.min(Math.max(Math.round(totalRaw), 0), 10),
      percent: Math.min(Math.max(totalRaw * 10, 0), 100),
    };
  }, [displayCalories, displayProtein, displayCarbs, displayFat, displaySugar, displaySodium, goals]);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
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
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.logoAndTitle}>
            {/* <Ionicons name="logo-apple" size={28} color="#111" /> */}
            <Text style={styles.appTitle}>Calzz</Text>
          </View>
          <Pressable
            style={styles.streakPill}
            onPress={() => router.push("/streak")}>
            <Text style={styles.streakCount}>🔥 {currentStreak}</Text>
          </Pressable>
        </View>

        {/* Date Selector */}
        <View>
          <ScrollView
            ref={dateScrollRef}
            onLayout={() => {
              // Wait a tiny bit for full layout calculation before scrolling
              setTimeout(() => {
                dateScrollRef.current?.scrollToEnd({ animated: false });
              }, 50);
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateSelector}>
            {dates.map((date, idx) => {
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              const isFuture =
                new Date(date).setHours(0, 0, 0, 0) >
                new Date().setHours(0, 0, 0, 0);
              const isToday = date.toDateString() === new Date().toDateString();
              const dayName = date.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const dayNum = date.getDate();

              const dateLogStr = date.toISOString().split("T")[0];
              const logForDate = last7Days.find((l) => l?.date === dateLogStr);
              let ringColor = "#333333";
              let ringStyle: "solid" | "dashed" = "solid";

              if (!isFuture) {
                const totalCals =
                  logForDate?.entries?.reduce(
                    (sum, e) => sum + e.calories,
                    0,
                  ) || 0;
                if (totalCals === 0) {
                  ringColor = "#333333";
                  ringStyle = "dashed";
                } else {
                  const percent = totalCals / (goals.dailyCalories || 2500);
                  if (percent > 1.05) {
                    ringColor = "#f05a5a"; // Red
                  } else if (percent >= 0.85) {
                    ringColor = "#66d470"; // Green
                  } else {
                    ringColor = "#f4a261"; // Yellow
                  }
                  ringStyle = "solid";
                }
              }
              const currentProgress =
                !isFuture && (logForDate?.entries?.length || 0) > 0
                  ? (logForDate?.entries?.reduce(
                      (sum, e) => sum + e.calories,
                      0,
                    ) || 0) / (goals.dailyCalories || 2500)
                  : 0;

              return (
                <Pressable
                  key={idx}
                  disabled={isFuture}
                  onPress={() => setSelectedDate(date)}
                  style={[
                    styles.dateItem,
                    isToday && !isSelected && styles.dateItemToday,
                    isSelected && styles.dateItemActive,
                  ]}>
                  <Text
                    style={[
                      styles.dayName,
                      isSelected && styles.dayNameActive,
                      isFuture && !isSelected && { opacity: 0.7 },
                    ]}>
                    {dayName}
                  </Text>
                  <View
                    style={[
                      styles.dateCircle,
                      isFuture && !isSelected && { opacity: 0.7 },
                    ]}>
                    <ProgressRing
                      size={42}
                      progress={Math.min(currentProgress, 1)}
                      color={ringColor}
                      trackColor={
                        ringStyle === "dashed" ? "transparent" : "#f0f0f4"
                      }
                      strokeWidth={2}>
                      <Text
                        style={[
                          styles.dateNum,
                          isSelected && styles.dateNumActive,
                        ]}>
                        {dayNum}
                      </Text>
                    </ProgressRing>
                    {ringStyle === "dashed" && (
                      <View
                        style={[
                          StyleSheet.absoluteFillObject,
                          styles.dateCircleDashed,
                          { borderColor: ringColor, borderRadius: 21 },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Calorie Card */}
        <View style={styles.mainCard}>
          <View style={styles.calorieInfo}>
            <Text style={styles.calorieLeftValue}>
              {Math.round(caloriesLeft)}
            </Text>
            <Text style={styles.calorieLeftLabel}>
              Calories <Text style={styles.boldText}>left</Text>
            </Text>
          </View>
          <View style={styles.ringWrapper}>
            <ProgressRing
              size={110}
              progress={calorieProgress}
              color="#111"
              trackColor="#f0f0f4"
              strokeWidth={14}>
              <View style={styles.ringCenter}>
                <Ionicons name="flame" size={32} color="#111" />
              </View>
            </ProgressRing>
          </View>
        </View>

        {/* Macros & Health Score Carousel */}
        <View>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.carouselContainer}>
            <View style={styles.slide}>
              <View style={styles.macroRow}>
                <MacroSmallCard
                  value={Math.max(goals.proteinGoal - displayProtein, 0)}
                  label="Protein left"
                  icon="drumstick-bite"
                  color="#e65c5c"
                  progress={displayProtein / (goals.proteinGoal || 150)}
                />
                <MacroSmallCard
                  value={Math.max(goals.carbsGoal - displayCarbs, 0)}
                  label="Carbs left"
                  icon="wheat"
                  color="#e89e5d"
                  progress={displayCarbs / (goals.carbsGoal || 200)}
                />
                <MacroSmallCard
                  value={Math.max(goals.fatGoal - displayFat, 0)}
                  label="Fats left"
                  icon="avocado"
                  color="#5a8bed"
                  progress={displayFat / (goals.fatGoal || 65)}
                />
              </View>
            </View>

            <View style={styles.slide}>
              <View style={styles.macroRow}>
                <MacroSmallCard
                  value={Math.max((goals.fiberGoal || 38) - displayFiber, 0)}
                  label="Fiber left"
                  icon="leaf"
                  color="#81c784"
                  progress={displayFiber / (goals.fiberGoal || 38)}
                />
                <MacroSmallCard
                  value={Math.max((goals.sugarGoal || 64) - displaySugar, 0)}
                  label="Sugar left"
                  icon="spoon"
                  color="#f06292"
                  progress={displaySugar / (goals.sugarGoal || 64)}
                />
                <MacroSmallCard
                  value={Math.max(
                    (goals.sodiumGoal || 2300) - displaySodium,
                    0,
                  )}
                  label="Sodium left"
                  unit="mg"
                  icon="shaker"
                  color="#ba68c8"
                  progress={displaySodium / (goals.sodiumGoal || 2300)}
                />
              </View>
            </View>

            <View style={styles.slide}>
              <View style={styles.healthScoreCard}>
                <View style={styles.healthHeader}>
                  <Text style={styles.healthTitle}>Health score</Text>
                  <Text style={styles.healthValue}>{healthData.score}/10</Text>
                </View>
                <View style={styles.healthBarTrack}>
                  <View
                    style={[
                      styles.healthBarFill,
                      { width: `${healthData.percent}%` },
                    ]}
                  />
                </View>
                <Text style={styles.healthFeedback}>
                  Keep logging your meals! The more accurately you log protein
                  and macros, the higher your health score will be.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.paginationDots}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeSlide === i ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Recently uploaded */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently uploaded</Text>

          {/* Analyzing Card */}
          {isAnalyzing && (
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
                    <ProgressRing
                      progress={analyzingPercent / 100}
                      size={48}
                      strokeWidth={4}
                      color="#fff"
                      trackColor="rgba(255,255,255,0.3)">
                      <Text
                        style={[styles.analyzingPercent, { color: "#fff" }]}>
                        {analyzingPercent}%
                      </Text>
                    </ProgressRing>
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

          {selectedEntries.length > 0 && !isAnalyzing ? (
            <View style={{ gap: 12 }}>
              {selectedEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  style={styles.recentItem}
                  onPress={() =>
                    router.push({
                      pathname: "/scan-result",
                      params: { entryId: entry.id },
                    })
                  }>
                  <View style={styles.recentImagePlaceholder}>
                    {entry.imageUri ? (
                      <Image
                        source={{ uri: entry.imageUri }}
                        style={styles.recentImage}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="food-apple"
                        size={24}
                        color="#999"
                      />
                    )}
                  </View>
                  <View style={styles.recentTextContainer}>
                    <Text style={{ fontWeight: "700", fontSize: 16 }}>
                      {entry.name}
                    </Text>
                    <Text style={{ color: "#777", fontSize: 12 }}>
                      {entry.calories} kcal • {entry.meal || "Meal"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </Pressable>
              ))}
            </View>
          ) : isAnalyzing ? null : (
            <View style={styles.recentEmptyContainer}>
              <View style={styles.recentEmptyStack}>
                <View style={styles.recentEmptyCardLayer3} />
                <View style={styles.recentEmptyCardLayer2} />
                <View style={styles.recentEmptyCardTop}>
                  <View style={styles.recentEmptyImageWrapper}>
                    <Text style={styles.recentEmptyEmoji}>🥗</Text>
                  </View>
                  <View style={styles.recentEmptyTextContainer}>
                    <View style={styles.emptyPlaceholderLineLarge} />
                    <View style={styles.emptyPlaceholderLineSmall} />
                  </View>
                </View>
              </View>
              <Text style={styles.recentEmptyText}>
                Tap scanner to add your first meal of the day
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* --- Custom Custom UI Streak Toast --- */}
      <Animated.View style={[styles.customStreakToast, { transform: [{ translateY: streakSlideAnim }] }]}>
        <View style={styles.cstLeft}>
          <Text style={styles.cstTitle}>{currentStreak} Day streak</Text>
          <View style={styles.cstWeekRow}>
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const letter = ["S", "M", "T", "W", "T", "F", "S"][i];
              const dateStr = d.toISOString().split("T")[0];
              const hasLog = last7Days.some(
                (log) => log?.date === dateStr && (log?.entries?.length || 0) > 0
              );
              
              return (
                <View key={i} style={styles.cstDayCol}>
                  <Text style={[styles.cstDayLetter, isToday && { color: "#e89e5d" }]}>{letter}</Text>
                  <View style={[styles.cstDayCircle, hasLog && { backgroundColor: "#e89e5d" }]}>
                    {hasLog && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.cstRight}>
          <View style={styles.cstFlameContainer}>
            <Ionicons name="sparkles" size={18} color="#FDE047" style={styles.cstSparkleLeft} />
            <Ionicons name="sparkles" size={14} color="#FBBF24" style={styles.cstSparkleRight} />
            <Ionicons name="flame" size={76} color="#e89e5d" />
            <View style={styles.cstRightBadge}>
              <Text style={styles.cstRightNumber}>{currentStreak}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function MacroSmallCard({
  value,
  label,
  icon,
  color,
  progress,
  unit = "g",
}: any) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroValueText}>
        {Math.round(value)}
        {unit}
      </Text>
      <Text style={styles.macroLabelText}>
        {label.split(" ")[0]} <Text style={styles.lightText}>left</Text>
      </Text>
      <View style={styles.macroRingWrapper}>
        <ProgressRing
          size={56}
          progress={Math.min(progress, 1)}
          color={color}
          trackColor="#f0f0f4"
          strokeWidth={6}>
          <View style={styles.macroIconCenter}>
            {icon === "drumstick-bite" && (
              <FontAwesome5 name="drumstick-bite" size={18} color={color} />
            )}
            {icon === "wheat" && (
              <MaterialCommunityIcons name="barley" size={22} color={color} />
            )}
            {icon === "avocado" && (
              <MaterialCommunityIcons name="peanut" size={22} color={color} />
            )}
            {icon === "leaf" && (
              <Ionicons name="leaf" size={18} color={color} />
            )}
            {icon === "spoon" && (
              <MaterialCommunityIcons
                name="spoon-sugar"
                size={22}
                color={color}
              />
            )}
            {icon === "shaker" && (
              <MaterialCommunityIcons
                name="shaker-outline"
                size={22}
                color={color}
              />
            )}
          </View>
        </ProgressRing>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fcfcff" },
  scrollContent: { paddingHorizontal: 0, gap: 24 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  logoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
  },
  streakPill: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  dateSelector: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    gap: 5,
  },
  dateItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 62,
    height: 90,
    borderRadius: 20,
  },
  dateItemActive: {
    backgroundColor: "#ffffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dateItemToday: {
    backgroundColor: "rgba(255, 255, 255, 0.69)",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  dayNameActive: {
    color: "#888",
    fontWeight: "500",
  },
  dateCircle: {
    width: 42,
    height: 42,
    borderRadius: 1023,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCircleActive: {
    borderWidth: 2,
    borderColor: "#444",
  },
  dateCircleDashed: {
    borderWidth: 2,
    borderColor: "#999",
    borderStyle: "dashed",
  },
  dateNum: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },
  dateNumActive: {
    color: "#111",
  },

  mainCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  calorieInfo: {
    flex: 1,
  },
  calorieLeftValue: {
    fontSize: 45,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -1,
  },
  calorieLeftLabel: {
    fontSize: 18,
    color: "#111",
    fontWeight: "500",
    marginTop: -4,
  },
  boldText: {
    fontWeight: "800",
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  carouselContainer: {
    width: SCREEN_WIDTH,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f8f8fa",
  },
  macroValueText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },
  macroLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#111",
    marginTop: 2,
    marginBottom: 16,
  },
  lightText: {
    fontWeight: "400",
    color: "#888",
  },
  macroRingWrapper: {
    alignItems: "center",
  },
  macroIconCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  healthScoreCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  healthValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  healthBarTrack: {
    height: 6,
    backgroundColor: "#f0f0f4",
    borderRadius: 3,
    marginBottom: 8,
  },
  healthBarFill: {
    height: "100%",
    backgroundColor: "#111",
    borderRadius: 3,
  },
  healthFeedback: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    fontWeight: "400",
  },

  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#111",
  },
  dotInactive: {
    backgroundColor: "#e0e0e0",
  },

  recentSection: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginBottom: 20,
  },
  recentItem: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f8f8fa",
  },
  recentImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#f5f5f7",
    overflow: "hidden",
  },
  recentImage: {
    width: "100%",
    height: "100%",
  },
  recentTextContainer: {
    flex: 1,
    gap: 8,
  },
  emptyPlaceholderLineLarge: {
    width: "90%",
    height: 8,
    backgroundColor: "#e8e8ed",
    borderRadius: 4,
  },
  emptyPlaceholderLineSmall: {
    width: "60%",
    height: 8,
    backgroundColor: "#e8e8ed",
    borderRadius: 4,
  },
  recentEmptyContainer: {
    backgroundColor: "#f9fafd",
    borderRadius: 24,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: "center",
  },
  recentEmptyStack: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
    position: "relative",
  },
  recentEmptyCardTop: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
    width: "85%",
    zIndex: 3,
    borderWidth: 1,
    borderColor: "#f8f8fa",
  },
  recentEmptyCardLayer2: {
    position: "absolute",
    bottom: -8,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: "100%",
    width: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
    borderWidth: 1,
    borderColor: "#f0f0f4",
  },
  recentEmptyCardLayer3: {
    position: "absolute",
    bottom: -16,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: "100%",
    width: "65%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 1,
    borderWidth: 1,
    borderColor: "#f0f0f4",
  },
  recentEmptyImageWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    backgroundColor: "#fff",
    borderRadius: 30,
  },
  recentEmptyEmoji: {
    fontSize: 44,
  },
  recentEmptyTextContainer: {
    flex: 1,
    gap: 14,
  },
  recentEmptyText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  // Analyzing Card
  analyzingCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f5",
  },
  analyzingContent: { flexDirection: "row", gap: 16, alignItems: "center" },
  analyzingImageContainer: { position: "relative", width: 72, height: 72 },
  analyzingImage: { width: 72, height: 72, borderRadius: 16 },
  analyzingImagePlaceholder: { width: 72, height: 72, borderRadius: 16 },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingPercent: { fontSize: 12, fontWeight: "700" },
  analyzingTextContainer: { flex: 1, gap: 6 },
  analyzingTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  skeletonBars: { gap: 6, marginVertical: 4 },
  skeletonLine: { height: 6, borderRadius: 3, width: "90%" },
  skeletonRow: { flexDirection: "row", gap: 6 },
  skeletonLineShort: { flex: 1, height: 6, borderRadius: 3 },
  analyzingSubtext: { fontSize: 12, color: "#888", fontWeight: "500" },

  // Custom Streak Toast UI
  customStreakToast: {
    position: "absolute",
    top: 0, 
    alignSelf: "center",
    width: "92%",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 28,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 9999,
  },
  cstLeft: {
    flex: 1,
    paddingRight: 10,
    justifyContent: "center",
  },
  cstTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "#e89e5d",
    marginBottom: 16,
  },
  cstWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 20,
  },
  cstDayCol: {
    alignItems: "center",
  },
  cstDayLetter: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  cstDayCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  cstRight: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  cstFlameContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cstSparkleLeft: {
    position: "absolute",
    top: -5,
    left: -15,
  },
  cstSparkleRight: {
    position: "absolute",
    top: 5,
    right: -10,
  },
  cstRightBadge: {
    position: "absolute",
    bottom: 8,
    width: 28,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#e89e5d",
    alignItems: "center",
    justifyContent: "center",
  },
  cstRightNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#e89e5d",
  },
});
