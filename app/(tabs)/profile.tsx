import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ImageBackground,
  Image,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { useAuth } from "@/lib/auth-context";
import { CalorieRing } from "@/components/CalorieRing";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();

  const { goals, totalCalories, totalProtein, totalCarbs, totalFat } =
    useNutrition();
  const { user, signOut, deleteAccount } = useAuth();

  const handleSignOut = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Alert.alert(
      "Delete Account?",
      "Are you sure you want to completely delete your account? This will erase all your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace("/");
            } catch (err) {
              console.error(err);
              Alert.alert(
                "Error",
                "Could not delete your account. Try signing in again first.",
              );
            }
          },
        },
      ],
    );
  };

  const menuGroup1 = [
    {
      id: "personal",
      title: "Personal details",
      icon: "id-card-outline",
      onPress: () => {},
    },
    {
      id: "macros",
      title: "Adjust macronutrients",
      icon: "sync-outline",
      onPress: () => {},
    },
    {
      id: "weight",
      title: "Goal & current weight",
      icon: "flag-outline",
      onPress: () => {},
    },
  ];

  const menuGroup2 = [
    {
      id: "terms",
      title: "Terms and Conditions",
      icon: "document-text-outline",
      onPress: () => router.push("/terms"),
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      icon: "shield-checkmark-outline",
      onPress: () => router.push("/privacy-policy"),
    },
    {
      id: "support",
      title: "Support Email",
      icon: "mail-outline",
      onPress: () => {},
    },
    {
      id: "feature",
      title: "Feature Request",
      icon: "megaphone-outline",
      onPress: () => {},
    },
    {
      id: "delete",
      title: "Delete Account?",
      icon: "person-remove-outline",
      onPress: () => handleDeleteAccount(),
    },
  ];

  const webTopInset = Platform.OS === "web" ? 60 : 0;

  // Calculate remaining calories and macros
  const caloriesLeft = Math.max(0, goals.dailyCalories - totalCalories);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 20,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.mainTitle, { color: colors.text }]}>Profile</Text>

        {/* Profile Info Card */}
        <View
          style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.profileRow}>
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#F4F4F6" }]}>
                <Ionicons name="person-outline" size={24} color="#1A1A1A" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.displayName || "munna"}
              </Text>
              <Text style={styles.profileAge}>25 years old</Text>
            </View>
          </View>
        </View>

        {/* Menu Group 1 */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceElevated,
              paddingVertical: 10,
              paddingHorizontal: 0,
            },
          ]}>
          {menuGroup1.map((item, index) => (
            <React.Fragment key={item.id}>
              <Pressable
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color="#1A1A1A"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuLabel}>{item.title}</Text>
              </Pressable>
              {index < menuGroup1.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Widgets Header */}
        <View style={styles.widgetsHeader}>
          <Text style={styles.widgetsTitle}>Widgets</Text>
          <Text style={styles.widgetsLink}>How to add?</Text>
        </View>

        {/* Widgets Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.widgetsScrollInfo}>
          {/* Left Widget: Calorie summary */}
          <View style={[styles.widgetCard, { backgroundColor: "#fff" }]}>
            <View style={styles.widgetRingContainer}>
              <CalorieRing
                progress={totalCalories / goals.dailyCalories || 0}
                size={120}
                strokeWidth={10}
                color="#1A1A1A"
                trackColor="#F5F5F5">
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>{caloriesLeft}</Text>
                  <Text style={styles.ringLabel}>Calories left</Text>
                </View>
              </CalorieRing>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.logFoodBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}>
              <View style={styles.addIconWrap}>
                <Ionicons name="add" size={18} color="#1A1A1A" />
              </View>
              <Text style={styles.logFoodText}>Log your food</Text>
            </Pressable>
          </View>

          {/* Right Widget: Macros summary */}
          <View
            style={[
              styles.widgetCard,
              styles.widgetCardWide,
              { backgroundColor: "#fff" },
            ]}>
            <View style={styles.widgetRowLayout}>
              <View style={styles.widgetRingContainer}>
                <CalorieRing
                  progress={totalCalories / goals.dailyCalories || 0}
                  size={110}
                  strokeWidth={10}
                  color="#1A1A1A"
                  trackColor="#F5F5F5">
                  <View style={styles.ringCenter}>
                    <Text style={styles.ringValueSmall}>{caloriesLeft}</Text>
                    <Text style={styles.ringLabelSmall}>Calories left</Text>
                  </View>
                </CalorieRing>
              </View>
              <View style={styles.macrosList}>
                <View style={styles.macroRow}>
                  <View
                    style={[
                      styles.macroIconBg,
                      { backgroundColor: colors.proteinColor + "20" },
                    ]}>
                    <Ionicons
                      name="barbell"
                      size={12}
                      color={colors.proteinColor}
                    />
                  </View>
                  <View>
                    <Text style={styles.macroValue}>
                      {Math.max(0, goals.proteinGoal - totalProtein)}g
                    </Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                </View>
                <View style={styles.macroRow}>
                  <View
                    style={[
                      styles.macroIconBg,
                      { backgroundColor: colors.carbsColor + "20" },
                    ]}>
                    <Ionicons
                      name="pizza"
                      size={12}
                      color={colors.carbsColor}
                    />
                  </View>
                  <View>
                    <Text style={styles.macroValue}>
                      {Math.max(0, goals.carbsGoal - totalCarbs)}g
                    </Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                </View>
                <View style={styles.macroRow}>
                  <View
                    style={[
                      styles.macroIconBg,
                      { backgroundColor: colors.fatColor + "20" },
                    ]}>
                    <Ionicons name="water" size={12} color={colors.fatColor} />
                  </View>
                  <View>
                    <Text style={styles.macroValue}>
                      {Math.max(0, goals.fatGoal - totalFat)}g
                    </Text>
                    <Text style={styles.macroLabel}>Fats</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Menu Group 2 */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceElevated,
              paddingVertical: 10,
              paddingHorizontal: 0,
              marginTop: 10,
            },
          ]}>
          {menuGroup2.map((item, index) => (
            <React.Fragment key={item.id}>
              <Pressable
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.menuItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color="#1A1A1A"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuLabel}>{item.title}</Text>
              </Pressable>
              {index < menuGroup2.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.accentRed, marginTop: 20 },
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <View style={styles.logoutRow}>
            <Ionicons
              name="log-out-outline"
              size={22}
              color="#1A1A1A"
              style={styles.logoutIcon}
            />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </Pressable>

        {/* Version */}
        <Text style={styles.versionText}>VERSION 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  mainTitle: {
    fontSize: 28,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 4,
    color: "#1A1A1A",
  },
  card: {
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  profileAge: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4A4A4A",
    marginTop: 2,
  },
  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    paddingBottom: 14,
  },
  inviteTitle: {
    fontSize: 17,
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  inviteImageBg: {
    height: 140,
    marginHorizontal: 12,
    marginBottom: 12,
    justifyContent: "flex-end",
    padding: 16,
  },
  inviteImageBorder: {
    borderRadius: 20,
  },
  inviteContent: {
    gap: 4,
  },
  inviteTextBig: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  referButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  referButtonText: {
    color: "#1A1A1A",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuItemActive: {
    backgroundColor: "#F2F1F4",
    marginHorizontal: 8,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  menuIcon: {
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginHorizontal: 18,
  },
  widgetsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 4,
  },
  widgetsTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  widgetsLink: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  widgetsScrollInfo: {
    gap: 16,
    paddingVertical: 4,
  },
  widgetCard: {
    borderRadius: 15,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    width: 200,
  },
  widgetCardWide: {
    width: 260,
    alignItems: "flex-start",
  },
  widgetRingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  ringCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
  },
  ringLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    marginTop: -4,
  },
  ringValueSmall: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
  },
  ringLabelSmall: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    marginTop: -2,
  },
  logFoodBtn: {
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  addIconWrap: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  logFoodText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  widgetRowLayout: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  macrosList: {
    marginLeft: 16,
    justifyContent: "space-between",
    height: 110,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  macroIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  macroValue: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  macroLabel: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    marginTop: -2,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  logoutIcon: {
    marginRight: 14,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    marginTop: 10,
    marginBottom: 30,
  },
});
