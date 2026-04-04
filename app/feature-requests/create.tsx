import React, { useState } from "react";
import { 
  View, Text, StyleSheet, TextInput, Pressable, 
  ActivityIndicator, KeyboardAvoidingView, Platform 
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseDatabase } from "@/lib/firebase";
import { ref, push, set } from "firebase/database";

export default function CreateFeatureRequestScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !user) return;
    setLoading(true);

    try {
      const db = getFirebaseDatabase();
      const requestsRef = ref(db, "feature_requests");
      const newReqRef = push(requestsRef);

      await set(newReqRef, {
        title: title.trim(),
        description: description.trim(),
        createdAt: Date.now(),
        createdBy: user.uid,
        authorName: user.displayName || "User",
        authorPhotoUrl: user.photoURL || "",
        upvotes: 0,
        commentsCount: 0
      });

      router.back();
    } catch (err) {
      console.error("Failed to create request", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 50) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Create Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Short, descriptive title"
          placeholderTextColor="#A0A0A0"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What would you like to see? Why do you need it?"
          placeholderTextColor="#A0A0A0"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Pressable 
          style={[styles.submitBtn, (!title.trim() || !description.trim()) && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading || !title.trim() || !description.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Request</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F7",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  content: {
    padding: 20,
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    color: "#1A1A1A",
  },
  textArea: {
    height: 150,
    paddingTop: 16,
  },
  submitBtn: {
    backgroundColor: "#161b2e",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  submitBtnDisabled: {
    backgroundColor: "#A0A0A0",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
