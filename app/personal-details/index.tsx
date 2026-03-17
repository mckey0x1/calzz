import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useNutrition } from "@/lib/nutrition-context";
import { useThemeColors } from "@/constants/colors";

export default function PersonalDetailsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined); // light colors
  const { goals } = useNutrition();

  const handleBack = () => router.back();

  const topInset = Platform.OS === "web" ? 20 : insets.top + 10;

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
        <Text style={styles.headerTitle}>Personal details</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      <View style={styles.content}>
        {/* Goal Weight Card */}
        <View style={styles.card}>
          <View style={styles.goalRow}>
            <View>
              <Text style={styles.cardLabelText}>Goal Weight</Text>
              <Text style={styles.cardValueTextBold}>
                {goals.targetWeight} lbs
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.changeGoalBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => router.push("/personal-details/goal-weight" as any)}>
              <Text style={styles.changeGoalText}>Change Goal</Text>
            </Pressable>
          </View>
        </View>

        {/* Details List Card */}
        <View style={[styles.card, { paddingVertical: 10, paddingHorizontal: 0 }]}>
          <Pressable
            style={({ pressed }) => [styles.listItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/personal-details/height-weight" as any)}>
            <Text style={styles.listItemLabel}>Current Weight</Text>
            <View style={styles.listItemValueRow}>
              <Text style={styles.listItemValue}>{goals.currentWeight} lbs</Text>
              <Ionicons name="pencil-outline" size={18} color="#A0A0A0" style={styles.pencilIcon} />
            </View>
          </Pressable>
          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.listItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/personal-details/height-weight" as any)}>
            <Text style={styles.listItemLabel}>Height</Text>
            <View style={styles.listItemValueRow}>
              <Text style={styles.listItemValue}>{goals.heightFt} ft {goals.heightIn} in</Text>
              <Ionicons name="pencil-outline" size={18} color="#A0A0A0" style={styles.pencilIcon} />
            </View>
          </Pressable>
          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.listItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/personal-details/date-of-birth" as any)}>
            <Text style={styles.listItemLabel}>Date of birth</Text>
            <View style={styles.listItemValueRow}>
              <Text style={styles.listItemValue}>{goals.dateOfBirth}</Text>
              <Ionicons name="pencil-outline" size={18} color="#A0A0A0" style={styles.pencilIcon} />
            </View>
          </Pressable>
          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.listItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/personal-details/gender" as any)}>
            <Text style={styles.listItemLabel}>Gender</Text>
            <View style={styles.listItemValueRow}>
              <Text style={styles.listItemValue}>{goals.gender}</Text>
              <Ionicons name="pencil-outline" size={18} color="#A0A0A0" style={styles.pencilIcon} />
            </View>
          </Pressable>
          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.listItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/personal-details/daily-step-goal" as any)}>
            <Text style={styles.listItemLabel}>Daily Step Goal</Text>
            <View style={styles.listItemValueRow}>
              <Text style={styles.listItemValue}>{goals.stepsGoal} steps</Text>
              <Ionicons name="pencil-outline" size={18} color="#A0A0A0" style={styles.pencilIcon} />
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    paddingHorizontal: 20,
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabelText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#4A4A4A",
    marginBottom: 4,
  },
  cardValueTextBold: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  changeGoalBtn: {
    backgroundColor: "#1C1C1E",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  changeGoalText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  listItemLabel: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#333",
  },
  listItemValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItemValue: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  pencilIcon: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 20,
  },
});
