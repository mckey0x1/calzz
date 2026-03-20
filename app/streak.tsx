import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function StreakScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fefaf7", "#fcfcfd", "#f8f9fa"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 20 : insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Streak</Text>
        <View style={{ width: 44 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        <View style={styles.mainContent}>
          {/* Large Large Flame */}
          <View style={styles.largeStreakContainer}>
            <Ionicons name="flame" size={200} color="#FF9F1C" style={styles.largeFlameIcon} />
            <View style={styles.largeStreakBubble}>
              <Text style={styles.largeStreakNumber}>0</Text>
            </View>
          </View>

          <Text style={styles.streakLabelMain}>Day streak</Text>
          
          <View style={styles.milestoneBox}>
            <Text style={styles.milestoneText}>
              Consistency is the key to success. Keep logging your food every day to maintain your streak!
            </Text>
          </View>

          {/* Weekly Dots for reference */}
          <View style={styles.weekDisplay}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <View key={i} style={styles.dayCol}>
                <Text style={styles.dayLabelSmall}>{day}</Text>
                <View style={[styles.dayCircle, i < 1 ? styles.dayCircleActive : null]} />
              </View>
            ))}
          </View>

          <Pressable 
             onPress={() => router.back()}
             style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Keep it going!</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: 40,
  },
  largeStreakContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  largeFlameIcon: {
    textShadowColor: 'rgba(255,159,28,0.2)',
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 20,
  },
  largeStreakBubble: {
    position: 'absolute',
    bottom: 0,
    minWidth: 90,
    height: 110,
    borderRadius: 45,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#fcf6e8',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  largeStreakNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FF9F1C',
  },
  streakLabelMain: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF9F1C',
    marginTop: 10,
    marginBottom: 20,
  },
  milestoneBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    width: '100%',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#f0f0f5',
  },
  milestoneText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  weekDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 50,
  },
  dayCol: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabelSmall: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f1f5',
  },
  dayCircleActive: {
    backgroundColor: '#FF9F1C',
  },
  doneBtn: {
    backgroundColor: '#111',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
