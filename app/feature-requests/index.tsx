import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { getFirebaseDatabase } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

type Tab = "Most Voted" | "Newest";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  commentsCount: number;
  createdAt: number;
  createdBy: string;
  upvotedBy?: Record<string, boolean>;
}

export default function FeatureRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Most Voted");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const db = getFirebaseDatabase();

    // Load requests
    const requstsRef = ref(db, "feature_requests");
    const unsubscribeRequests = onValue(
      requstsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const parsed: FeatureRequest[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            upvotes: data[key].upvotes || 0,
            commentsCount: data[key].commentsCount || 0,
            upvotedBy: data[key].upvotedBy || {},
          }));
          setRequests(parsed);
        } else {
          setRequests([]);
        }
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Failed to load feature requests:", error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribeRequests();
    };
  }, [user]);

  useEffect(() => {
    const unsub = loadData();
    return () => {
      if (unsub) unsub();
    };
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleUpvote = async (requestId: string, currentUpvotes: number) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const db = getFirebaseDatabase();
    const req = requests.find((r) => r.id === requestId);
    const isUpvoted = !!req?.upvotedBy?.[user.uid];

    const updates: any = {};
    updates[`feature_requests/${requestId}/upvotes`] = isUpvoted
      ? currentUpvotes - 1
      : currentUpvotes + 1;
    updates[`feature_requests/${requestId}/upvotedBy/${user.uid}`] = isUpvoted
      ? null
      : true;

    await update(ref(db), updates);
  };

  const filteredRequests = requests
    .filter(
      (req) =>
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      if (activeTab === "Most Voted") {
        return b.upvotes - a.upvotes;
      } else {
        return b.createdAt - a.createdAt;
      }
    });

  return (
    <View style={styles.container}>
      <View
        style={[styles.topSection, { paddingTop: Math.max(insets.top, 50) }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.headerTitle}>Send Feedback</Text>
          <Pressable onPress={handleRefresh} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="#1A1A1A" />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.mainTitle}>Feature Requests</Text>
          <Pressable
            style={styles.createBtn}
            onPress={() => router.push("/feature-requests/create")}>
            <Ionicons
              name="pencil-outline"
              size={14}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.createBtnText}>Create</Text>
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          {(["Most Voted", "Newest"] as Tab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabItem}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#A0A0A0"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search feature requests..."
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }>
          {filteredRequests.map((req) => {
            const upvoted = !!(user && req.upvotedBy?.[user.uid]);
            return (
              <Pressable
                key={req.id}
                style={styles.card}
                onPress={() =>
                  router.push(`/feature-requests/${req.id}` as any)
                }>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {req.title}
                  </Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {req.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={14}
                      color="#A0A0A0"
                    />
                    <Text style={styles.commentsText}>{req.commentsCount}</Text>
                  </View>
                </View>
                <Pressable
                  style={[
                    styles.upvoteWrap,
                    upvoted && styles.upvoteWrapActive,
                  ]}
                  onPress={() => handleUpvote(req.id, req.upvotes)}>
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={upvoted ? "#1A1A1A" : "#808080"}
                  />
                  <Text
                    style={[
                      styles.upvoteNum,
                      upvoted && styles.upvoteNumActive,
                    ]}>
                    {req.upvotes}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  topSection: {
    backgroundColor: "#fff",
    paddingBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: "Poppins_400Regular",
    color: "#1A1A1A",
  },
  createBtn: {
    backgroundColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 24,
  },
  createBtnText: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 24,
  },
  tabItem: {
    paddingBottom: 6,
    position: "relative",
  },
  tabText: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#808080",
  },
  tabTextActive: {
    fontFamily: "Poppins_500Medium",
    color: "#1A1A1A",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#1A1A1A",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    marginHorizontal: 16,
    borderRadius: 100,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: "#1A1A1A",
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: "center",
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
    paddingTop: 16,
    paddingBottom: 60,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentsText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#A0A0A0",
  },
  upvoteWrap: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    minWidth: 54,
  },
  upvoteWrapActive: {
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
});
