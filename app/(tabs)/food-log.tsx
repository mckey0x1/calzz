import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useNutrition, FoodEntry } from "@/lib/nutrition-context";
import { GlassCard } from "@/components/GlassCard";

const MEAL_TABS = ["All", "Breakfast", "Lunch", "Dinner", "Snack"] as const;

const QUICK_ADD_FOODS = [
  { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Egg (boiled)", calories: 78, protein: 6, carbs: 1, fat: 5 },
  { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 4 },
  { name: "Brown Rice (cup)", calories: 216, protein: 5, carbs: 45, fat: 2 },
  { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: "Almonds (28g)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Oatmeal", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Sweet Potato", calories: 103, protein: 2, carbs: 24, fat: 0 },
  { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 1 },
  { name: "Protein Shake", calories: 120, protein: 24, carbs: 3, fat: 2 },
  { name: "Avocado (half)", calories: 120, protein: 1, carbs: 6, fat: 11 },
];

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

function getMealFromTime(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 20) return "dinner";
  return "snack";
}

export default function FoodLogScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const { todayLog, addFoodEntry, removeFoodEntry } = useNutrition();
  const [selectedTab, setSelectedTab] = useState(0);
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    let entries = todayLog.entries;
    if (selectedTab > 0) {
      const meal = MEAL_TABS[selectedTab].toLowerCase() as MealType;
      entries = entries.filter((e) => e.meal === meal);
    }
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }, [todayLog.entries, selectedTab]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return QUICK_ADD_FOODS.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  function handleQuickAdd(food: (typeof QUICK_ADD_FOODS)[0]) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addFoodEntry({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      meal: getMealFromTime(),
    });
    setSearch("");
  }

  function handleRemoveEntry(entry: FoodEntry) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFoodEntry(entry.id);
  }

  function handleScanPress() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push("/scan-result");
  }

  const mealTotals = useMemo(() => {
    const totals: Record<string, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
    todayLog.entries.forEach((e) => {
      totals[e.meal] = (totals[e.meal] || 0) + e.calories;
    });
    return totals;
  }, [todayLog.entries]);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 16,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>Food Log</Text>

        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorder }]}>
          <Feather name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search foods..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {searchResults.length > 0 && (
          <GlassCard noPadding style={styles.searchResults}>
            {searchResults.map((food, i) => (
              <Pressable
                key={food.name}
                style={({ pressed }) => [
                  styles.searchResultItem,
                  i < searchResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleQuickAdd(food)}
              >
                <View style={styles.searchResultInfo}>
                  <Text style={[styles.searchResultName, { color: colors.text }]}>{food.name}</Text>
                  <Text style={[styles.searchResultMacros, { color: colors.textTertiary }]}>
                    P: {food.protein}g  C: {food.carbs}g  F: {food.fat}g
                  </Text>
                </View>
                <View style={styles.searchResultRight}>
                  <Text style={[styles.searchResultCal, { color: colors.tint }]}>{food.calories}</Text>
                  <Text style={[styles.searchResultCalLabel, { color: colors.textTertiary }]}>cal</Text>
                </View>
              </Pressable>
            ))}
          </GlassCard>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {MEAL_TABS.map((tab, i) => (
            <Pressable
              key={tab}
              onPress={() => {
                setSelectedTab(i);
                if (Platform.OS !== "web") Haptics.selectionAsync();
              }}
              style={[
                styles.tab,
                selectedTab === i
                  ? { backgroundColor: colors.tint }
                  : { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorder, borderWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === i ? "#fff" : colors.textSecondary },
                ]}
              >
                {tab}
                {i > 0 && mealTotals[tab.toLowerCase()] > 0
                  ? ` (${mealTotals[tab.toLowerCase()]})`
                  : ""}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {!search && (
          <View style={styles.quickAddSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Quick Add</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickAddRow}>
              {QUICK_ADD_FOODS.slice(0, 6).map((food) => (
                <Pressable
                  key={food.name}
                  onPress={() => handleQuickAdd(food)}
                  style={({ pressed }) => [
                    styles.quickChip,
                    { backgroundColor: colors.surfaceElevated, borderColor: colors.glassBorder, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={[styles.quickChipText, { color: colors.text }]}>{food.name}</Text>
                  <Text style={[styles.quickChipCal, { color: colors.tint }]}>{food.calories}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.entriesSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {selectedTab === 0 ? "Today's Entries" : MEAL_TABS[selectedTab]}
          </Text>
          {filteredEntries.length === 0 ? (
            <GlassCard>
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No entries yet. Search or scan to add food.
                </Text>
              </View>
            </GlassCard>
          ) : (
            filteredEntries.map((entry) => (
              <FoodEntryCard
                key={entry.id}
                entry={entry}
                colors={colors}
                onRemove={() => handleRemoveEntry(entry)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { transform: [{ scale: pressed ? 0.92 : 1 }] },
        ]}
        onPress={handleScanPress}
      >
        <LinearGradient
          colors={[colors.tint, colors.accentEmerald]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="camera" size={26} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function FoodEntryCard({
  entry,
  colors,
  onRemove,
}: {
  entry: FoodEntry;
  colors: ReturnType<typeof useThemeColors>;
  onRemove: () => void;
}) {
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const mealIcons: Record<string, string> = {
    breakfast: "sunny-outline",
    lunch: "partly-sunny-outline",
    dinner: "moon-outline",
    snack: "cafe-outline",
  };

  return (
    <GlassCard style={styles.entryCard}>
      <View style={styles.entryRow}>
        <View style={[styles.entryIcon, { backgroundColor: colors.tint + "15" }]}>
          <Ionicons name={mealIcons[entry.meal] as any} size={18} color={colors.tint} />
        </View>
        <View style={styles.entryInfo}>
          <Text style={[styles.entryName, { color: colors.text }]}>{entry.name}</Text>
          <Text style={[styles.entryTime, { color: colors.textTertiary }]}>
            {entry.meal.charAt(0).toUpperCase() + entry.meal.slice(1)} · {timeStr}
          </Text>
        </View>
        <View style={styles.entryRight}>
          <Text style={[styles.entryCal, { color: colors.text }]}>{entry.calories}</Text>
          <Text style={[styles.entryCalLabel, { color: colors.textTertiary }]}>cal</Text>
        </View>
        <Pressable onPress={onRemove} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
          <Feather name="x" size={16} color={colors.textTertiary} />
        </Pressable>
      </View>
      <View style={styles.entryMacros}>
        <Text style={[styles.macroText, { color: colors.proteinColor }]}>P: {entry.protein}g</Text>
        <Text style={[styles.macroText, { color: colors.carbsColor }]}>C: {entry.carbs}g</Text>
        <Text style={[styles.macroText, { color: colors.fatColor }]}>F: {entry.fat}g</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 28, fontFamily: "DMSans_700Bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    paddingVertical: 0,
  },
  searchResults: { maxHeight: 280 },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 15, fontFamily: "DMSans_500Medium" },
  searchResultMacros: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  searchResultRight: { alignItems: "flex-end" },
  searchResultCal: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  searchResultCalLabel: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  tabsScroll: { flexGrow: 0 },
  tabsContent: { gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  quickAddSection: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: "DMSans_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  quickAddRow: { gap: 8 },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: { fontSize: 13, fontFamily: "DMSans_500Medium" },
  quickChipCal: { fontSize: 12, fontFamily: "DMSans_600SemiBold" },
  entriesSection: { gap: 8 },
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyText: { fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center" },
  entryCard: { marginBottom: 0 },
  entryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  entryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  entryTime: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 1 },
  entryRight: { alignItems: "flex-end", marginRight: 8 },
  entryCal: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  entryCalLabel: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  entryMacros: { flexDirection: "row", gap: 16, marginTop: 8, paddingLeft: 48 },
  macroText: { fontSize: 12, fontFamily: "DMSans_500Medium" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    zIndex: 10,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C5CE7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
