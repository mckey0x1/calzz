import React, { useState, useRef, useEffect } from "react";
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
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";

type AuthMode = "signin" | "forgot";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors("light");
  const { signInWithEmail, resetPassword, isSigningIn } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [mode]);

  const validate = () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (mode !== "forgot" && (!password || password.length < 6)) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        router.replace("/(tabs)");
      } else {
        await resetPassword(email);
        setSuccessMessage("Password reset email sent! Check your inbox.");
        setTimeout(() => setMode("signin"), 3000);
      }
    } catch (err: any) {
      let msg = "Wrong credentials";

      setError(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <LinearGradient
        colors={["#dfffa2", "#f3f4d4"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60 },
        ]}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Animated.View style={[{ opacity: fadeAnim }]}>
          <Text style={styles.title}>
            {mode === "signin" ? "Welcome Back" : "Reset Password"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "signin"
              ? "Sign in to continue your journey"
              : "Enter your email to receive a reset link"}
          </Text>

          {error ? (
            <View style={styles.errorBadge}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {successMessage ? (
            <View style={styles.successBadge}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {mode !== "forgot" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textTertiary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>
          )}

          {mode === "signin" && (
            <Pressable
              onPress={() => setMode("forgot")}
              style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: colors.tint }]}>
                Forgot Password?
              </Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              isSigningIn && styles.disabledButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={isSigningIn}>
            {isSigningIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === "signin" ? "Sign In" : "Send Reset Link"}
              </Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    marginBottom: 32,
  },
  errorBadge: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  successBadge: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  successText: {
    color: "#2E7D32",
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 16,
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
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  submitButton: {
    width: "100%",
    height: 56,
    borderRadius: 100,
    backgroundColor: "#1A1A1A", // Match the brand feel
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
  },
  toggleAction: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },
});
