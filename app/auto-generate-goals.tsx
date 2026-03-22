import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  Animated as RNAnimated,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RadialSlider } from 'react-native-radial-slider';
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNutrition } from "@/lib/nutrition-context";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// We'll reuse the CustomPicker from onboarding
const ITEM_HEIGHT = 50;

function CustomPicker({
  items,
  selectedValue,
  onValueChange,
  label,
  width = 120,
}: any) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = items.findIndex((i: any) => i === selectedValue);
    if (index >= 0 && scrollViewRef.current) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [items]);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (items[index] !== undefined && items[index] !== selectedValue) {
      onValueChange(items[index]);
    }
  };

  return (
    <View style={[pickerStyles.pickerContainer, { width }]}>
      <View style={pickerStyles.selectionHighlight} />
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
            <View key={idx} style={pickerStyles.pickerItem}>
              <Text
                style={[
                  pickerStyles.pickerItemText,
                  isSelected && pickerStyles.pickerItemTextSelected,
                ]}>
                {item} {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const QUESTIONS = [
  {
    id: "goal",
    title: "What is your goal?",
    subtitle:
      "By selecting 'Next', I consent to the processing of data concerning my health.",
    options: [
      { label: "Lose Weight", value: "lose" },
      { label: "Maintain", value: "maintain" },
      { label: "Gain Weight", value: "gain" },
    ],
  },
  {
    id: "gender",
    title: "Gender & Age",
    subtitle:
      "Required to accurately calculate your Basal Metabolic Rate (BMR).",
    type: "gender_age",
  },
  {
    id: "height",
    title: "How tall are you?",
    type: "height",
  },
  {
    id: "weight",
    title: "Current weight?",
    type: "weight",
  },
  {
    id: "workouts",
    title: "How many workouts do you do per week?",
    subtitle: "Choose the option that best aligns with you.",
    options: [
      { label: "0 - 2", subLabel: "Workouts now and then", value: "1.2" }, // Sedentary/Light
      { label: "3 - 5", subLabel: "A few workouts per week", value: "1.55" }, // Moderate
      { label: "6+", subLabel: "Dedicated athlete", value: "1.725" }, // Active
    ],
  },
  {
    id: "desiredWeight",
    title: "Choose your desired weight?",
    type: "desiredWeight",
  },
  {
    id: "speed",
    title: "How fast do you want to reach your goal?",
    type: "speed",
  },
];

const MIN_SPEED = 0.2;
const MAX_SPEED = 3.0;

function SpeedMeter({
  speed,
  onSpeedChange,
  isImperial = true,
}: {
  speed: number;
  onSpeedChange: (val: number) => void;
  isImperial?: boolean;
}) {
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const SLIDER_WIDTH = SCREEN_WIDTH * 0.85;
  const THUMB_SIZE = 32;

  const speedToX = (s: number) => ((s - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * (SLIDER_WIDTH - THUMB_SIZE);
  const xToSpeed = (x: number) => MIN_SPEED + (x / (SLIDER_WIDTH - THUMB_SIZE)) * (MAX_SPEED - MIN_SPEED);

  const panX = useRef(new RNAnimated.Value(speedToX(speed))).current;
  
  useEffect(() => {
    const id = panX.addListener(({ value }) => {
      let clampedX = Math.max(0, Math.min(value, SLIDER_WIDTH - THUMB_SIZE));
      let newSpeed = xToSpeed(clampedX);
      newSpeed = Math.round(newSpeed * 10) / 10;
      onSpeedChange(newSpeed);
    });
    return () => panX.removeListener(id);
  }, [onSpeedChange, panX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        (panX as any).extractOffset();
      },
      onPanResponderMove: RNAnimated.event([null, { dx: panX }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        (panX as any).flattenOffset();
        
        let currentX = (panX as any)._value; 
        let clampedX = Math.max(0, Math.min(currentX, SLIDER_WIDTH - THUMB_SIZE));
        
        let newSpeed = Math.round(xToSpeed(clampedX) * 10) / 10;
        let snappedX = speedToX(newSpeed);

        RNAnimated.spring(panX, {
          toValue: snappedX,
          useNativeDriver: false,
          bounciness: 0
        }).start();
      },
    })
  ).current;

  const activeWidth = panX.interpolate({
    inputRange: [-1000, 0, SLIDER_WIDTH - THUMB_SIZE, 10000],
    outputRange: [0, 0, SLIDER_WIDTH - THUMB_SIZE, SLIDER_WIDTH - THUMB_SIZE],
    extrapolate: 'clamp'
  });

  const thumbTransform = panX.interpolate({
    inputRange: [-1000, 0, SLIDER_WIDTH - THUMB_SIZE, 10000],
    outputRange: [0, 0, SLIDER_WIDTH - THUMB_SIZE, SLIDER_WIDTH - THUMB_SIZE],
    extrapolate: 'clamp'
  });

  return (
    <View style={{ width: '100%', alignItems: 'center', marginVertical: 20 }}>
      {/* Top emojis */}
      <View style={{ width: SLIDER_WIDTH, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 32 }}>🦥</Text>
        <Text style={{ fontSize: 32 }}>🐇</Text>
        <Text style={{ fontSize: 32 }}>🐆</Text>
      </View>

      {/* Track */}
      <View style={{ width: SLIDER_WIDTH, height: 40, justifyContent: 'center' }}>
        {/* Background Track */}
        <View style={{ position: 'absolute', width: SLIDER_WIDTH, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 }} />
        
        {/* Fill Track */}
        <RNAnimated.View style={{ position: 'absolute', height: 6, backgroundColor: '#1A1A1A', borderRadius: 3, width: activeWidth }} />

        {/* Thumb Container */}
        <RNAnimated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            left: 0,
            transform: [{ translateX: thumbTransform }],
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: '#1A1A1A',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 3,
            borderColor: '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </View>

      {/* Labels below */}
      <View style={{ width: SLIDER_WIDTH, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
        <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#111" }}>0.2 {isImperial ? "lbs" : "kg"}</Text>
        <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#111" }}>1.5 {isImperial ? "lbs" : "kg"}</Text>
        <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#111" }}>3.0 {isImperial ? "lbs" : "kg"}</Text>
      </View>
    </View>
  );
}

export default function AutoGenerateGoalsScreen() {
  const insets = useSafeAreaInsets();
  const { goals, updateGoals, updateWeight } = useNutrition();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    goal: "lose",
    gender: "female",
    age: 30,
    height: 170,
    weight: 70,
    workouts: "1.2",
    desiredWeight: 65,
    speed: 1.0, // lbs per week
  });

  const [isImperial, setIsImperial] = useState(true);
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(6);

  // Derive active questions (skip desiredWeight and speed if maintaining)
  const activeQuestions = QUESTIONS.filter((q) => {
    if (
      answers.goal === "maintain" &&
      (q.id === "desiredWeight" || q.id === "speed")
    )
      return false;
    return true;
  });

  const currentQuestion = activeQuestions[step];

  const handleSelect = (key: string, val: any) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setAnswers({ ...answers, [key]: val });
  };

  const handleNext = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < activeQuestions.length - 1) {
      setStep(step + 1);
    } else {
      generateAndSave();
    }
  };

  const generateAndSave = () => {
    // Calculate BMR and Macros using Mifflin-St Jeor
    let weightKg = isImperial ? answers.weight * 0.453592 : answers.weight;
    let weightLbs = isImperial ? answers.weight : answers.weight * 2.20462;

    let heightCm = isImperial ? (ft * 12 + inch) * 2.54 : answers.height;
    let heightFtFinal = isImperial
      ? ft
      : Math.floor(answers.height / 2.54 / 12);
    let heightInFinal = isImperial
      ? inch
      : Math.round((answers.height / 2.54) % 12);

    let age = answers.age;

    // BMR
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (answers.gender === "male") bmr += 5;
    else bmr -= 161;

    let multiplier = parseFloat(answers.workouts);
    let tdee = bmr * multiplier;

    let goalOffset = 0;
    let targetWeightLbs = weightLbs;

    if (answers.goal === "lose") {
      // 1 lb of fat is ~3500 calories
      // Deficit per day = (speed in lbs * 3500) / 7
      goalOffset = -((answers.speed * 3500) / 7);
      targetWeightLbs = isImperial
        ? answers.desiredWeight
        : answers.desiredWeight * 2.20462;
    } else if (answers.goal === "gain") {
      goalOffset = (answers.speed * 3500) / 7;
      targetWeightLbs = isImperial
        ? answers.desiredWeight
        : answers.desiredWeight * 2.20462;
    }

    let dailyCalories = Math.max(1200, Math.round(tdee + goalOffset));

    // Balanced split as default (can be fine-tuned)
    let pPct = 0.3;
    let cPct = 0.4;
    let fPct = 0.3;

    let proteinGoal = Math.round((dailyCalories * pPct) / 4);
    let carbsGoal = Math.round((dailyCalories * cPct) / 4);
    let fatGoal = Math.round((dailyCalories * fPct) / 9);

    updateGoals({
      heightFt: heightFtFinal,
      heightIn: heightInFinal,
      dailyCalories,
      proteinGoal,
      carbsGoal,
      fatGoal,
      targetWeight: targetWeightLbs,
      currentWeight: weightLbs,
      gender: answers.gender,
      dateOfBirth: `01/01/${new Date().getFullYear() - age}`,
    });

    updateWeight(weightLbs);
    router.back();
  };

  const handleBack = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const renderContent = () => {
    if (currentQuestion.type === "gender_age") {
      return (
        <View style={{ gap: 30, paddingTop: 20 }}>
          <View style={{ flexDirection: "row", gap: 20 }}>
            {["female", "male"].map((g) => (
              <Pressable
                key={g}
                onPress={() => handleSelect("gender", g)}
                style={[
                  styles.optionButton,
                  { flex: 1 },
                  answers.gender === g
                    ? { backgroundColor: "#111" }
                    : { backgroundColor: "#f0f0f4" },
                ]}>
                <Text
                  style={[
                    styles.optionText,
                    answers.gender === g
                      ? { color: "#fff" }
                      : { color: "#111" },
                  ]}>
                  {g === "female" ? "Female" : "Male"}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Poppins_600SemiBold",
                marginBottom: 20,
              }}>
              Age
            </Text>
            <CustomPicker
              items={Array.from({ length: 80 }, (_, i) => i + 5)}
              selectedValue={answers.age}
              onValueChange={(v: any) => handleSelect("age", v)}
              label="years"
              width={200}
            />
          </View>
        </View>
      );
    }

    if (
      currentQuestion.type === "height" ||
      currentQuestion.type === "weight" ||
      currentQuestion.type === "desiredWeight"
    ) {
      const isWeight = currentQuestion.type.toLowerCase().includes("weight");
      const answerKey = currentQuestion.id;

      const feetItems = Array.from({ length: 6 }, (_, i) => i + 3);
      const inchItems = Array.from({ length: 12 }, (_, i) => i);
      const cmItems = Array.from({ length: 161 }, (_, i) => i + 90);
      const kgItems = Array.from({ length: 201 }, (_, i) => i + 30);
      const lbItems = Array.from({ length: 451 }, (_, i) => i + 70);

      return (
        <View style={styles.pickerWrapper}>
          <View style={styles.unitToggle}>
            <Pressable
              onPress={() => setIsImperial(false)}
              style={[styles.unitBtn, !isImperial && styles.unitBtnActive]}>
              <Text
                style={[
                  styles.unitBtnText,
                  !isImperial && styles.unitBtnTextActive,
                ]}>
                Metric
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsImperial(true)}
              style={[styles.unitBtn, isImperial && styles.unitBtnActive]}>
              <Text
                style={[
                  styles.unitBtnText,
                  isImperial && styles.unitBtnTextActive,
                ]}>
                Imperial
              </Text>
            </Pressable>
          </View>

          <View style={styles.pickerControl}>
            {currentQuestion.type === "height" ? (
              isImperial ? (
                <View style={styles.dualPicker}>
                  <CustomPicker
                    items={feetItems}
                    selectedValue={ft}
                    onValueChange={setFt}
                    label="ft"
                    width={90}
                  />
                  <CustomPicker
                    items={inchItems}
                    selectedValue={inch}
                    onValueChange={setInch}
                    label="in"
                    width={90}
                  />
                </View>
              ) : (
                <CustomPicker
                  items={cmItems}
                  selectedValue={answers.height}
                  onValueChange={(v: any) => handleSelect("height", v)}
                  label="cm"
                  width={180}
                />
              )
            ) : isImperial ? (
              <CustomPicker
                items={lbItems}
                selectedValue={answers[answerKey]}
                onValueChange={(v: any) => handleSelect(answerKey, v)}
                label="lb"
                width={180}
              />
            ) : (
              <CustomPicker
                items={kgItems}
                selectedValue={answers[answerKey]}
                onValueChange={(v: any) => handleSelect(answerKey, v)}
                label="kg"
                width={180}
              />
            )}
          </View>
        </View>
      );
    }

    if (currentQuestion.type === "speed") {
      return (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Poppins_400Regular",
              marginBottom: 10,
            }}>
            {answers.goal === "lose" ? "Lose" : "Gain"} weight speed per week
          </Text>
          <Text
            style={{
              fontSize: 36,
              fontFamily: "Poppins_700Bold",
              marginBottom: 50,
            }}>
            {answers.speed.toFixed(1)} {isImperial ? "lbs" : "kg"}
          </Text>

          <View
            style={{
              width: "100%",
              alignItems: "center",
              position: "relative",
              marginBottom: 10,
            }}>
            <SpeedMeter
              speed={answers.speed}
              onSpeedChange={(val) => handleSelect("speed", val)}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.optionsList}>
        {currentQuestion.options?.map((opt: any) => {
          const isSelected = answers[currentQuestion.id] === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => handleSelect(currentQuestion.id, opt.value)}
              style={[
                styles.optionButton,
                isSelected
                  ? { backgroundColor: "#111" }
                  : { backgroundColor: "#f8f8fc" },
                opt.subLabel && {
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  gap: 16,
                },
              ]}>
              {opt.subLabel && (
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: isSelected ? "#333" : "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <Text
                    style={{
                      color: isSelected ? "#fff" : "#111",
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 15,
                    }}>
                    {opt.label}
                  </Text>
                </View>
              )}

              <View
                style={{
                  flex: 1,
                  alignItems: opt.subLabel ? "flex-start" : "center",
                }}>
                <Text
                  style={[
                    styles.optionText,
                    isSelected ? { color: "#fff" } : { color: "#111" },
                  ]}>
                  {opt.subLabel ? opt.subLabel : opt.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const progress = (step + 1) / activeQuestions.length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
          <Ionicons name="arrow-back" size={24} color={"#111"} />
        </Pressable>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: "rgba(0,0,0,0.1)" },
            ]}
          />
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: "#111" },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={
          currentQuestion.type !== "gender_age" &&
          currentQuestion.type !== "height" &&
          currentQuestion.type !== "weight" &&
          currentQuestion.type !== "desiredWeight"
        }
        showsVerticalScrollIndicator={false}>
        <Animated.View
          key={step}
          entering={FadeInRight.duration(400)}
          exiting={FadeOutLeft.duration(400)}
          style={styles.animatedContent}>
          <Text style={styles.title}>{currentQuestion.title}</Text>
          {currentQuestion.subtitle && (
            <Text style={styles.subtitle}>{currentQuestion.subtitle}</Text>
          )}
          {renderContent()}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            { backgroundColor: "#111" },
            pressed && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleNext}>
          <Text style={styles.continueText}>
            {step === activeQuestions.length - 1
              ? "Auto Generate Goals"
              : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  progressTrack: { ...StyleSheet.absoluteFillObject },
  progressFill: { height: "100%", borderRadius: 2 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    minHeight: 450,
  },
  animatedContent: { width: "100%" },
  title: {
    fontSize: 25,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 8,
    color: "#111",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginBottom: 32,
    lineHeight: 24,
    color: "#666",
  },
  optionsList: { gap: 16 },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontSize: 15, fontFamily: "Poppins_600SemiBold" },
  footer: { paddingHorizontal: 24, paddingTop: 16 },
  continueButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: { color: "#fff", fontSize: 18, fontFamily: "Poppins_700Bold" },
  // Pickers
  pickerWrapper: { alignItems: "center", width: "100%", paddingTop: 20 },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 25,
    padding: 4,
    marginBottom: 40,
  },
  unitBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  unitBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unitBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#888",
  },
  unitBtnTextActive: { color: "#111" },
  pickerControl: {
    height: ITEM_HEIGHT * 5,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dualPicker: { flexDirection: "row", gap: 20 },
  tick: {
    width: 2,
    borderRadius: 1,
  },
  currentWeightText: {
    fontSize: 14,
    color: "#1A1A1A",
    fontFamily: "Poppins_400Regular",
  },
});

const pickerStyles = StyleSheet.create({
  pickerContainer: { height: ITEM_HEIGHT * 5, position: "relative" },
  selectionHighlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    zIndex: 0,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pickerItemText: {
    fontSize: 20,
    fontFamily: "Poppins_500Medium",
    color: "rgba(0,0,0,0.2)",
  },
  pickerItemTextSelected: {
    color: "#111",
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
  },
});
