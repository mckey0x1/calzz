import React, { useEffect, useState, useRef } from "react";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Simple Progress Ring component for inline usage
function ProgressRing({
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
      <View style={StyleSheet.absoluteFillObject}>{children}</View>
    </View>
  );
}

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
    scanResult,
  } = useNutrition();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isAnalyzing && scanResult) {
      router.push("/scan-result");
    }
  }, [isAnalyzing, scanResult]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  // Generate last 30 days
  const getDays = () => {
    const dates = [];
    for (let i = 30; i >= -5; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const dates = getDays();

  const handleScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveSlide(slide);
  };

  const caloriesLeft = Math.max((goals.dailyCalories || 2500) - (totalCalories || 0), 0);
  const calorieProgress = Math.min((totalCalories || 0) / (goals.dailyCalories || 2500), 1);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fefaf7", "#fcfcfd", "#f8f9fa"]} 
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 10,
            paddingBottom: 120,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.logoAndTitle}>
            <Ionicons name="logo-apple" size={28} color="#111" />
            <Text style={styles.appTitle}>Cal AI</Text>
          </View>
          <View style={styles.streakPill}>
            <Text style={styles.streakCount}>🔥 0</Text>
          </View>
        </View>

        {/* Date Selector */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateSelector}>
            {dates.map((date, idx) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isFuture = date > new Date();
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              const dayNum = date.getDate();

              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedDate(date)}
                  style={[styles.dateItem, isSelected && styles.dateItemActive]}>
                  <Text style={[
                     styles.dayName, 
                     isSelected && styles.dayNameActive, 
                     isFuture && !isSelected && { opacity: 0.3 }
                  ]}>
                    {dayName}
                  </Text>
                  <View style={[
                    styles.dateCircle, 
                    isSelected ? styles.dateCircleActive : styles.dateCircleDashed,
                    isFuture && !isSelected && { opacity: 0.3 }
                  ]}>
                    <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{dayNum}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Calorie Card */}
        <View style={styles.mainCard}>
          <View style={styles.calorieInfo}>
            <Text style={styles.calorieLeftValue}>{Math.round(caloriesLeft)}</Text>
            <Text style={styles.calorieLeftLabel}>Calories <Text style={styles.boldText}>left</Text></Text>
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
                  value={`${goals.proteinGoal - totalProtein}g`} 
                  label="Protein left" 
                  icon="drumstick-bite" 
                  color="#e65c5c" 
                  progress={totalProtein / goals.proteinGoal}
                />
                <MacroSmallCard 
                  value={`${goals.carbsGoal - totalCarbs}g`} 
                  label="Carbs left" 
                  icon="wheat" 
                  color="#e89e5d" 
                  progress={totalCarbs / goals.carbsGoal}
                />
                <MacroSmallCard 
                  value={`${goals.fatGoal - totalFat}g`} 
                  label="Fats left" 
                  icon="avocado" 
                  color="#5a8bed" 
                  progress={totalFat / goals.fatGoal}
                />
              </View>
            </View>

            <View style={styles.slide}>
              <View style={styles.macroRow}>
                <MacroSmallCard 
                  value="38g" 
                  label="Fiber left" 
                  icon="leaf" 
                  color="#81c784" 
                  progress={0.2}
                />
                <MacroSmallCard 
                  value="64g" 
                  label="Sugar left" 
                  icon="spoon" 
                  color="#f06292" 
                  progress={0.5}
                />
                <MacroSmallCard 
                  value="2300mg" 
                  label="Sodium left" 
                  icon="shaker" 
                  color="#ba68c8" 
                  progress={0.1}
                />
              </View>
            </View>

            <View style={styles.slide}>
              <View style={styles.healthScoreCard}>
                <View style={styles.healthHeader}>
                  <Text style={styles.healthTitle}>Health score</Text>
                  <Text style={styles.healthValue}>0/10</Text>
                </View>
                <View style={styles.healthBarTrack}>
                  <View style={[styles.healthBarFill, { width: '0%' }]} />
                </View>
                <Text style={styles.healthFeedback}>
                  Carbs and fat are on track. You're low in calories and protein, which can slow weight loss and impact muscle retention.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.paginationDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, activeSlide === i ? styles.dotActive : styles.dotInactive]} />
            ))}
          </View>
        </View>

        {/* Recently uploaded */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently uploaded</Text>
          <View style={styles.recentItem}>
            <View style={styles.recentImagePlaceholder}>
               <Image 
                source={{ uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&auto=format&fit=crop" }} 
                style={styles.recentImage} 
               />
            </View>
            <View style={styles.recentTextContainer}>
              <View style={styles.placeholderLineLarge} />
              <View style={styles.placeholderLineSmall} />
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function MacroSmallCard({ value, label, icon, color, progress }: any) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroValueText}>{value}</Text>
      <Text style={styles.macroLabelText}>{label.split(' ')[0]} <Text style={styles.lightText}>left</Text></Text>
      <View style={styles.macroRingWrapper}>
        <ProgressRing
          size={56}
          progress={Math.min(progress, 1)}
          color={color}
          trackColor="#f0f0f4"
          strokeWidth={6}>
          <View style={styles.macroIconCenter}>
            {icon === "drumstick-bite" && <FontAwesome5 name="drumstick-bite" size={18} color={color} />}
            {icon === "wheat" && <MaterialCommunityIcons name="barley" size={22} color={color} />}
            {icon === "avocado" && <MaterialCommunityIcons name="peanut" size={22} color={color} />}
            {icon === "leaf" && <Ionicons name="leaf" size={18} color={color} />}
            {icon === "spoon" && <MaterialCommunityIcons name="spoon-sugar" size={22} color={color} />}
            {icon === "shaker" && <MaterialCommunityIcons name="shaker-outline" size={22} color={color} />}
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
    marginBottom: 8,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 16,
  },
  dateItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 62,
    height: 100,
    borderRadius: 24,
  },
  dateItemActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
  },
  dayNameActive: {
    color: "#888",
    fontWeight: "500",
  },
  dateCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    fontSize: 18,
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
    elevation: 4,
  },
  calorieInfo: {
    flex: 1,
  },
  calorieLeftValue: {
    fontSize: 52,
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
    fontSize: 19,
    fontWeight: "800",
    color: "#111",
  },
  macroLabelText: {
    fontSize: 13,
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
    elevation: 3,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  healthTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  healthValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },
  healthBarTrack: {
    height: 6,
    backgroundColor: "#f0f0f4",
    borderRadius: 3,
    marginBottom: 16,
  },
  healthBarFill: {
    height: "100%",
    backgroundColor: "#111",
    borderRadius: 3,
  },
  healthFeedback: {
    fontSize: 14,
    color: "#777",
    lineHeight: 22,
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
  placeholderLineLarge: {
    width: "80%",
    height: 12,
    backgroundColor: "#f0f0f4",
    borderRadius: 6,
  },
  placeholderLineSmall: {
    width: "60%",
    height: 10,
    backgroundColor: "#f0f0f4",
    borderRadius: 5,
  },
});
