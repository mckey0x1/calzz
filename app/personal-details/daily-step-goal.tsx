import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useNutrition } from "@/lib/nutrition-context";
import { useThemeColors } from "@/constants/colors";
import { CalorieRing } from "@/components/CalorieRing";

export default function SetDailyStepGoalScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined);
  const { goals, updateGoals } = useNutrition();

  const prevSteps =  10000;
  const [stepsStr, setStepsStr] = useState(prevSteps.toString());

  const topInset = Platform.OS === "web" ? 40 : insets.top + 20;

  const handleBack = () => router.back();

  const handleRevert = () => {
    setStepsStr(prevSteps.toString());
  };

  const handleSave = () => {
    const s = parseInt(stepsStr, 10);
    if (!isNaN(s) && s > 0) {
      // updateGoals({ stepsGoal: s });
      router.back();
    }
  };

  const stepsNum = parseInt(stepsStr, 10) || 0;
  const progress = isNaN(stepsNum) ? 0 : Math.min(stepsNum / prevSteps, 1);

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
      </View>

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Edit Step Goal</Text>

        <View style={styles.card}>
          <View style={styles.ringContainer}>
            <CalorieRing
              progress={progress}
              size={64}
              strokeWidth={4}
              color="#1A1A1A"
              trackColor="#EBEBEB">
              <Ionicons name="footsteps" size={24} color="#1A1A1A" />
            </CalorieRing>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardStepsText}>{stepsStr || "0"}</Text>
            <Text style={styles.cardPrevText}>
              Previous goal {prevSteps}
              {"\n"}steps
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Daily Step Goal</Text>
          <TextInput
            style={styles.textInput}
            value={stepsStr}
            onChangeText={setStepsStr}
            keyboardType="numeric"
            selectionColor="#1A1A1A"
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.revertBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleRevert}>
            <Text style={styles.revertBtnText}>Revert</Text>
          </Pressable>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  ringContainer: {
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardStepsText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  cardPrevText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#888",
    marginTop: 2,
    lineHeight: 20,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#888",
    marginBottom: 4,
  },
  textInput: {
    fontSize: 20,
    fontFamily: "Poppins_400Regular",
    color: "#1A1A1A",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  revertBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1A1A1A",
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: "center",
  },
  revertBtnText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  saveBtn: {
    flex: 1,
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
