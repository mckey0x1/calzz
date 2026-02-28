import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Image,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { LinearGradient } from "expo-linear-gradient";

const MOCK_SCAN = {
  name: "Turkey Sandwich With Potato Chips",
  calories: 460,
  carbs: 45,
  protein: 25,
  fat: 20,
  score: 7,
  time: "2:10 PM",
  image:
    "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?auto=format&fit=crop&q=80&w=1000",
};

export default function ScanResultScreen() {
  const colors = useThemeColors("light");
  const insets = useSafeAreaInsets();
  const { addFoodEntry, scanResult } = useNutrition();

  const currentScan = scanResult || MOCK_SCAN;

  const [quantity, setQuantity] = useState(1);

  function handleSave() {
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addFoodEntry({
      name: currentScan.name,
      calories: currentScan.calories * quantity,
      protein: currentScan.protein * quantity,
      carbs: currentScan.carbs * quantity,
      fat: currentScan.fat * quantity,
      meal: "lunch",
      confidence: 95,
      imageUri: currentScan.image,
    });
    // Let's assume going back returns to dashboard where it's saved.
    router.replace("/(tabs)");
  }

  function handleClose() {
    router.back();
  }

  function modifyQuantity(amount: number) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setQuantity((prev) => Math.max(1, prev + amount));
  }

  const MacroCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: string;
    color: string;
  }) => (
    <View style={styles.macroCard}>
      <View style={styles.macroCardContent}>
        <View style={[styles.macroIconBg, { backgroundColor: color + "15" }]}>
          {icon}
        </View>
        <View style={styles.macroTextCol}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>{value}</Text>
        </View>
      </View>
      <Ionicons
        name="pencil"
        size={12}
        color="#9CA3AF"
        style={styles.editIcon}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background Image Header */}
      <ImageBackground
        source={{ uri: currentScan.image }}
        style={styles.imageBackground}
        resizeMode="cover">
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.headerBtn} onPress={handleClose}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <Pressable style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </Pressable>
        </View>
      </ImageBackground>

      {/* Bottom Sheet Overlay */}
      <View style={styles.bottomSheetWrapper}>
        <ScrollView
          style={styles.bottomSheet}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.timeText}>{currentScan.time}</Text>

          <View style={styles.titleRow}>
            <Text style={styles.foodTitle}>{currentScan.name}</Text>
            <View style={styles.quantityPicker}>
              <Pressable
                onPress={() => modifyQuantity(-1)}
                style={styles.qtyBtn}>
                <Ionicons name="remove" size={20} color={colors.text} />
              </Pressable>
              <Text style={styles.qtyText}>{quantity}</Text>
              <Pressable
                onPress={() => modifyQuantity(1)}
                style={styles.qtyBtn}>
                <Ionicons name="add" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.macrosGrid}>
            <MacroCard
              icon={<Ionicons name="flame" size={16} color="#000" />}
              label="Calories"
              value={String(currentScan.calories * quantity)}
              color="#000000"
            />
            <MacroCard
              icon={<Ionicons name="pizza" size={16} color="#E8A35A" />}
              label="Carbs"
              value={`${currentScan.carbs * quantity}g`}
              color="#E8A35A"
            />
            <MacroCard
              icon={<Ionicons name="fish" size={16} color="#EC7063" />}
              label="Protein"
              value={`${currentScan.protein * quantity}g`}
              color="#EC7063"
            />
            <MacroCard
              icon={<Ionicons name="water" size={16} color="#5DADE2" />}
              label="Fat"
              value={`${currentScan.fat * quantity}g`}
              color="#5DADE2"
            />
          </View>

          <View style={styles.healthScoreCard}>
            <View style={styles.healthScoreHeader}>
              <View
                style={[
                  styles.macroIconBg,
                  { backgroundColor: "#D7BDE2" + "30" },
                ]}>
                <Ionicons name="heart" size={16} color="#A569BD" />
              </View>
              <Text style={styles.healthScoreLabel}>Health Score</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.healthScoreValue}>
                {currentScan.score}/10
              </Text>
            </View>
            <View style={styles.healthScoreBarBg}>
              <View
                style={[
                  styles.healthScoreBarFill,
                  { width: `${currentScan.score * 10}%` },
                ]}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable style={styles.fixButton}>
            <Ionicons name="color-wand" size={18} color={colors.text} />
            <Text style={styles.fixButtonText}>Fix Results</Text>
          </Pressable>
          <Pressable style={styles.doneButton} onPress={handleSave}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageBackground: {
    width: "100%",
    height: "55%", // Takes up top half
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  bottomSheetWrapper: {
    flex: 1,
    marginTop: -40, // overlap the image
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    gap: 16,
  },
  foodTitle: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#111",
    lineHeight: 30,
  },
  quantityPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 100,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginHorizontal: 8,
    minWidth: 16,
    textAlign: "center",
  },
  macrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  macroCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  macroCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  macroIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  macroTextCol: {
    justifyContent: "center",
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: "#111",
  },
  editIcon: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  healthScoreCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  healthScoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  healthScoreLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#111",
  },
  healthScoreValue: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: "#111",
  },
  healthScoreBarBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  healthScoreBarFill: {
    height: "100%",
    backgroundColor: "#9ac255", // Using the tint green
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 16,
  },
  fixButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  fixButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#111",
  },
  doneButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: "#111",
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#fff",
  },
});
