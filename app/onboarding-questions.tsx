import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/colors";
import { useNutrition } from "@/lib/nutrition-context";
import { useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

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
      // Use a longer delay to ensure the screen transition animation finished
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
    id: "height",
    title: "How Tall are you?",
    subtitle: "Height is used for calculating BMI and metabolic rate.",
    type: "height",
  },
  {
    id: "weight",
    title: "Current Weight?",
    subtitle: "Used to determine your daily caloric needs.",
    type: "weight",
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
    id: "auth",
    title: "Create your Account",
    subtitle: "Almost done! Save your progress and start tracking your meals.",
    type: "auth",
  },
];

export default function OnboardingQuestionsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors("light");
  const { width } = useWindowDimensions();
  const { goals, updateGoals, updateWeight } = useNutrition();
  const { signInWithGoogle, user, isSigningIn } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    gender: "",
    height: 170, // default cm
    weight: 70, // default kg
    age: "",
    goal: "",
    activity: "",
    workouts: "",
    diet: "",
  });

  const [isImperial, setIsImperial] = useState(false);
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(6);

  const [isCalculatingBMR, setIsCalculatingBMR] = useState(false);
  const [bmrProgress, setBmrProgress] = useState(0);

  const currentQuestion = QUESTIONS[step];

  const handleSelect = (val: any) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setAnswers({ ...answers, [currentQuestion.id]: val });
  };

  const handleNext = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Logic handled by the "Continue" or Google button in the auth step
    }
  };

  const handleFinishOnboarding = async () => {
    // Save data locally
    await AsyncStorage.setItem("onboarding_answers", JSON.stringify(answers));

    // Calculate BMR and Macros
    let weightKg = isImperial ? answers.weight * 0.453592 : answers.weight;
    let weightLbs = isImperial ? answers.weight : Math.round(answers.weight * 2.20462);

    let heightCm = isImperial ? (ft * 12 + inch) * 2.54 : answers.height;
    let heightFtFinal = isImperial ? ft : Math.floor((answers.height / 2.54) / 12);
    let heightInFinal = isImperial ? inch : Math.round((answers.height / 2.54) % 12);

    let age = 30;
    if (answers.age === "18-24") age = 21;
    else if (answers.age === "25-34") age = 30;
    else if (answers.age === "35-44") age = 40;
    else if (answers.age === "45+") age = 50;

    // Mifflin-St Jeor Equation
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    if (answers.gender === "male") bmr += 5;
    else if (answers.gender === "female") bmr -= 161;
    else bmr -= 78;

    let multiplier = 1.2;
    if (answers.activity === "light") multiplier = 1.375;
    else if (answers.activity === "moderate") multiplier = 1.55;
    else if (answers.activity === "active") multiplier = 1.725;

    let tdee = bmr * multiplier;

    let goalOffset = 0;
    let targetWeightLbs = weightLbs;
    if (answers.goal === "lose") {
        goalOffset = -500;
        targetWeightLbs = Math.round(weightLbs * 0.9);
    } else if (answers.goal === "gain") {
        goalOffset = 500;
        targetWeightLbs = Math.round(weightLbs * 1.1);
    }
    
    let dailyCalories = Math.max(1200, Math.round(tdee + goalOffset));

    let pPct = 0.3; let cPct = 0.4; let fPct = 0.3;
    if (answers.diet === "keto") { pPct = 0.25; cPct = 0.05; fPct = 0.70; }
    else if (answers.diet === "vegan") { pPct = 0.20; cPct = 0.55; fPct = 0.25; }
    else if (answers.diet === "high-protein") { pPct = 0.40; cPct = 0.30; fPct = 0.30; }

    let proteinGoal = Math.round((dailyCalories * pPct) / 4);
    let carbsGoal = Math.round((dailyCalories * cPct) / 4);
    let fatGoal = Math.round((dailyCalories * fPct) / 9);

    updateGoals({
      dietPreference: answers.diet as any,
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
    router.replace("/(tabs)");
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  useEffect(() => {
    if (user && currentQuestion.id === "auth" && !isCalculatingBMR) {
      setIsCalculatingBMR(true);
    }
  }, [user, currentQuestion.id]);

  useEffect(() => {
    if (isCalculatingBMR) {
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p > 100) p = 100;
        setBmrProgress(p);
        if (p === 100) {
          clearInterval(interval);
          handleFinishOnboarding();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isCalculatingBMR]);

  const handleBack = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const isNextDisabled =
    !answers[currentQuestion.id] &&
    currentQuestion.id !== "height" &&
    currentQuestion.id !== "weight" &&
    currentQuestion.id !== "auth";
  const progress = (step + 1) / QUESTIONS.length;

  const feetItems = Array.from({ length: 6 }, (_, i) => i + 3); // 3 to 8
  const inchItems = Array.from({ length: 12 }, (_, i) => i); // 0 to 11
  const cmItems = Array.from({ length: 161 }, (_, i) => i + 90); // 90 to 250

  const kgItems = Array.from({ length: 181 }, (_, i) => i + 20); // 20 to 200
  const lbItems = Array.from({ length: 451 }, (_, i) => i + 50); // 50 to 500

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
        scrollEnabled={
          currentQuestion.type !== "height" && currentQuestion.type !== "weight"
        }
        showsVerticalScrollIndicator={false}>
        <Animated.View
          key={step}
          entering={FadeInRight.duration(400)}
          exiting={FadeOutLeft.duration(400)}
          style={styles.animatedContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            {currentQuestion.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentQuestion.subtitle}
          </Text>

          {currentQuestion.type === "height" ||
          currentQuestion.type === "weight" ? (
            <View style={styles.pickerWrapper}>
              {/* Toggle Metric/Imperial inside the question */}
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
                {currentQuestion.id === "height" ? (
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
                      onValueChange={(v: any) => handleSelect(v)}
                      label="cm"
                      width={180}
                    />
                  )
                ) : isImperial ? (
                  <CustomPicker
                    items={lbItems}
                    selectedValue={answers.weight}
                    onValueChange={(v: any) => handleSelect(v)}
                    label="lb"
                    width={180}
                  />
                ) : (
                  <CustomPicker
                    items={kgItems}
                    selectedValue={answers.weight}
                    onValueChange={(v: any) => handleSelect(v)}
                    label="kg"
                    width={180}
                  />
                )}
              </View>
            </View>
          ) : currentQuestion.type === "auth" ? (
            isCalculatingBMR ? (
                <View style={[styles.authContainer, { marginTop: 40 }]}>
                  <Text style={{ fontSize: 20, fontFamily: "Poppins_600SemiBold", marginBottom: 20, textAlign: "center" }}>
                    Analyzing your profile...
                  </Text>
                  <View style={{ width: '100%', height: 10, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                     <View style={{ width: `${bmrProgress}%`, height: '100%', backgroundColor: '#111' }} />
                  </View>
                  <Text style={{ marginTop: 15, fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#111", textAlign: "center" }}>
                    {bmrProgress}%
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: 14, color: "#666", textAlign: "center", fontFamily: "Poppins_500Medium" }}>
                    Calculating custom {answers.goal === "lose" ? "Weight Loss" : answers.goal === "gain" ? "Muscle Gain" : "Maintenance"} plan...
                  </Text>
                </View>
            ) : (
              <View style={styles.authContainer}>
                <View style={styles.authIconContainer}>
                  <AntDesign name="google" size={48} color="#111" />
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.googleButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleGoogleSignIn}
                  disabled={isSigningIn}>
                  {isSigningIn ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <AntDesign name="google" size={25} color="#fff" />
                      <Text style={styles.googleButtonText}>
                        Sign in with Google
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )
          ) : (
            <View style={styles.optionsList}>
              {currentQuestion.options?.map((opt) => {
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
          )}
        </Animated.View>
      </ScrollView>

      {currentQuestion.type !== "auth" && (
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
      )}
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
    minHeight: 450, // Added minHeight for stability
  },
  animatedContent: {
    width: "100%",
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
  // Picker Styles
  pickerWrapper: {
    alignItems: "center",
    width: "100%",
    paddingTop: 20,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 25,
    padding: 4,
    marginBottom: 40,
  },
  unitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
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
  unitBtnTextActive: {
    color: "#111",
  },
  pickerControl: {
    height: ITEM_HEIGHT * 5,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dualPicker: {
    flexDirection: "row",
    gap: 20,
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
    fontSize: 22,
    fontFamily: "Poppins_500Medium",
    color: "rgba(0,0,0,0.2)",
  },
  pickerItemTextSelected: {
    color: "#111",
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
  },
  // Auth Step Styles
  authContainer: {
    alignItems: "center",
    paddingTop: 40,
    width: "100%",
  },
  authIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#111",
    width: "100%",
    paddingVertical: 10,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  skipLink: {
    padding: 10,
  },
  skipLinkText: {
    color: "#888",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    textDecorationLine: "underline",
  },
});
