import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useNutrition } from "@/lib/nutrition-context";
import { useThemeColors } from "@/constants/colors";

const ITEM_HEIGHT = 40;

function CustomPicker({ items, selectedValue, onValueChange, label }: any) {
  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    const index = items.findIndex((i: any) => i === selectedValue);
    if (index >= 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, []);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (items[index] !== undefined && items[index] !== selectedValue) {
      onValueChange(items[index]);
    }
  };

  return (
    <View style={styles.pickerContainer}>
      <View style={styles.selectionHighlight} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        style={{ height: ITEM_HEIGHT * 5 }}
      >
        {items.map((item: any, idx: number) => {
          const isSelected = item === selectedValue;
          return (
            <View key={idx} style={styles.pickerItem}>
              <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                {item} {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function SetDailyStepGoalScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined);
  const { goals, updateGoals } = useNutrition();

  const [steps, setSteps] = useState(goals.stepsGoal || 10000);

  const topInset = Platform.OS === "web" ? 20 : insets.top + 10;
  
  const handleBack = () => router.back();
  
  const handleSave = () => {
    updateGoals({ stepsGoal: steps });
    router.back();
  };

  const stepsItems = Array.from({ length: 99 }, (_, i) => (i + 2) * 500); // 1000 to 50000

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
        <Text style={styles.headerTitle}>Set Step Goal</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.columnLabel}>Daily Step Goal</Text>
        <View style={styles.pickersRow}>
          <View style={styles.weightPicker}>
            <CustomPicker items={stepsItems} selectedValue={steps} onValueChange={setSteps} label="steps" />
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.8 : 1 }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save changes</Text>
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
    paddingHorizontal: 20,
    marginTop: 40,
    alignItems: "center"
  },
  columnLabel: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginBottom: 40
  },
  pickersRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  weightPicker: {
    width: 200,
  },
  pickerContainer: {
    height: ITEM_HEIGHT * 5,
    width: "100%",
    position: "relative",
  },
  selectionHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    zIndex: 0,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pickerItemText: {
    fontSize: 20,
    fontFamily: "Poppins_500Medium",
    color: "#C0C0C0",
  },
  pickerItemTextSelected: {
    color: "#1A1A1A",
    fontFamily: "Poppins_600SemiBold",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  saveBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
