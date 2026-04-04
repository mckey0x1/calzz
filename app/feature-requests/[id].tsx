import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Image,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseDatabase } from "@/lib/firebase";
import { ref, onValue, push, set, update, get } from "firebase/database";
import * as Haptics from "expo-haptics";

interface Comment {
  id: string;
  text: string;
  createdAt: number;
  createdBy: string;
  authorName?: string;
  authorPhotoUrl?: string;
}

interface RequestDetail {
  title: string;
  description: string;
  commentsCount: number;
  createdBy: string;
  createdAt?: number;
  upvotes?: number;
  upvotedBy?: Record<string, boolean>;
  authorName?: string;
  authorPhotoUrl?: string;
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function FeatureRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  const [isEditingRequest, setIsEditingRequest] = useState(false);
  const [editRequestTitle, setEditRequestTitle] = useState("");
  const [editRequestDescription, setEditRequestDescription] = useState("");

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const db = getFirebaseDatabase();

    const reqRef = ref(db, `feature_requests/${id}`);
    const unsubReq = onValue(
      reqRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setRequest(data);

          if (data.comments) {
            const parsed: Comment[] = Object.keys(data.comments)
              .map((key) => ({
                id: key,
                ...data.comments[key],
              }))
              .sort((a, b) => a.createdAt - b.createdAt);
            setComments(parsed);
          } else {
            setComments([]);
          }
        } else {
          setRequest(null);
          setComments([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching feature request:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubReq();
    };
  }, [id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !id) return;
    setSubmitting(true);

    try {
      const db = getFirebaseDatabase();
      const commentsRef = ref(db, `feature_requests/${id}/comments`);
      const newCommentRef = push(commentsRef);

      // Create new comment
      await set(newCommentRef, {
        text: newComment.trim(),
        createdAt: Date.now(),
        createdBy: user.uid,
        authorName: user.displayName || "User",
        authorPhotoUrl: user.photoURL || "",
      });

      // Update comments count safely
      const reqRef = ref(db, `feature_requests/${id}/commentsCount`);
      const snapshot = await get(reqRef);
      const currentCount = snapshot.exists() ? snapshot.val() : 0;
      await update(ref(db, `feature_requests/${id}`), {
        commentsCount: currentCount + 1,
      });

      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const db = getFirebaseDatabase();
      await update(ref(db, `feature_requests/${id}/comments`), {
        [commentId]: null,
      });

      const reqRef = ref(db, `feature_requests/${id}/commentsCount`);
      const snapshot = await get(reqRef);
      const currentCount = snapshot.exists() ? snapshot.val() : 0;
      await update(ref(db, `feature_requests/${id}`), {
        commentsCount: Math.max(0, currentCount - 1),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = (commentId: string) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteComment(commentId),
        },
      ],
    );
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const db = getFirebaseDatabase();
      await update(ref(db, `feature_requests/${id}/comments/${commentId}`), {
        text: editCommentText.trim(),
      });
      setEditingCommentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpvote = async () => {
    if (!user || !request) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const db = getFirebaseDatabase();
    const isUpvoted = !!request.upvotedBy?.[user.uid];

    const currentUpvotes = request.upvotes || 0;
    const updates: any = {};
    updates[`feature_requests/${id}/upvotes`] = isUpvoted
      ? currentUpvotes - 1
      : currentUpvotes + 1;
    updates[`feature_requests/${id}/upvotedBy/${user.uid}`] = isUpvoted
      ? null
      : true;

    await update(ref(db), updates);
  };

  const handleDeleteRequest = async () => {
    try {
      const db = getFirebaseDatabase();
      await set(ref(db, `feature_requests/${id}`), null);
      router.back();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDeleteRequest = () => {
    Alert.alert(
      "Delete Request",
      "Are you sure you want to delete this feature request?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: handleDeleteRequest },
      ],
    );
  };

  const handleSaveRequestEdit = async () => {
    if (!editRequestTitle.trim() || !editRequestDescription.trim()) return;
    try {
      const db = getFirebaseDatabase();
      await update(ref(db, `feature_requests/${id}`), {
        title: editRequestTitle.trim(),
        description: editRequestDescription.trim(),
      });
      setIsEditingRequest(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 50) }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Details & Comments</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}>
        {request && (
          <View style={styles.reqBlock}>
             <View style={styles.reqHeaderRow}>
               <Pressable 
                 style={[styles.upvoteBox, !!request.upvotedBy?.[user?.uid || ""] && styles.upvoteBoxActive]} 
                 onPress={handleUpvote}>
                 <Ionicons name="chevron-up" size={18} color={!!request.upvotedBy?.[user?.uid || ""] ? "#1A1A1A" : "#808080"} />
                 <Text style={[styles.upvoteNum, !!request.upvotedBy?.[user?.uid || ""] && styles.upvoteNumActive]}>
                   {request.upvotes || 0}
                 </Text>
               </Pressable>
               <View style={styles.reqTitleContainer}>
                 {isEditingRequest ? (
                    <TextInput
                      style={[styles.input, { marginBottom: 12 }]}
                      value={editRequestTitle}
                      onChangeText={setEditRequestTitle}
                      placeholder="Title"
                    />
                 ) : (
                    <Text style={styles.reqTitle}>{request.title}</Text>
                 )}
               </View>
             </View>

             <View style={styles.authorRow}>
                <View style={styles.authorRowLeft}>
                  {request.authorPhotoUrl ? (
                    <Image source={{ uri: request.authorPhotoUrl }} style={styles.avatarDark} />
                  ) : (
                    <View style={styles.avatarDark}>
                      <Text style={styles.avatarTextDark}>
                        {request.authorName ? request.authorName.charAt(0).toUpperCase() : "A"}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.authorText}>{request.authorName || "Anonymous"}</Text>
                </View>
                {user?.uid === request.createdBy && !isEditingRequest && (
                  <View style={styles.reqActions}>
                    <Pressable
                      onPress={() => {
                        setEditRequestTitle(request.title);
                        setEditRequestDescription(request.description);
                        setIsEditingRequest(true);
                      }}
                      style={styles.actionIcon}>
                      <Ionicons name="pencil-outline" size={16} color="#808080" />
                    </Pressable>
                    <Pressable onPress={confirmDeleteRequest} style={styles.actionIcon}>
                      <Ionicons name="trash-outline" size={16} color="#e65c5c" />
                    </Pressable>
                  </View>
                )}
             </View>

             {isEditingRequest ? (
                <View>
                  <TextInput
                    style={[
                      styles.input,
                      { minHeight: 80, paddingVertical: 10, marginBottom: 16 },
                    ]}
                    value={editRequestDescription}
                    onChangeText={setEditRequestDescription}
                    placeholder="Description"
                    multiline
                  />
                  <View style={styles.editActions}>
                    <Pressable onPress={handleSaveRequestEdit} style={styles.saveEditBtn}>
                      <Text style={styles.saveEditBtnText}>Save</Text>
                    </Pressable>
                    <Pressable onPress={() => setIsEditingRequest(false)}>
                      <Text style={styles.cancelEditBtnText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
             ) : (
                <View>
                  <Text style={styles.reqDesc}>{request.description}</Text>
                  {request.createdAt && (
                    <Text style={styles.dateText}>{formatDate(request.createdAt)}</Text>
                  )}
                </View>
             )}
          </View>
        )}

        <View style={styles.commentInputCard}>
          <TextInput
            style={styles.commentInputArea}
            placeholder="Leave a comment..."
            placeholderTextColor="#A0A0A0"
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <Pressable
            style={[styles.submitButton, !newComment.trim() && styles.submitButtonDisabled]}
            onPress={handlePostComment}
            disabled={submitting || !newComment.trim()}>
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </Pressable>
        </View>

        {comments.map((c) => (
          <View key={c.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <View style={styles.authorRowLeft}>
                {c.authorPhotoUrl ? (
                  <Image source={{ uri: c.authorPhotoUrl }} style={styles.avatarDark} />
                ) : (
                  <View style={styles.avatarDark}>
                     <Text style={styles.avatarTextDark}>
                       {c.authorName ? c.authorName.charAt(0).toUpperCase() : "A"}
                     </Text>
                  </View>
                )}
                <Text style={styles.authorText}>{c.authorName || "Anonymous"}</Text>
              </View>
              {user?.uid === c.createdBy && (
                <View style={styles.commentActions}>
                  <Pressable
                    onPress={() => {
                      setEditingCommentId(c.id);
                      setEditCommentText(c.text);
                    }}
                    style={styles.actionIcon}>
                    <Ionicons name="pencil-outline" size={16} color="#808080" />
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(c.id)} style={styles.actionIcon}>
                    <Ionicons name="trash-outline" size={16} color="#e65c5c" />
                  </Pressable>
                </View>
              )}
            </View>
            
            {editingCommentId === c.id ? (
               <View>
                 <TextInput
                   style={[
                     styles.input,
                     { marginTop: 4, minHeight: 60, paddingVertical: 10, marginBottom: 12 },
                   ]}
                   value={editCommentText}
                   onChangeText={setEditCommentText}
                   multiline
                 />
                 <View style={styles.editActions}>
                   <Pressable onPress={() => handleSaveEdit(c.id)} style={styles.saveEditBtn}>
                     <Text style={styles.saveEditBtnText}>Save</Text>
                   </Pressable>
                   <Pressable onPress={() => setEditingCommentId(null)}>
                     <Text style={styles.cancelEditBtnText}>Cancel</Text>
                   </Pressable>
                 </View>
               </View>
            ) : (
               <View>
                 <Text style={styles.commentText}>{c.text}</Text>
                 {c.createdAt && <Text style={styles.dateText}>{formatDate(c.createdAt)}</Text>}
               </View>
            )}
          </View>
        ))}
      </ScrollView>
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
  loaderCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 40,
  },
  reqBlock: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  reqHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  upvoteBox: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginRight: 16,
    minWidth: 48,
  },
  upvoteBoxActive: {
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
  },
  upvoteNum: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    marginTop: 4,
  },
  upvoteNumActive: {
    color: "#111827",
  },
  reqTitleContainer: {
    flex: 1,
  },
  reqTitle: {
    fontSize: 20,
    fontFamily: "Poppins_400Regular",
    color: "#1A1A1A",
    lineHeight: 28,
  },
  reqActions: {
    flexDirection: "row",
    gap: 8,
  },
  reqDesc: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#4A4A4A",
    lineHeight: 24,
    marginBottom: 16,
  },
  authorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  authorRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarDark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarTextDark: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  authorText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#4A4A4A",
  },
  dateText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#A0A0A0",
  },
  commentsHeader: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
    marginBottom: 16,
    marginLeft: 4,
    display: 'none',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
    textAlign: "center",
    marginTop: 20,
    display: 'none',
  },
  commentInputCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  commentInputArea: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#000000ff",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: "flex-end",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    justifyContent: "center",
    alignItems: "center",
  },
  commentCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  commentText: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#4A4A4A",
    lineHeight: 24,
    marginBottom: 14,
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
  },
  saveEditBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveEditBtnText: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  cancelEditBtnText: {
    color: "#6B7280",
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  input: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    minHeight: 40,
    color: "#1A1A1A",
  },
});
