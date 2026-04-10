import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors("light");
  const { user, verifyEmail, changeEmail, changePassword, reloadUser, resetPassword } = useAuth();

  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerifyEmail = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVerifying(true);
    try {
      await verifyEmail();
      Alert.alert("Success", "Verification email sent! Please check your inbox.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send verification email.");
    } finally {
      setVerifying(false);
    }
  };

  const handleReloadUser = async () => {
    setVerifying(true);
    try {
      const isVerified = await reloadUser();
      if (isVerified) {
        Alert.alert("Verified!", "Your email has been successfully verified.");
      } else {
        Alert.alert("Not Verified", "Email is still showing as unverified. Make sure you clicked the link in your email and then try checking again.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to refresh status.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!email || email === user?.email) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setIsUpdating(true);
    try {
      await changeEmail(email);
      Alert.alert("Verification Sent", "A verification email has been sent to the new address. Your email will be updated once you click the link.");
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        Alert.alert("Security Timeout", "Please sign out and sign back in to change your email.");
      } else {
        Alert.alert("Error", err.message || "Failed to update email.");
      }
    } finally {
      setIsUpdating(false);
    }
  };


  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsUpdating(true);
    try {
      await resetPassword(user.email);
      Alert.alert("Success", "Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send reset email.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Address</Text>
          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            {!user?.emailVerified && (
              <View style={styles.verifyRow}>
                <Pressable 
                  style={({ pressed }) => [styles.singleVerifyBtn, { opacity: pressed ? 0.7 : 1 }]} 
                  onPress={handleVerifyEmail}
                  disabled={verifying}
                >
                  {verifying ? (
                     <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.singleVerifyText}>Verify</Text>
                  )}
                </Pressable>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                (isUpdating || email === user?.email) && styles.disabledButton,
                { opacity: pressed ? 0.9 : 1 }
              ]}
              onPress={handleUpdateEmail}
              disabled={isUpdating || email === user?.email}
            >
              <Text style={styles.saveButtonText}>Update Email</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.card}>
            <Text style={styles.resetInfoText}>
              We will send a secure link to your email to change your password.
            </Text>
            
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                isUpdating && styles.disabledButton,
                { opacity: pressed ? 0.9 : 1 }
              ]}
              onPress={handleSendResetEmail}
              disabled={isUpdating}
            >
              <Text style={styles.saveButtonText}>Send Reset Link</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            For security, sensitive changes (like email or password) may require you to have logged in recently.
          </Text>
        </View>

        {isUpdating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  singleVerifyBtn: {
    backgroundColor: "#d1ffd6ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  singleVerifyText: {
    color: "#111",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  verifyRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  checkStatusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  checkStatusText: {
    color: "#666",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  saveButton: {
    backgroundColor: "#1A1A1A",
    height: 50,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  hint: {
    fontSize: 12,
    color: "#888",
    fontFamily: "Poppins_400Regular",
    marginBottom: 20,
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  resetInfoText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Poppins_400Regular",
    marginBottom: 20,
    lineHeight: 20,
  },
});
