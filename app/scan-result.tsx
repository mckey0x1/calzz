import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { GlassCard } from "@/components/GlassCard";
import { CalorieRing } from "@/components/CalorieRing";

const MOCK_SCAN = {
  name: "Grilled Chicken Salad",
  confidence: 92,
  calories: 420,
  protein: 38,
  carbs: 15,
  fat: 22,
  fiber: 5,
  sugar: 4,
  sodium: 580,
};

export default function ScanResultScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { addFoodEntry } = useNutrition();

  const [foodName, setFoodName] = useState(MOCK_SCAN.name);
  const [calories, setCalories] = useState(String(MOCK_SCAN.calories));
  const [protein, setProtein] = useState(String(MOCK_SCAN.protein));
  const [carbs, setCarbs] = useState(String(MOCK_SCAN.carbs));
  const [fat, setFat] = useState(String(MOCK_SCAN.fat));
  const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");

  function handleSave() {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addFoodEntry({
      name: foodName,
      calories: parseInt(calories, 10) || 0,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
      meal: selectedMeal,
      confidence: MOCK_SCAN.confidence,
    });
    router.back();
  }

  function handleClose() {
    router.back();
  }

  const meals = [
    { key: "breakfast" as const, icon: "sunny-outline" as const, label: "Breakfast" },
    { key: "lunch" as const, icon: "partly-sunny-outline" as const, label: "Lunch" },
    { key: "dinner" as const, icon: "moon-outline" as const, label: "Dinner" },
    { key: "snack" as const, icon: "cafe-outline" as const, label: "Snack" },
  ];

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 16,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Scan Result</Text>
          <View style={{ width: 28 }} />
        </View>

        <GlassCard style={styles.imagePreview}>
          <LinearGradient
            colors={[
              colorScheme === "dark" ? "rgba(139,124,247,0.2)" : "rgba(108,92,231,0.1)",
              colorScheme === "dark" ? "rgba(0,217,165,0.15)" : "rgba(0,184,148,0.08)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="image" size={48} color={colors.tint} />
          <Text style={[styles.previewText, { color: colors.textSecondary }]}>AI Food Recognition</Text>
          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceBadge, { backgroundColor: colors.accentEmerald + "20" }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.accentEmerald} />
              <Text style={[styles.confidenceText, { color: colors.accentEmerald }]}>
                {MOCK_SCAN.confidence}% confidence
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Food Name</Text>
          <TextInput
            style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="Enter food name"
            placeholderTextColor={colors.textTertiary}
          />
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Category</Text>
        <View style={styles.mealRow}>
          {meals.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => {
                setSelectedMeal(m.key);
                if (Platform.OS !== "web") Haptics.selectionAsync();
              }}
              style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
            >
              <GlassCard
                style={[
                  styles.mealCard,
                  selectedMeal === m.key && { borderColor: colors.tint, borderWidth: 2 },
                ]}
              >
                <Ionicons
                  name={m.icon}
                  size={20}
                  color={selectedMeal === m.key ? colors.tint : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.mealLabel,
                    { color: selectedMeal === m.key ? colors.tint : colors.textSecondary },
                  ]}
                >
                  {m.label}
                </Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrition</Text>
        <GlassCard>
          <View style={styles.calorieCenter}>
            <CalorieRing
              progress={0.65}
              size={100}
              strokeWidth={8}
              color={colors.tint}
              trackColor={colors.progressRingBg}
            >
              <TextInput
                style={[styles.calInput, { color: colors.text }]}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
              <Text style={[styles.calLabel, { color: colors.textTertiary }]}>cal</Text>
            </CalorieRing>
          </View>

          <View style={styles.macroGrid}>
            <NutrientInput label="Protein" value={protein} onChange={setProtein} unit="g" color={colors.proteinColor} colors={colors} />
            <NutrientInput label="Carbs" value={carbs} onChange={setCarbs} unit="g" color={colors.carbsColor} colors={colors} />
            <NutrientInput label="Fat" value={fat} onChange={setFat} unit="g" color={colors.fatColor} colors={colors} />
          </View>

          <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <DetailItem label="Fiber" value={`${MOCK_SCAN.fiber}g`} colors={colors} />
            <DetailItem label="Sugar" value={`${MOCK_SCAN.sugar}g`} colors={colors} />
            <DetailItem label="Sodium" value={`${MOCK_SCAN.sodium}mg`} colors={colors} />
          </View>
        </GlassCard>

        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <LinearGradient
            colors={[colors.tint, colors.accentEmerald]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            <Ionicons name="checkmark" size={22} color="#fff" />
            <Text style={styles.saveText}>Add to Food Log</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function NutrientInput({
  label,
  value,
  onChange,
  unit,
  color,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  color: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={nutrientStyles.container}>
      <View style={[nutrientStyles.dot, { backgroundColor: color }]} />
      <Text style={[nutrientStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={nutrientStyles.inputRow}>
        <TextInput
          style={[nutrientStyles.input, { color: colors.text, borderColor: color + "40" }]}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
        />
        <Text style={[nutrientStyles.unit, { color: colors.textTertiary }]}>{unit}</Text>
      </View>
    </View>
  );
}

function DetailItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={detailStyles.item}>
      <Text style={[detailStyles.label, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

const nutrientStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 12, fontFamily: "DMSans_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  input: {
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    borderBottomWidth: 1.5,
    paddingVertical: 2,
    minWidth: 40,
    textAlign: "center",
  },
  unit: { fontSize: 13, fontFamily: "DMSans_400Regular" },
});

const detailStyles = StyleSheet.create({
  item: { flex: 1, alignItems: "center", gap: 2 },
  label: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  value: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  imagePreview: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    overflow: "hidden",
  },
  previewText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  confidenceRow: { marginTop: 4 },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  fieldLabel: { fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 6 },
  nameInput: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  sectionTitle: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  mealRow: { flexDirection: "row", gap: 8 },
  mealCard: { alignItems: "center", gap: 4, paddingVertical: 12 },
  mealLabel: { fontSize: 11, fontFamily: "DMSans_500Medium" },
  calorieCenter: { alignItems: "center", marginBottom: 20 },
  calInput: { fontSize: 24, fontFamily: "DMSans_700Bold", textAlign: "center", minWidth: 50 },
  calLabel: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: -2 },
  macroGrid: { flexDirection: "row", gap: 12 },
  detailDivider: { height: 1, marginVertical: 14 },
  detailRow: { flexDirection: "row" },
  saveButton: { marginTop: 8 },
  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveText: { fontSize: 16, fontFamily: "DMSans_700Bold", color: "#fff" },
});
