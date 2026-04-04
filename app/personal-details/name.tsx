import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function EditNameScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateDisplayName } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => router.back();

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await updateDisplayName(name.trim());
      router.back();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const topInset = Platform.OS === "web" ? 40 : insets.top + 20;

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
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
          <Text style={styles.headerTitle}>Change Name</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoFocus
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <Text style={styles.infoText}>
            This name will be displayed on your profile and dashboard.
          </Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            onPress={handleSave}
            disabled={isSaving || !name.trim()}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: name.trim() ? "#1A1A1A" : "#E0E0E0",
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#808080",
    marginBottom: 8,
  },
  input: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    borderBottomWidth: 2,
    borderBottomColor: "#F0F0F0",
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
