import React, { useEffect, useState } from "react";
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
  Modal,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { CommonActions, useNavigation, useIsFocused } from "@react-navigation/native";

import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { useAuth } from "@/lib/auth-context";
import { CalorieRing } from "@/components/CalorieRing";
import * as Device from "expo-device";
import * as Application from "expo-application";
import Constants from "expo-constants";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const { goals, totalCalories, totalProtein, totalCarbs, totalFat } =
    useNutrition();
  const { user, signOut, deleteAccount, isPremium } = useAuth();
  const scrollRef = React.useRef<ScrollView>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [isFocused]);

  const [modalType, setModalType] = useState<"logout" | "delete" | null>(null);
  function handleSignOut() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setModalType("logout");
  }

  function handleDeleteAccount() {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setModalType("delete");
  }

  const navigateToOnboarding = () => {
    // getParent() gets the root Stack navigator (above the Tabs navigator)
    const rootNav = navigation.getParent();
    if (rootNav) {
      rootNav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "index" }],
        }),
      );
    } else {
      // Fallback
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "index" }],
        }),
      );
    }
  };

  const confirmLogout = async () => {
    setModalType(null);
    await signOut();
    navigateToOnboarding();
  };

  const confirmDelete = async () => {
    setModalType(null);
    try {
      await deleteAccount();
      navigateToOnboarding();
    } catch (err: any) {
      // console.error(err);
      if (err.code === "auth/requires-recent-login") {
        Alert.alert(
          "Security Sensitivity",
          "This operation is sensitive and requires a recent login. Please sign out and sign back in before deleting your account.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Sign Out Now", 
              onPress: async () => {
                await signOut();
                navigateToOnboarding();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Could not delete your account. " + (err.message || "Please try again later.")
        );
      }
    }
  };

  function handleSupportEmail() {
    const userId = user?.uid || "N/A";
    const email = user?.email || "N/A";
    const appVersion =
      Application.nativeApplicationVersion ||
      Constants.expoConfig?.version ||
      "1.0.0";
    const buildVersion = Application.nativeBuildVersion || "N/A";
    const providerId = user?.providerData?.[0]?.providerId || "N/A";
    const platformName =
      Platform.OS === "ios"
        ? "iOS"
        : Platform.OS === "android"
          ? "Android"
          : "Web";
    const osVersion = Platform.Version?.toString() || "N/A";
    const deviceName = Device.modelName || Device.deviceName || "Unknown";
    const brand = Device.brand || "";

    const body = `\n\n\n.......\nPlease describe your issue above this line.\n\nUser ID:\n${userId}\nEmail:\n${email}\nVersion: ${appVersion}.${buildVersion}\nProvider Id:\n${providerId}\n\nPlatform: ${platformName}\n${platformName} Version: ${osVersion}\nDevice: ${brand} ${deviceName}`;

    const subject = encodeURIComponent("Support Request");
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:dormsdots@gmail.com?subject=${subject}&body=${encodedBody}`;

    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        "Error",
        "Could not open email client. Please send an email to dormsdots@gmail.com",
      );
    });
  }

  const isEmailUser = user?.providerData?.some(p => p.providerId === "password");

  const menuGroup1 = [
    {
      id: "personal",
      title: "Personal details",
      icon: "id-card-outline",
      onPress: () => router.push("/personal-details" as any),
    },
    ...(isEmailUser ? [{
      id: "account",
      title: "Account settings",
      icon: "settings-outline",
      onPress: () => router.push("/account-settings"),
    }] : []),
    {
      id: "macros",
      title: "Adjust macronutrients",
      icon: "sync-outline",
      onPress: () => router.push("/edit-nutrition-goals"),
    },
    {
      id: "weight",
      title: "Goal & current weight",
      icon: "flag-outline",
      onPress: () => router.push("/personal-details" as any),
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
      onPress: handleSupportEmail,
    },
    {
      id: "feature",
      title: "Feature Request",
      icon: "megaphone-outline",
      onPress: () => router.push("/feature-requests" as any),
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
        ref={scrollRef}
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
        <View style={[styles.card, { backgroundColor: "#fff" }]}>
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
                {user?.displayName || "user"}
              </Text>
              <Text style={styles.profileAge}>
                {(() => {
                  if (!goals.dateOfBirth) return 25;
                  const parts = goals.dateOfBirth.split("/");
                  if (parts.length === 3) {
                    const birthYear = parseInt(parts[2], 10);
                    if (!isNaN(birthYear)) {
                      return new Date().getFullYear() - birthYear;
                    }
                  }
                  return 25;
                })()}{" "}
                years old
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription Management (Only if Premium) */}
        {isPremium && (
          <View style={[styles.card, { backgroundColor: "#fff", borderLeftWidth: 4, borderLeftColor: "#111" }]}>
            <View style={styles.premiumHeader}>
              <Ionicons name="star" size={18} color="#1A1A1A" />
              <Text style={styles.premiumTitle}>Premium Subscription</Text>
            </View>
            <Text style={styles.premiumMessage}>
              Your premium plan is active. You can manage or cancel your subscription anytime via the Google Play Store.
            </Text>
            <Pressable
              onPress={() => Linking.openURL("https://play.google.com/store/account/subscriptions")}
              style={({ pressed }) => [
                styles.cancelButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={styles.cancelButtonText}>Manage Subscription</Text>
              <Ionicons name="open-outline" size={16} color="#4A4A4A" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
        )}

        {/* Menu Group 1 */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: "#fff",
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
        {/* <View style={styles.widgetsHeader}>
          <Text style={styles.widgetsTitle}>Widgets</Text>
          <Text style={styles.widgetsLink}>How to add?</Text>
        </View> */}

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
                size={100}
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
              ]}
              onPress={() => router.push("/scanner")}>
              <View style={styles.addIconWrap}>
                <Ionicons name="add" size={12} color="#1A1A1A" />
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
              {/* Left Column: Calorie Ring */}
              <View
                style={[
                  styles.widgetRingContainer2,
                  { alignSelf: "center", justifyContent: "center" },
                ]}>
                <CalorieRing
                  progress={totalCalories / goals.dailyCalories || 0}
                  size={110}
                  strokeWidth={10}
                  color="#1A1A1A"
                  trackColor="#F5F5F5">
                  <View style={styles.ringCenter}>
                    <Text style={styles.ringValueSmall}>{Math.round(caloriesLeft)}</Text>
                    <Text style={styles.ringLabelSmall}>Calories left</Text>
                  </View>
                </CalorieRing>
              </View>

              {/* Middle Column: Macros */}
              <View style={styles.macrosList}>
                <View style={styles.macroRow}>
                  <View
                    style={[
                      styles.macroIconBg,
                      {
                        backgroundColor: colors.proteinColor + "15",
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                      },
                    ]}>
                    <FontAwesome5
                      name="drumstick-bite"
                      size={12}
                      color="#e65c5c"
                    />
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.macroValue}>
                      {Math.max(0, Math.round(goals.proteinGoal - totalProtein))}g
                    </Text>
                    <Text style={styles.macroLabel}>Protein left</Text>
                  </View>
                </View>
                <View style={styles.macroRow}>
                  <View
                    style={[
                      styles.macroIconBg,
                      {
                        backgroundColor: colors.carbsColor + "15",
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name="barley"
                      size={16}
                      color="#e89e5d"
                    />
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.macroValue}>
                      {Math.max(0, Math.round(goals.carbsGoal - totalCarbs))}g
                    </Text>
                    <Text style={styles.macroLabel}>Carbs left</Text>
                  </View>
                </View>
                <View style={styles.macroRow}>
                  <View
                    style={[
                      styles.macroIconBg,
                      {
                        backgroundColor: colors.fatColor + "15",
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name="peanut"
                      size={16}
                      color="#5a8bed"
                    />
                  </View>
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.macroValue}>
                      {Math.max(0, Math.round(goals.fatGoal - totalFat))}g
                    </Text>
                    <Text style={styles.macroLabel}>Fats left</Text>
                  </View>
                </View>
              </View>

              {/* Right Column: Scan Actions */}
              <View style={styles.actionBtnsCol}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => router.push("/scanner")}>
                  <Ionicons name="scan-circle" size={24} color="#1A1A1A" />
                  <Text style={styles.actionBtnText}>Scan Food</Text>
                </Pressable>
                {/* <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => router.push("/scanner")}>
                  <Ionicons name="barcode-outline" size={18} color="#1A1A1A" />
                  <Text style={styles.actionBtnText}>Barcode</Text>
                </Pressable> */}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Menu Group 2 */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: "#fff",
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
        <Text style={styles.versionText}>VERSION 1.0.5</Text>
      </ScrollView>

      {/* Custom Modal for Logout and Delete */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalType(null)}
          />
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalIconContainer}>
              <Ionicons
                name={
                  modalType === "logout" ? "log-out-outline" : "trash-outline"
                }
                size={34}
                color={modalType === "logout" ? colors.tint : colors.accentRed}
              />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {modalType === "logout" ? "Log out" : "Delete Account?"}
            </Text>
            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {modalType === "logout"
                ? "Are you sure you want to log out?"
                : "Are you sure you want to completely delete your account? This will erase all your data."}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButtonBase,
                  styles.modalButtonCancel,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => setModalType(null)}>
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: colors.textSecondary },
                  ]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalButtonBase,
                  {
                    backgroundColor:
                      modalType === "logout" ? colors.tint : colors.accentRed,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={
                  modalType === "logout" ? confirmLogout : confirmDelete
                }>
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  {modalType === "logout" ? "Logout" : "Delete"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 14,
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
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  widgetCard: {
    borderRadius: 15,
    padding: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  widgetCardWide: {
    width: 340,
    alignItems: "flex-start",
  },
  widgetRingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  widgetRingContainer2: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  ringLabel: {
    fontSize: 6,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    marginTop: -4,
  },
  ringValueSmall: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  ringLabelSmall: {
    fontSize: 7,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    marginTop: -2,
  },
  logFoodBtn: {
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    fontSize: 12,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  addIconWrap: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  logFoodText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  widgetRowLayout: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  macrosList: {
    marginLeft: 12,
    justifyContent: "space-between",
    flex: 1,
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
  actionBtnsCol: {
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
  },
  actionBtn: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    height: "100%",
  },
  actionBtnText: {
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F4F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonBase: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#F4F4F6",
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  premiumTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  premiumMessage: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#4A4A4A",
    lineHeight: 18,
    marginBottom: 16,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F4F6",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDEDED",
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#4A4A4A",
  },
});
