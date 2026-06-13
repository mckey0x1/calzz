import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Picker } from "react-native-wheel-pick";

import { useNutrition } from "@/lib/nutrition-context";
import { useThemeColors } from "@/constants/colors";

const ITEM_HEIGHT = 40;

function CustomPicker({ items, selectedValue, onValueChange, label }: any) {
  const pickerData = items.map((item: any) => `${item}${label ? ` ${label}` : ""}`);
  const selectedString = `${selectedValue}${label ? ` ${label}` : ""}`;

  return (
    <View style={[styles.pickerContainer, { justifyContent: "center", overflow: "hidden" }]}>
      <View style={[styles.selectionHighlight, { width: "100%", left: 0 }]} pointerEvents="none" />
      <Picker
        style={{ backgroundColor: "transparent", width: "100%", height: ITEM_HEIGHT * 5 }}
        selectedValue={selectedString}
        pickerData={pickerData}
        onValueChange={(value: string) => {
          const idx = pickerData.findIndex((p: string) => p === value);
          if (idx >= 0 && items[idx] !== selectedValue) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onValueChange(items[idx]);
          }
        }}
        textColor="#1A1A1A"
        textSize={20}
        isShowSelectBackground={false}
        isShowSelectLine={false}
      />
    </View>
  );
}

export default function SetGenderScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined);
  const { goals, updateGoals } = useNutrition();

  const [gender, setGender] = useState(goals.gender || "Male");

  const topInset = Platform.OS === "web" ? 40 : insets.top + 20;
  
  const handleBack = () => router.back();
  
  const handleSave = () => {
    updateGoals({ gender });
    router.back();
  };

  const genderItems = ["Male", "Female", "Other"];

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
        <Text style={styles.headerTitle}>Set Gender</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.columnLabel}>Gender</Text>
        <View style={styles.pickersRow}>
          <View style={styles.weightPicker}>
            <CustomPicker items={genderItems} selectedValue={gender} onValueChange={setGender} label="" />
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
    paddingVertical: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
