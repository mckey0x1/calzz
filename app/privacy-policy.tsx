import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";

const SECTIONS = [
  {
    title: "Information We Collect",
    content:
      "We collect information you provide directly, including your name, email address, profile photo (via Google Sign-In), nutrition data, food logs, health goals, and weight tracking data. We also collect device information and usage analytics to improve the app experience.",
  },
  {
    title: "How We Use Your Information",
    content:
      "Your data is used to provide personalized nutrition tracking, AI-powered insights, calorie calculations, and progress analytics. We use Firebase Realtime Database to securely store and sync your data across devices. We do not sell your personal information to third parties.",
  },
  {
    title: "Data Storage & Security",
    content:
      "Your data is stored securely using Google Firebase infrastructure with industry-standard encryption. Authentication is handled through Google OAuth 2.0. We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, or destruction.",
  },
  {
    title: "Third-Party Services",
    content:
      "We use the following third-party services:\n\n- Google Firebase (authentication, data storage)\n- Google Sign-In (account authentication)\n- Expo (app framework and services)\n\nEach service has its own privacy policy governing data handling.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data at any time. You can sign out of the app to stop data collection. To request complete data deletion, please contact us. You may also export your data through the app settings.",
  },
  {
    title: "Data Retention",
    content:
      "We retain your data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days. Some anonymized analytics data may be retained for service improvement purposes.",
  },
  {
    title: "Children's Privacy",
    content:
      "This app is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us for immediate removal.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy within the app. Continued use of the app after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "Contact Us",
    content:
      "If you have any questions or concerns about this privacy policy or our data practices, please contact us through the app's support section.",
  },
];

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      {/* <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      /> */}
      <View
        style={[
          styles.header,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 40,
            borderBottomColor: colors.border,
          },
        ]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, { backgroundColor: colors.tint + "15" }]}>
          <Ionicons name="shield-checkmark" size={16} color={colors.tint} />
          <Text style={[styles.badgeText, { color: colors.tint }]}>
            Your data is protected
          </Text>
        </View>

        <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
          Last updated: February 15, 2026
        </Text>

        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Calzz ("we", "our", "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and safeguard your
          information when you use our mobile application.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i + 1}. {section.title}
            </Text>
            <Text
              style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: "DMSans_700Bold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  lastUpdated: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  intro: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 22 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 16, fontFamily: "DMSans_700Bold" },
  sectionContent: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 22,
  },
});
