import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/GlassCard";
import { CalorieRing } from "@/components/CalorieRing";

const DIET_OPTIONS = [
  {
    key: "balanced",
    label: "Balanced",
    icon: "nutrition-outline" as const,
    desc: "Equal macro distribution",
  },
  {
    key: "high-protein",
    label: "High Protein",
    icon: "barbell-outline" as const,
    desc: "Focus on muscle building",
  },
  {
    key: "keto",
    label: "Keto",
    icon: "flame-outline" as const,
    desc: "Low carb, high fat",
  },
  {
    key: "vegan",
    label: "Vegan",
    icon: "leaf-outline" as const,
    desc: "Plant-based nutrition",
  },
] as const;

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const {
    goals,
    updateGoals,
    setFirebaseUid,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  } = useNutrition();
  const { user, userProfile, isSigningIn, signInWithGoogle, signOut } =
    useAuth();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    setFirebaseUid(user?.uid || null);
  }, [user?.uid]);

  function startEdit(field: string, currentValue: number) {
    setEditingField(field);
    setEditValue(String(currentValue));
  }

  function saveEdit(field: string) {
    const val = parseInt(editValue, 10);
    if (!isNaN(val) && val > 0) {
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateGoals({ [field]: val });
    }
    setEditingField(null);
  }

  function selectDiet(diet: string) {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const presets: Record<string, Partial<typeof goals>> = {
      balanced: {
        dietPreference: "balanced",
        proteinGoal: 150,
        carbsGoal: 200,
        fatGoal: 65,
      },
      "high-protein": {
        dietPreference: "high-protein",
        proteinGoal: 200,
        carbsGoal: 150,
        fatGoal: 60,
      },
      keto: {
        dietPreference: "keto",
        proteinGoal: 120,
        carbsGoal: 50,
        fatGoal: 130,
      },
      vegan: {
        dietPreference: "vegan",
        proteinGoal: 100,
        carbsGoal: 250,
        fatGoal: 65,
      },
    };
    updateGoals(presets[diet] || {});
  }

  const completionScore = Math.min(
    100,
    Math.round(
      ((Math.min(totalCalories / goals.dailyCalories, 1) +
        Math.min(totalProtein / goals.proteinGoal, 1) +
        Math.min(totalCarbs / goals.carbsGoal, 1) +
        Math.min(totalFat / goals.fatGoal, 1)) /
        4) *
        100,
    ),
  );

  const aiRecommendations = [
    goals.dietPreference === "keto"
      ? "Add more healthy fats like avocado, nuts, and olive oil to your meals."
      : "Consider adding a post-workout protein shake to hit your protein target.",
    totalCalories < goals.dailyCalories * 0.5
      ? "You're under-eating today. Make sure to have a substantial meal soon."
      : "Great calorie management. Keep portion sizes consistent.",
    "Aim for at least 25g of fiber daily from whole grains and vegetables.",
  ];

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 40,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : 100,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>
          Profile & Goals
        </Text>

        <GlassCard style={styles.profileHeader}>
          <LinearGradient
            colors={[
              colorScheme === "dark"
                ? "rgba(139,124,247,0.12)"
                : "rgba(108,92,231,0.06)",
              colorScheme === "dark"
                ? "rgba(0,217,165,0.08)"
                : "rgba(0,184,148,0.04)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.profileRow}>
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatarImage}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.tint + "20" },
                ]}>
                <Ionicons name="person" size={28} color={colors.tint} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.displayName || "Your Profile"}
              </Text>
              <Text
                style={[styles.profileSub, { color: colors.textSecondary }]}>
                {user?.email ||
                  goals.dietPreference.charAt(0).toUpperCase() +
                    goals.dietPreference.slice(1) +
                    " Diet"}
              </Text>
            </View>
            <CalorieRing
              progress={completionScore / 100}
              size={52}
              strokeWidth={5}
              color={colors.accentEmerald}
              trackColor={colors.progressRingBg}>
              <Text style={[styles.profileScore, { color: colors.text }]}>
                {completionScore}%
              </Text>
            </CalorieRing>
          </View>
        </GlassCard>

        {!user ? (
          <Pressable
            onPress={signInWithGoogle}
            disabled={isSigningIn}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
            <GlassCard style={styles.signInCard}>
              <LinearGradient
                colors={["rgba(108,92,231,0.1)", "rgba(0,184,148,0.06)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {isSigningIn ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <>
                  <View style={styles.googleIconWrap}>
                    <Ionicons name="logo-google" size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.signInTitle, { color: colors.text }]}>
                      Sign in with Google
                    </Text>
                    <Text
                      style={[
                        styles.signInSub,
                        { color: colors.textSecondary },
                      ]}>
                      Sync your data across devices
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textTertiary}
                  />
                </>
              )}
            </GlassCard>
          </Pressable>
        ) : (
          <GlassCard style={styles.syncBadge}>
            <Ionicons
              name="cloud-done"
              size={16}
              color={colors.accentEmerald}
            />
            <Text style={[styles.syncText, { color: colors.accentEmerald }]}>
              Data synced to cloud
            </Text>
          </GlassCard>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Daily Goals
        </Text>
        <GlassCard>
          <GoalRow
            icon="flame-outline"
            label="Daily Calories"
            value={goals.dailyCalories}
            unit="cal"
            colors={colors}
            editing={editingField === "dailyCalories"}
            editValue={editValue}
            onEdit={() => startEdit("dailyCalories", goals.dailyCalories)}
            onSave={() => saveEdit("dailyCalories")}
            onChangeText={setEditValue}
            accentColor={colors.tint}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <GoalRow
            icon="barbell-outline"
            label="Protein"
            value={goals.proteinGoal}
            unit="g"
            colors={colors}
            editing={editingField === "proteinGoal"}
            editValue={editValue}
            onEdit={() => startEdit("proteinGoal", goals.proteinGoal)}
            onSave={() => saveEdit("proteinGoal")}
            onChangeText={setEditValue}
            accentColor={colors.proteinColor}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <GoalRow
            icon="pizza-outline"
            label="Carbs"
            value={goals.carbsGoal}
            unit="g"
            colors={colors}
            editing={editingField === "carbsGoal"}
            editValue={editValue}
            onEdit={() => startEdit("carbsGoal", goals.carbsGoal)}
            onSave={() => saveEdit("carbsGoal")}
            onChangeText={setEditValue}
            accentColor={colors.carbsColor}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <GoalRow
            icon="water-outline"
            label="Fat"
            value={goals.fatGoal}
            unit="g"
            colors={colors}
            editing={editingField === "fatGoal"}
            editValue={editValue}
            onEdit={() => startEdit("fatGoal", goals.fatGoal)}
            onSave={() => saveEdit("fatGoal")}
            onChangeText={setEditValue}
            accentColor={colors.fatColor}
          />
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Weight
        </Text>
        <GlassCard>
          <View style={styles.weightRow}>
            <View style={styles.weightItem}>
              <Text
                style={[styles.weightLabel, { color: colors.textSecondary }]}>
                Current
              </Text>
              {editingField === "currentWeight" ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[
                      styles.editInput,
                      { color: colors.text, borderColor: colors.tint },
                    ]}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    autoFocus
                    onSubmitEditing={() => saveEdit("currentWeight")}
                  />
                  <Pressable onPress={() => saveEdit("currentWeight")}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.accentEmerald}
                    />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() =>
                    startEdit("currentWeight", goals.currentWeight)
                  }
                  style={styles.weightValueRow}>
                  <Text style={[styles.weightValue, { color: colors.text }]}>
                    {goals.currentWeight} kg
                  </Text>
                  <Feather
                    name="edit-2"
                    size={14}
                    color={colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>
            <View
              style={[styles.weightDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.weightItem}>
              <Text
                style={[styles.weightLabel, { color: colors.textSecondary }]}>
                Target
              </Text>
              {editingField === "targetWeight" ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[
                      styles.editInput,
                      { color: colors.text, borderColor: colors.tint },
                    ]}
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    autoFocus
                    onSubmitEditing={() => saveEdit("targetWeight")}
                  />
                  <Pressable onPress={() => saveEdit("targetWeight")}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={colors.accentEmerald}
                    />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => startEdit("targetWeight", goals.targetWeight)}
                  style={styles.weightValueRow}>
                  <Text style={[styles.weightValue, { color: colors.text }]}>
                    {goals.targetWeight} kg
                  </Text>
                  <Feather
                    name="edit-2"
                    size={14}
                    color={colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Diet Preference
        </Text>
        <View style={styles.dietGrid}>
          {DIET_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => selectDiet(opt.key)}
              style={({ pressed }) => [
                { opacity: pressed ? 0.8 : 1, flex: 1, minWidth: "45%" as any },
              ]}>
              <GlassCard
                style={[
                  styles.dietCard,
                  goals.dietPreference === opt.key
                    ? {
                        borderColor: colors.tint,
                        borderWidth: 2,
                      }
                    : {},
                ]}>
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={
                    goals.dietPreference === opt.key
                      ? colors.tint
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.dietLabel,
                    {
                      color:
                        goals.dietPreference === opt.key
                          ? colors.tint
                          : colors.text,
                    },
                  ]}>
                  {opt.label}
                </Text>
                <Text style={[styles.dietDesc, { color: colors.textTertiary }]}>
                  {opt.desc}
                </Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          AI Recommendations
        </Text>
        {aiRecommendations.map((rec, i) => (
          <GlassCard key={i} style={styles.recCard}>
            <View style={styles.recRow}>
              <View style={[styles.recDot, { backgroundColor: colors.tint }]}>
                <Ionicons name="sparkles" size={12} color="#fff" />
              </View>
              <Text style={[styles.recText, { color: colors.text }]}>
                {rec}
              </Text>
            </View>
          </GlassCard>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
        <GlassCard style={{ gap: 0 }}>
          <Pressable
            onPress={() => router.push("/privacy-policy")}
            style={({ pressed }) => [
              styles.menuItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <View
              style={[
                styles.menuIconBg,
                { backgroundColor: colors.accentBlue + "15" },
              ]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.accentBlue}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Privacy Policy
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textTertiary}
            />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            onPress={() => router.push("/terms")}
            style={({ pressed }) => [
              styles.menuItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <View
              style={[
                styles.menuIconBg,
                { backgroundColor: colors.accentEmerald + "15" },
              ]}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.accentEmerald}
              />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Terms & Conditions
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textTertiary}
            />
          </Pressable>
        </GlassCard>

        {user && (
          <Pressable
            onPress={signOut}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1, marginTop: 8 },
            ]}>
            <GlassCard style={styles.signOutCard}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={colors.dangerRed}
              />
              <Text style={[styles.signOutText, { color: colors.dangerRed }]}>
                Sign Out
              </Text>
            </GlassCard>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function GoalRow({
  icon,
  label,
  value,
  unit,
  colors,
  editing,
  editValue,
  onEdit,
  onSave,
  onChangeText,
  accentColor,
}: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  colors: ReturnType<typeof useThemeColors>;
  editing: boolean;
  editValue: string;
  onEdit: () => void;
  onSave: () => void;
  onChangeText: (text: string) => void;
  accentColor: string;
}) {
  return (
    <View style={goalStyles.row}>
      <View
        style={[goalStyles.iconBg, { backgroundColor: accentColor + "15" }]}>
        <Ionicons name={icon as any} size={18} color={accentColor} />
      </View>
      <Text style={[goalStyles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      {editing ? (
        <View style={goalStyles.editRow}>
          <TextInput
            style={[
              goalStyles.editInput,
              { color: colors.text, borderColor: colors.tint },
            ]}
            value={editValue}
            onChangeText={onChangeText}
            keyboardType="numeric"
            autoFocus
            onSubmitEditing={onSave}
          />
          <Pressable onPress={onSave}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.accentEmerald}
            />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onEdit} style={goalStyles.valueRow}>
          <Text style={[goalStyles.value, { color: colors.text }]}>
            {value}{" "}
            <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
              {unit}
            </Text>
          </Text>
          <Feather name="edit-2" size={13} color={colors.textTertiary} />
        </Pressable>
      )}
    </View>
  );
}

const goalStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: 14, fontFamily: "DMSans_500Medium" },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  value: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editInput: {
    width: 80,
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    borderBottomWidth: 2,
    paddingVertical: 2,
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 24 },
  title: { fontSize: 28, fontFamily: "DMSans_700Bold", marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontFamily: "DMSans_700Bold", marginTop: 8 },
  profileHeader: { overflow: "hidden" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 52, height: 52, borderRadius: 26 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  profileSub: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
  profileScore: { fontSize: 11, fontFamily: "DMSans_700Bold" },
  divider: { height: 1, marginVertical: 6 },
  signInCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    overflow: "hidden",
  },
  googleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  signInTitle: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  signInSub: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  syncText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  weightRow: { flexDirection: "row", alignItems: "center" },
  weightItem: { flex: 1, alignItems: "center", gap: 4 },
  weightDivider: { width: 1, height: 40 },
  weightLabel: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  weightValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  weightValue: { fontSize: 22, fontFamily: "DMSans_700Bold" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  editInput: {
    width: 60,
    fontSize: 18,
    fontFamily: "DMSans_600SemiBold",
    borderBottomWidth: 2,
    paddingVertical: 2,
    textAlign: "center",
  },
  dietGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  dietCard: { alignItems: "center", gap: 6, paddingVertical: 16 },
  dietLabel: { fontSize: 14, fontFamily: "DMSans_600SemiBold" },
  dietDesc: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
  recCard: {},
  recRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  recDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  recText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  menuIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "DMSans_500Medium" },
  signOutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  signOutText: { fontSize: 15, fontFamily: "DMSans_600SemiBold" },
});
