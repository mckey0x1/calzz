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
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColors } from "@/constants/colors";

const SECTIONS = [
  {
    title: "Acceptance of Terms",
    content:
      "By downloading, installing, or using NutriAI, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.",
  },
  {
    title: "Description of Service",
    content:
      "NutriAI is a calorie tracking and fitness assistant application that provides nutrition logging, AI-powered food analysis, progress tracking, and personalized health insights. The app is designed for informational purposes and is not a substitute for professional medical or nutritional advice.",
  },
  {
    title: "User Accounts",
    content:
      "You may use the app with or without creating an account. Signing in with Google provides cloud data synchronization and backup. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
  },
  {
    title: "User Responsibilities",
    content:
      "You agree to:\n\n- Provide accurate information when logging food and health data\n- Use the app for personal, non-commercial purposes only\n- Not attempt to reverse engineer, modify, or distribute the application\n- Not use the app to harass, abuse, or harm others\n- Comply with all applicable laws and regulations",
  },
  {
    title: "Health Disclaimer",
    content:
      "NutriAI provides general nutrition and fitness information only. It is NOT a medical device and should NOT be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before starting any diet, exercise, or wellness program. The AI insights are algorithmic estimates and may not be accurate for your specific health needs.",
  },
  {
    title: "Intellectual Property",
    content:
      "All content, features, and functionality of NutriAI, including but not limited to text, graphics, logos, icons, and software, are the exclusive property of NutriAI and are protected by international copyright, trademark, and other intellectual property laws.",
  },
  {
    title: "Data Accuracy",
    content:
      "While we strive to provide accurate nutritional information and calorie estimates, we cannot guarantee the accuracy of all food data, AI recognition results, or health calculations. Users should verify critical nutritional information independently.",
  },
  {
    title: "Limitation of Liability",
    content:
      "NutriAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, including but not limited to health outcomes, data loss, or service interruptions.",
  },
  {
    title: "Modifications to Service",
    content:
      "We reserve the right to modify, suspend, or discontinue the app at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the service.",
  },
  {
    title: "Termination",
    content:
      "We may terminate or suspend your access to the app immediately, without prior notice, if you breach these Terms and Conditions. Upon termination, your right to use the app will cease immediately.",
  },
  {
    title: "Governing Law",
    content:
      "These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration.",
  },
  {
    title: "Contact Information",
    content:
      "For any questions regarding these Terms and Conditions, please contact us through the app's support section.",
  },
];

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: (Platform.OS === "web" ? webTopInset : insets.top) + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Conditions</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.badge, { backgroundColor: colors.accentEmerald + "15" }]}>
          <Ionicons name="document-text" size={16} color={colors.accentEmerald} />
          <Text style={[styles.badgeText, { color: colors.accentEmerald }]}>Terms of Use</Text>
        </View>

        <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
          Last updated: February 15, 2026
        </Text>

        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Please read these Terms and Conditions carefully before using NutriAI. These terms govern your use of the application and establish a legally binding agreement between you and NutriAI.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i + 1}. {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
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
  sectionContent: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 22 },
});
