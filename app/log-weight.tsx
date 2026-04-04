import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNutrition } from "@/lib/nutrition-context";
import { useThemeColors } from "@/constants/colors";
import * as Network from "expo-network";

const ITEM_HEIGHT = 40;

function CustomPicker({
  items,
  selectedValue,
  onValueChange,
  label,
  width = 140,
}: any) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = items.findIndex((i: any) => i === selectedValue);
    if (index >= 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (items[index] !== undefined && items[index] !== selectedValue) {
      onValueChange(items[index]);
    }
  };

  return (
    <View style={[styles.pickerContainer, { width }]}>
      <View style={styles.selectionHighlight} />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        style={{ height: ITEM_HEIGHT * 5 }}>
        {items.map((item: any, idx: number) => {
          const isSelected = item === selectedValue;
          return (
            <View key={idx} style={styles.pickerItem}>
              <Text
                style={[
                  styles.pickerItemText,
                  isSelected && styles.pickerItemTextSelected,
                ]}>
                {item}{label ? ` ${label}` : ""}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function LogWeightScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors(undefined);
  const { goals, logWeightForDate } = useNutrition();

  const [weightDate, setWeightDate] = useState(new Date());
  
  const [isImperial, setIsImperial] = useState(true);
  
  const initialLb = goals.currentWeight || 150;
  const initialLbInt = Math.floor(initialLb);
  const initialLbDec = Math.round((initialLb - initialLbInt) * 10);

  const initialKgRaw = initialLb * 0.453592;
  const initialKgInt = Math.floor(initialKgRaw);
  const initialKgDec = Math.round((initialKgRaw - initialKgInt) * 10);

  const [weightLb, setWeightLb] = useState(initialLbInt);
  const [weightLbDec, setWeightLbDec] = useState(initialLbDec);
  
  const [weightKg, setWeightKg] = useState(initialKgInt);
  const [weightKgDec, setWeightKgDec] = useState(initialKgDec);

  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(""));
  };

  const topInset = Platform.OS === "web" ? 40 : insets.top + 20;

  const handleBack = () => router.back();

  const handleLogWeight = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected && networkState.isConnected !== null) {
      showToast("No network connection. Please check your internet.");
      return;
    }

    const finalLb = weightLb + (weightLbDec * 0.1);
    const finalKg = weightKg + (weightKgDec * 0.1);
    
    let finalWeightLb = isImperial ? finalLb : finalKg * 2.20462;
    finalWeightLb = Math.round(finalWeightLb * 10) / 10;
    
    if (finalWeightLb > 0) {
      const dateStr = weightDate.toISOString().split("T")[0];
      await logWeightForDate(dateStr, finalWeightLb);
      router.back();
    }
  };

  const shiftDate = (days: number) => {
    const newDate = new Date(weightDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) {
      setWeightDate(newDate);
    }
  };

  const isToday = weightDate.toDateString() === new Date().toDateString();

  const weightItemsLb = Array.from({ length: 251 }, (_, i) => i + 50); // 50 to 300
  const weightItemsKg = Array.from({ length: 181 }, (_, i) => i + 20); // 20 to 200
  const decimalItems = Array.from({ length: 10 }, (_, i) => i); // 0 to 9

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>
      {toastMessage ? (
        <Animated.View
          style={[styles.toastContainer, { opacity: fadeAnim }]}
          pointerEvents="none">
          <Ionicons name="wifi-outline" size={20} color="#fff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      <View style={[styles.header, { marginTop: topInset }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: "#F7F7F7", opacity: pressed ? 0.7 : 1 },
          ]}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>Log Weight</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
      
        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <Pressable onPress={() => shiftDate(-1)} style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.dateText}>
            {isToday
              ? "Today"
              : weightDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
          </Text>
          <Pressable
            onPress={() => shiftDate(1)}
            style={[
              styles.dateArrow,
              isToday && { opacity: 0.3 },
            ]}
            disabled={isToday}>
            <Ionicons name="chevron-forward" size={24} color="#1A1A1A" />
          </Pressable>
        </View>

        {/* Toggle Imperial / Metric */}
        <View style={styles.toggleRow}>
          <Text
            style={[
              styles.toggleText,
              isImperial ? styles.toggleTextActive : styles.toggleTextInactive,
            ]}>
            Imperial
          </Text>
          <Pressable
            style={[
              styles.toggleSwitch,
              !isImperial ? styles.switchDark : styles.switchLight,
            ]}
            onPress={() => setIsImperial(!isImperial)}>
            <View
              style={[
                styles.switchThumb,
                isImperial ? styles.thumbLeft : styles.thumbRight,
              ]}
            />
          </Pressable>
          <Text
            style={[
              styles.toggleText,
              !isImperial ? styles.toggleTextActive : styles.toggleTextInactive,
            ]}>
            Metric
          </Text>
        </View>

        {/* Pickers Section */}
        <View style={styles.selectionArea}>
          <View style={styles.labelsRow}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnLabel}>Weight</Text>
            </View>
          </View>

          <View style={styles.pickersCenter}>
            {isImperial ? (
              <View style={styles.splitPickerRow}>
                <CustomPicker
                  items={weightItemsLb}
                  selectedValue={weightLb}
                  onValueChange={setWeightLb}
                  label=""
                  width={80}
                />
                <Text style={styles.decimalDot}>.</Text>
                <CustomPicker
                  items={decimalItems}
                  selectedValue={weightLbDec}
                  onValueChange={setWeightLbDec}
                  label="lb"
                  width={80}
                />
              </View>
            ) : (
              <View style={styles.splitPickerRow}>
                <CustomPicker
                  items={weightItemsKg}
                  selectedValue={weightKg}
                  onValueChange={setWeightKg}
                  label=""
                  width={80}
                />
                <Text style={styles.decimalDot}>.</Text>
                <CustomPicker
                  items={decimalItems}
                  selectedValue={weightKgDec}
                  onValueChange={setWeightKgDec}
                  label="kg"
                  width={80}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleLogWeight}>
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  content: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  
  // Date Selector
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 40,
    alignSelf: "center",
    width: "100%",
    maxWidth: 300,
  },
  dateArrow: {
    padding: 8,
  },
  dateText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    gap: 16,
  },
  toggleText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  toggleTextActive: { color: "#1A1A1A" },
  toggleTextInactive: { color: "#D3D3D3" },
  toggleSwitch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 3,
    justifyContent: "center",
  },
  switchLight: { backgroundColor: "#E0E0E0" },
  switchDark: { backgroundColor: "#2A2A2E" },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
  },
  thumbLeft: { alignSelf: "flex-start" },
  thumbRight: { alignSelf: "flex-end" },

  // Picker
  selectionArea: {
    flex: 1,
    alignItems: "center",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    width: "100%",
  },
  columnHeader: {
    alignItems: "center",
  },
  columnLabel: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  pickersCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  pickerContainer: {
    height: ITEM_HEIGHT * 5,
    position: "relative",
  },
  selectionHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: "#EBEBEB",
    borderRadius: 10,
    zIndex: 0,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pickerItemText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#C0C0C0",
  },
  pickerItemTextSelected: {
    color: "#1A1A1A",
    fontFamily: "Poppins_600SemiBold",
  },
  splitPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  decimalDot: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#1A1A1A",
    marginHorizontal: 4,
    marginBottom: 4,
  },

  // Footer / Submit
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  saveBtn: {
    backgroundColor: "black", // Keep the premium green goal feel
    borderRadius: 100,
    paddingVertical: 10,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  toastContainer: {
    position: "absolute",
    bottom: 300,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 999,
  },
  toastText: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    flex: 1,
  },
});
