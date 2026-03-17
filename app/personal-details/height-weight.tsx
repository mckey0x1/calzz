import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Animated } from "react-native";
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

export default function SetHeightWeightScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined);
  const { goals, updateGoals, updateWeight } = useNutrition();

  const [isImperial, setIsImperial] = useState(true);
  const [ft, setFt] = useState(goals.heightFt || 5);
  const [inch, setInch] = useState(goals.heightIn || 6);
  const [weight, setWeightState] = useState(goals.currentWeight || 120);

  const topInset = Platform.OS === "web" ? 20 : insets.top + 10;
  
  const handleBack = () => router.back();
  
  const handleSave = () => {
    updateGoals({ heightFt: ft, heightIn: inch });
    updateWeight(weight);
    router.back();
  };

  const feetItems = Array.from({ length: 6 }, (_, i) => i + 3); // 3 to 8
  const inchItems = Array.from({ length: 12 }, (_, i) => i); // 0 to 11
  const weightItems = Array.from({ length: 251 }, (_, i) => i + 50); // 50 to 300

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      {/* Header */}
      <View style={[styles.header, { marginTop: topInset }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: "#F7F7F7", opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Set Height & Weight</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Toggle Imperial / Metric */}
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleText, isImperial ? styles.toggleTextActive : styles.toggleTextInactive]}>Imperial</Text>
          <Pressable
            style={[styles.toggleSwitch, isImperial ? styles.switchImperial : styles.switchMetric]}
            onPress={() => setIsImperial(!isImperial)}
          >
            <View style={[styles.switchThumb, isImperial ? styles.thumbLeft : styles.thumbRight]} />
          </Pressable>
          <Text style={[styles.toggleText, !isImperial ? styles.toggleTextActive : styles.toggleTextInactive]}>Metric</Text>
        </View>

        {/* Labels */}
        <View style={styles.labelsRow}>
          <Text style={styles.columnLabel}>Height</Text>
          <Text style={styles.columnLabel}>Weight</Text>
        </View>

        {/* Pickers */}
        <View style={styles.pickersRow}>
          <View style={styles.heightPickers}>
            <CustomPicker items={feetItems} selectedValue={ft} onValueChange={setFt} label="ft" />
            <CustomPicker items={inchItems} selectedValue={inch} onValueChange={setInch} label="in" />
          </View>
          <View style={styles.weightPicker}>
            <CustomPicker items={weightItems} selectedValue={weight} onValueChange={setWeightState} label="lb" />
          </View>
        </View>
      </View>

      {/* Save Button */}
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
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    gap: 16,
  },
  toggleText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  toggleTextActive: { color: "#1A1A1A" },
  toggleTextInactive: { color: "#D3D3D3" },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E0E0E0",
    padding: 2,
    justifyContent: "center",
  },
  switchImperial: { },
  switchMetric: { },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
  },
  thumbLeft: { alignSelf: "flex-start" },
  thumbRight: { alignSelf: "flex-end" },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  columnLabel: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  pickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heightPickers: {
    flexDirection: "row",
    gap: 10,
  },
  weightPicker: {
    width: 120,
  },
  pickerContainer: {
    height: ITEM_HEIGHT * 5,
    width: 80,
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
    fontSize: 16,
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
