import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";

import { useNutrition, UserGoals } from "@/lib/nutrition-context";
import { CalorieRing } from "@/components/CalorieRing";
import { useThemeColors } from "@/constants/colors";

function GoalInputCard({
  label,
  value,
  onChangeText,
  iconShape,
  ringColor,
  trackColor = "#F5F5F5",
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  iconShape: React.ReactNode;
  ringColor: string;
  trackColor?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<TextInput>(null);

  return (
    <View style={styles.goalCardWrapper}>
      <View style={styles.ringSide}>
        <CalorieRing
          progress={0.75}
          size={60}
          strokeWidth={6}
          color={ringColor}
          trackColor={trackColor}
        >
          {iconShape}
        </CalorieRing>
      </View>

      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputSide,
          isFocused ? styles.inputSideFocused : styles.inputSideUnfocused,
        ]}
      >
        <Text style={styles.inputLabelText}>{label}</Text>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor="#1A1A1A"
        />
      </Pressable>
    </View>
  );
}

export default function EditNutritionGoalsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined);
  const { goals, updateGoals } = useNutrition();

  const [caloriesStr, setCaloriesStr] = useState(goals.dailyCalories.toString());
  const [proteinStr, setProteinStr] = useState(goals.proteinGoal.toString());
  const [carbsStr, setCarbsStr] = useState(goals.carbsGoal.toString());
  const [fatStr, setFatStr] = useState(goals.fatGoal.toString());

  const [fiberStr, setFiberStr] = useState((goals.fiberGoal || 38).toString());
  const [sugarStr, setSugarStr] = useState((goals.sugarGoal || 64).toString());
  const [sodiumStr, setSodiumStr] = useState((goals.sodiumGoal || 2300).toString());

  React.useEffect(() => {
    setCaloriesStr(goals.dailyCalories?.toString() || "");
    setProteinStr(goals.proteinGoal?.toString() || "");
    setCarbsStr(goals.carbsGoal?.toString() || "");
    setFatStr(goals.fatGoal?.toString() || "");
    setFiberStr((goals.fiberGoal || 38).toString());
    setSugarStr((goals.sugarGoal || 64).toString());
    setSodiumStr((goals.sodiumGoal || 2300).toString());
  }, [
    goals.dailyCalories,
    goals.proteinGoal,
    goals.carbsGoal,
    goals.fatGoal,
    goals.fiberGoal,
    goals.sugarGoal,
    goals.sodiumGoal,
  ]);

  const [showMicros, setShowMicros] = useState(false);

  const topInset = Platform.OS === "web" ? 40 : insets.top + 20;

  const handleBack = () => {
    // Optionally we can auto-save on back, but let's just save.
    saveAndGoBack();
  };

  const saveAndGoBack = () => {
    updateGoals({
      dailyCalories: parseInt(caloriesStr) || goals.dailyCalories,
      proteinGoal: parseInt(proteinStr) || goals.proteinGoal,
      carbsGoal: parseInt(carbsStr) || goals.carbsGoal,
      fatGoal: parseInt(fatStr) || goals.fatGoal,
      fiberGoal: parseInt(fiberStr) || goals.fiberGoal || 38,
      sugarGoal: parseInt(sugarStr) || goals.sugarGoal || 64,
      sodiumGoal: parseInt(sodiumStr) || goals.sodiumGoal || 2300,
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
      <View style={[styles.header, { marginTop: topInset }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: "#F7F7F7", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        {/* Fill the middle to push Done to the right */}
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={saveAndGoBack}
          style={({ pressed }) => [
            styles.doneButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Edit nutrition goals</Text>

        <View style={styles.goalsList}>
          {/* Calorie Goal */}
          <GoalInputCard
            label="Calorie goal"
            value={caloriesStr}
            onChangeText={setCaloriesStr}
            ringColor="#1A1A1A"
            iconShape={
              <View style={[styles.iconBlob, { backgroundColor: "#1A1A1A15" }]}>
                <Ionicons name="flame" size={16} color="#1A1A1A" />
              </View>
            }
          />

          {/* Protein Goal */}
          <GoalInputCard
            label="Protein goal"
            value={proteinStr}
            onChangeText={setProteinStr}
            ringColor="#e65c5c"
            iconShape={
              <View style={[styles.iconBlob, { backgroundColor: "#e65c5c15" }]}>
                <FontAwesome5 name="drumstick-bite" size={12} color="#e65c5c" />
              </View>
            }
          />

          {/* Carb Goal */}
          <GoalInputCard
            label="Carb goal"
            value={carbsStr}
            onChangeText={setCarbsStr}
            ringColor="#e89e5d"
            iconShape={
              <View style={[styles.iconBlob, { backgroundColor: "#e89e5d15" }]}>
                <MaterialCommunityIcons name="barley" size={16} color="#e89e5d" />
              </View>
            }
          />

          {/* Fat Goal */}
          <GoalInputCard
            label="Fat goal"
            value={fatStr}
            onChangeText={setFatStr}
            ringColor="#5a8bed"
            iconShape={
              <View style={[styles.iconBlob, { backgroundColor: "#5a8bed15" }]}>
                <MaterialCommunityIcons name="peanut" size={16} color="#5a8bed" />
              </View>
            }
          />
        </View>

        <Pressable
          style={styles.toggleMicrosBtn}
          onPress={() => setShowMicros(!showMicros)}
        >
          <Text style={styles.toggleMicrosText}>View micronutrients</Text>
          <Ionicons
            name={showMicros ? "chevron-up" : "chevron-down"}
            size={18}
            color="#8A8A8E"
            style={{ marginLeft: 4 }}
          />
        </Pressable>

        {showMicros && (
          <View style={styles.goalsList}>
            {/* Fiber Goal */}
            <GoalInputCard
              label="Fiber goal"
              value={fiberStr}
              onChangeText={setFiberStr}
              ringColor="#9b5de5"
              iconShape={
                <View style={[styles.iconBlob, { backgroundColor: "#9b5de515" }]}>
                  <MaterialCommunityIcons
                    name="food-apple"
                    size={16}
                    color="#9b5de5"
                  />
                </View>
              }
            />

            {/* Sugar Goal */}
            <GoalInputCard
              label="Sugar goal"
              value={sugarStr}
              onChangeText={setSugarStr}
              ringColor="#f15bb5"
              iconShape={
                <View style={[styles.iconBlob, { backgroundColor: "#f15bb515" }]}>
                  <MaterialCommunityIcons name="spoon-sugar" size={16} color="#f15bb5" />
                </View>
              }
            />

            {/* Sodium Goal */}
            <GoalInputCard
              label="Sodium goal"
              value={sodiumStr}
              onChangeText={setSodiumStr}
              ringColor="#fee440"
              iconShape={
                <View style={[styles.iconBlob, { backgroundColor: "#fee44015" }]}>
                  <MaterialCommunityIcons
                    name="shaker"
                    size={16}
                    color="#fee440"
                  />
                </View>
              }
            />
          </View>
        )}

        <Pressable
          style={{
            backgroundColor: "#111",
            paddingVertical: 10,
            borderRadius: 56,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 30,
            marginBottom: 10
          }}
          onPress={() => router.push("/auto-generate-goals")}
        >
          <Text style={{ color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 18 }}>Auto Generate Goals</Text>
        </Pressable>

        <Pressable
          style={{
            backgroundColor: "#f5f5f5",
            paddingVertical: 10,
            borderRadius: 56,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40
          }}
          onPress={() => {
            setCaloriesStr(goals.dailyCalories?.toString() || "");
            setProteinStr(goals.proteinGoal?.toString() || "");
            setCarbsStr(goals.carbsGoal?.toString() || "");
            setFatStr(goals.fatGoal?.toString() || "");
            setFiberStr((goals.fiberGoal || 38).toString());
            setSugarStr((goals.sugarGoal || 64).toString());
            setSodiumStr((goals.sodiumGoal || 2300).toString());
          }}
        >
          <Text style={{ color: "#e65c5c", fontFamily: "Poppins_600SemiBold", fontSize: 16 }}>Revert Changes</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  doneButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 30,
    backgroundColor: "#111",
  },
  doneButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  goalsList: {
    gap: 16,
  },
  goalCardWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  ringSide: {
    marginRight: 16,
  },
  inputSide: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 70,
    justifyContent: "center",
  },
  inputSideUnfocused: {
    backgroundColor: "#F8F8FC",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputSideFocused: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
  },
  inputLabelText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#5A5A5C",
    marginBottom: 2,
  },
  textInput: {
    fontSize: 20,
    fontFamily: "Poppins_400Regular",
    color: "#1A1A1A",
    padding: 0,
    margin: 0,
  },
  iconBlob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleMicrosBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  toggleMicrosText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#8A8A8E",
  },
});
