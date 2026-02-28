import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

const QUESTIONS = [
  {
    id: "gender",
    title: "Choose your Gender",
    subtitle: "This will be used to calibrate your custom plan.",
    options: [
      { label: "Female", value: "female" },
      { label: "Male", value: "male" },
      { label: "Other", value: "other" },
    ],
  },
  {
    id: "age",
    title: "What is your Age?",
    subtitle: "Age affects your metabolic rate and caloric needs.",
    options: [
      { label: "18 - 24 years", value: "18-24" },
      { label: "25 - 34 years", value: "25-34" },
      { label: "35 - 44 years", value: "35-44" },
      { label: "45+ years", value: "45+" },
    ],
  },
  {
    id: "goal",
    title: "What is your primary Goal?",
    subtitle: "We'll tailor your calorie and macro targets to this.",
    options: [
      { label: "Lose Weight", value: "lose" },
      { label: "Maintain Weight", value: "maintain" },
      { label: "Gain Muscle", value: "gain" },
    ],
  },
  {
    id: "activity",
    title: "Base Activity Level",
    subtitle: "Not including structured exercise.",
    options: [
      { label: "Sedentary (Desk Job)", value: "sedentary" },
      { label: "Lightly Active", value: "light" },
      { label: "Moderately Active", value: "moderate" },
      { label: "Very Active", value: "active" },
    ],
  },
  {
    id: "workouts",
    title: "Workouts per Week",
    subtitle: "How many days do you typically exercise?",
    options: [
      { label: "Rarely (0-1)", value: "0-1" },
      { label: "Sometimes (2-3)", value: "2-3" },
      { label: "Often (4-5)", value: "4-5" },
      { label: "Always (6+)", value: "6+" },
    ],
  },
  {
    id: "diet",
    title: "Dietary Preference",
    subtitle: "Do you follow a specific nutritional plan?",
    options: [
      { label: "Balanced / No Restrictions", value: "balanced" },
      { label: "Keto / Low Carb", value: "keto" },
      { label: "Vegan / Plant-Based", value: "vegan" },
      { label: "High-Protein", value: "high-protein" },
    ],
  },
  {
    id: "sleep",
    title: "Average Sleep",
    subtitle: "Crucial for recovery and hormone balance.",
    options: [
      { label: "Less than 5 hours", value: "<5" },
      { label: "5 - 7 hours", value: "5-7" },
      { label: "7 - 9 hours", value: "7-9" },
      { label: "More than 9 hours", value: ">9" },
    ],
  },
  {
    id: "water",
    title: "Water Intake",
    subtitle: "How much water do you normally drink?",
    options: [
      { label: "Less than 1L", value: "<1" },
      { label: "1 - 2 Liters", value: "1-2" },
      { label: "2 - 3 Liters", value: "2-3" },
      { label: "3+ Liters", value: "3+" },
    ],
  },
  {
    id: "rate",
    title: "Pacing",
    subtitle: "How fast do you want to see changes?",
    options: [
      { label: "Slow & Steady", value: "slow" },
      { label: "Moderate", value: "moderate" },
      { label: "Aggressive", value: "fast" },
    ],
  },
  {
    id: "motivation",
    title: "Primary Motivation",
    subtitle: "What is driving you the most right now?",
    options: [
      { label: "Feel Healthier", value: "health" },
      { label: "Look Better", value: "appearance" },
      { label: "High Energy", value: "energy" },
      { label: "Medical Reasons", value: "medical" },
    ],
  },
];

export default function OnboardingQuestionsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors("light");
  const { width } = useWindowDimensions();
  const { updateGoals } = useNutrition();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = QUESTIONS[step];

  const handleSelect = (val: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setAnswers({ ...answers, [currentQuestion.id]: val });
  };

  const handleNext = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Save data locally
      await AsyncStorage.setItem("onboarding_answers", JSON.stringify(answers));

      // Update relevant goals if answered
      if (answers.diet) {
        updateGoals({ dietPreference: answers.diet as any });
      }

      router.replace("/(tabs)");
    }
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

  const isNextDisabled = !answers[currentQuestion.id];
  const progress = (step + 1) / QUESTIONS.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#dfffa2ff", "#f3f4d4ff"]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.header,
          { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 20 },
        ]}>
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
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
              { width: `${progress * 100}%`, backgroundColor: colors.text },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeInRight} exiting={FadeOutLeft}>
          <Text style={[styles.title, { color: colors.text }]}>
            {currentQuestion.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentQuestion.subtitle}
          </Text>

          <View style={styles.optionsList}>
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentQuestion.id] === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  style={[
                    styles.optionButton,
                    isSelected
                      ? { backgroundColor: "#111111" }
                      : { backgroundColor: "rgba(255, 255, 255, 0.7)" },
                  ]}>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected
                        ? { color: "#ffffff" }
                        : { color: colors.text },
                    ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            { backgroundColor: "#111111" },
            isNextDisabled && { opacity: 0.5 },
            pressed && !isNextDisabled && { transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleNext}
          disabled={isNextDisabled}>
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
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
  progressTrack: {
    ...StyleSheet.absoluteFillObject,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsList: {
    gap: 16,
  },
  optionButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  continueButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
});
