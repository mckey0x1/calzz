import React, { useEffect } from "react";
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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { useAuth } from "@/lib/auth-context";
import { useNutrition } from "@/lib/nutrition-context";

// Simple Progress Ring component for inline usage
function ProgressRing({ size, progress, color, trackColor, strokeWidth, children }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
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

  useEffect(() => {
    if (!isAnalyzing && scanResult) {
      router.push("/scan-result");
    }
  }, [isAnalyzing, scanResult]);

  const progress = Math.min((totalCalories || 0) / (goals.dailyCalories || 2500), 1);
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  // Mock days for the date strip
  const days = [
    { day: "Sun", date: "10", state: "past" },
    { day: "Mon", date: "11", state: "past" },
    { day: "Tue", date: "12", state: "completed" },
    { day: "Wed", date: "13", state: "active" },
    { day: "Thu", date: "14", state: "future" },
    { day: "Fri", date: "15", state: "future" },
    { day: "Sat", date: "16", state: "future" },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fefaf7", "#fcfcfd", "#f8f9fa"]}
        locations={[0, 0.2, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 20,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.logoAndTitle}>
            <Ionicons name="logo-apple" size={24} color="#111" />
            <Text style={styles.appTitle}>Calzz</Text>
          </View>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={16} color="#FF9F1C" />
            <Text style={styles.streakCount}>15</Text>
          </View>
        </View>

        {/* Date Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {days.map((d, index) => {
            let circleStyle = styles.dateCirclePast;
            let textStyle = styles.dateTextPast;
            let dayTextStyle = styles.dayTextPast;
            let wrapperStyle = styles.dateItemWrapper;

            if (d.state === "completed") {
              circleStyle = styles.dateCircleCompleted;
              textStyle = styles.dateTextCompleted;
              dayTextStyle = styles.dayTextCompleted;
            } else if (d.state === "active") {
              circleStyle = styles.dateCircleActive;
              textStyle = styles.dateTextActive;
              dayTextStyle = styles.dayTextActive;
              wrapperStyle = [styles.dateItemWrapper, styles.dateItemWrapperActive];
            } else if (d.state === "future") {
              circleStyle = styles.dateCircleFuture;
              textStyle = styles.dateTextFuture;
              dayTextStyle = styles.dayTextFuture;
            }

            return (
              <View key={index} style={wrapperStyle}>
                <Text style={dayTextStyle}>{d.day}</Text>
                <View style={[styles.dateCircle, circleStyle]}>
                  <Text style={textStyle}>{d.date}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Main Calorie Ring Card */}
        <View style={styles.mainCalorieCard}>
          <View style={styles.calorieTextContainer}>
            <View style={styles.calorieValues}>
              <Text style={styles.calorieEaten}>{totalCalories || 1250}</Text>
              <Text style={styles.calorieGoal}>/{goals.dailyCalories || 2500}</Text>
            </View>
            <Text style={styles.calorieSubtitle}>Calories eaten</Text>
          </View>
          <View style={styles.calorieRingContainer}>
            <ProgressRing
              size={120}
              progress={totalCalories / goals.dailyCalories || 0.5}
              color="#1a1a1c"
              trackColor="#f0f0f4"
              strokeWidth={12}>
              <View style={styles.ringCenter}>
                <Ionicons name="flame" size={28} color="#1a1a1c" />
              </View>
            </ProgressRing>
          </View>
        </View>

        {/* Macros Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.macrosScroll}>
          <View style={styles.macroCard}>
            <View style={styles.macroTextHeader}>
              <Text style={styles.macroVal}>{totalProtein || 75}</Text>
              <Text style={styles.macroGoal}>/{goals.proteinGoal || 150}g</Text>
            </View>
            <Text style={styles.macroLabel}>Protein eaten</Text>
            <View style={styles.macroRingWrapper}>
              <ProgressRing size={64} progress={(totalProtein || 75)/(goals.proteinGoal || 150)} color="#e65c5c" trackColor="#f5f5f5" strokeWidth={5}>
                <View style={styles.macroIconCenter}>
                  <FontAwesome5 name="drumstick-bite" size={20} color="#e65c5c" />
                </View>
              </ProgressRing>
            </View>
          </View>

          <View style={styles.macroCard}>
            <View style={styles.macroTextHeader}>
              <Text style={styles.macroVal}>{totalCarbs || 138}</Text>
              <Text style={styles.macroGoal}>/{goals.carbsGoal || 275}g</Text>
            </View>
            <Text style={styles.macroLabel}>Carbs eaten</Text>
            <View style={styles.macroRingWrapper}>
              <ProgressRing size={64} progress={(totalCarbs || 138)/(goals.carbsGoal || 275)} color="#e89e5d" trackColor="#f5f5f5" strokeWidth={5}>
                <View style={styles.macroIconCenter}>
                  <MaterialCommunityIcons name="barley" size={24} color="#e89e5d" />
                </View>
              </ProgressRing>
            </View>
          </View>

          <View style={styles.macroCard}>
            <View style={styles.macroTextHeader}>
              <Text style={styles.macroVal}>{totalFat || 35}</Text>
              <Text style={styles.macroGoal}>/{goals.fatGoal || 70}g</Text>
            </View>
            <Text style={styles.macroLabel}>Fat eaten</Text>
            <View style={styles.macroRingWrapper}>
              <ProgressRing size={64} progress={(totalFat || 35)/(goals.fatGoal || 70)} color="#5a8bed" trackColor="#f5f5f5" strokeWidth={5}>
                <View style={styles.macroIconCenter}>
                  <MaterialCommunityIcons name="peanut" size={22} color="#5a8bed" />
                </View>
              </ProgressRing>
            </View>
          </View>
        </ScrollView>
        
        {/* Pagination Dots indicating swiping for macros (visual only) */}
        <View style={styles.paginationDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
        </View>

        {/* Recently Uploaded Section */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently uploaded</Text>
          
          <Pressable style={styles.recentCard} onPress={() => router.push('/food-log')}>
            <Image 
              source={{uri: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600&auto=format&fit=crop"}} 
              style={styles.recentImage} 
            />
            <View style={styles.recentDetails}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Grilled Salmon</Text>
                <Text style={styles.recentTime}>12:37pm</Text>
              </View>
              
              <View style={styles.recentStats}>
                <Ionicons name="flame" size={14} color="#111" />
                <Text style={styles.recentCalories}>550 Calories</Text>
              </View>
              
              <View style={styles.recentMacrosRow}>
                <View style={styles.recentMacroItem}>
                  <FontAwesome5 name="drumstick-bite" size={10} color="#e65c5c" />
                  <Text style={styles.recentMacroText}>35g</Text>
                </View>
                <View style={styles.recentMacroItem}>
                  <MaterialCommunityIcons name="barley" size={12} color="#e89e5d" />
                  <Text style={styles.recentMacroText}>40g</Text>
                </View>
                <View style={styles.recentMacroItem}>
                  <Ionicons name="water" size={12} color="#5a8bed" />
                  <Text style={styles.recentMacroText}>28g</Text>
                </View>
              </View>
            </View>
          </Pressable>

          {/* Placeholder for a second card partially visible */ }
           <View style={[styles.recentCard, { opacity: 0.5, marginBottom: 0 }]}>
            <View style={[styles.recentImage, { backgroundColor: '#e0e0e0' }]} />
            <View style={styles.recentDetails}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Avocado Toast</Text>
                <Text style={styles.recentTime}>9:45am</Text>
              </View>
            </View>
          </View>

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 0, gap: 20 },
  
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    letterSpacing: -0.5,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },

  dateStrip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    alignItems: "flex-end", // Align circles at bottom if needed
  },
  dateItemWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
  },
  dateItemWrapperActive: {
    backgroundColor: "#f7f7f9",
  },
  dayTextPast: { fontSize: 13, fontWeight: "600", color: "#b0b0b0", marginBottom: 8 },
  dayTextCompleted: { fontSize: 13, fontWeight: "600", color: "#a5d89b", marginBottom: 8 },
  dayTextActive: { fontSize: 13, fontWeight: "700", color: "#111", marginBottom: 8 },
  dayTextFuture: { fontSize: 13, fontWeight: "600", color: "#ccc", marginBottom: 8 },
  
  dateCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  dateCirclePast: { borderColor: "#d8d8d8", borderStyle: "dashed" },
  dateCircleCompleted: { borderColor: "#2fb344", borderStyle: "solid" },
  dateCircleActive: { borderColor: "#111", borderStyle: "solid", borderWidth: 2 },
  dateCircleFuture: { borderColor: "#eee", borderStyle: "solid", backgroundColor: "#f9f9fb" },

  dateTextPast: { fontSize: 16, fontWeight: "600", color: "#b0b0b0" },
  dateTextCompleted: { fontSize: 16, fontWeight: "600", color: "#111" },
  dateTextActive: { fontSize: 16, fontWeight: "700", color: "#111" },
  dateTextFuture: { fontSize: 16, fontWeight: "600", color: "#ccc" },

  mainCalorieCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
    marginTop: 10,
  },
  calorieTextContainer: {
    flex: 1,
  },
  calorieValues: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  calorieEaten: {
    fontSize: 48,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -1,
  },
  calorieGoal: {
    fontSize: 18,
    fontWeight: "500",
    color: "#999",
  },
  calorieSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#888",
    marginTop: 4,
  },
  calorieRingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  macrosScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  macroCard: {
    width: 140,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f8f8f8",
  },
  macroTextHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  macroVal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  macroGoal: {
    fontSize: 12,
    fontWeight: "500",
    color: "#aaa",
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#aaa",
    marginTop: 2,
    marginBottom: 16,
  },
  macroRingWrapper: {
    alignItems: "center",
  },
  macroIconCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: -4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#111",
  },
  dotInactive: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  recentSection: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  recentCard: {
    flexDirection: "row",
    backgroundColor: "#fcfcff",
    borderRadius: 20,
    padding: 12,
    gap: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f4",
  },
  recentImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  recentDetails: {
    flex: 1,
    justifyContent: "center",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  recentTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999",
  },
  recentStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  recentCalories: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  recentMacrosRow: {
    flexDirection: "row",
    gap: 12,
  },
  recentMacroItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentMacroText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
  },

});
