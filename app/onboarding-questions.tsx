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
  Animated as RNAnimated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Network from "expo-network";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/colors";
import { useNutrition, UserGoals } from "@/lib/nutrition-context";
import { useAuth } from "@/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInRight,
  FadeOutLeft,
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Svg, {
  Path,
  Circle,
  G,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { saveUserGoals, syncAllDataToFirebase } from "@/lib/firebase-data";

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function createEmptyLog(date: string): any {
  return {
    date,
    entries: [],
    weight: undefined,
  };
}

const ITEM_HEIGHT = 40;

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
        style={{ height: ITEM_HEIGHT * 5, width: "100%" }}>
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

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function WeightResultsChart() {
  const line1Progress = useSharedValue(0);
  const line2Progress = useSharedValue(0);

  useEffect(() => {
    line1Progress.value = withTiming(1, {
      duration: 1800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    line2Progress.value = withDelay(
      400,
      withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
    );
  }, []);

  const line1Props = useAnimatedProps(() => ({
    strokeDashoffset: (1 - line1Progress.value) * 600,
  }));

  const line2Props = useAnimatedProps(() => ({
    strokeDashoffset: (1 - line2Progress.value) * 600,
  }));

  // Accurate paths based on the chart in the image
  const startX = 30;
  const startY = 40;
  const endX = 250;

  // Traditional Diet: dips then rebounds higher
  const tradPath = `M ${startX} ${startY} C 80 ${startY}, 110 90, 140 70 C 170 50, 210 20, ${endX} 20`;

  // Calzz: smooth descent to weight loss plateau
  const calzzPath = `M ${startX} ${startY} C 80 ${startY}, 130 90, 160 105 C 190 120, 230 120, ${endX} 120`;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Your weight</Text>

      <View style={styles.chartArea}>
        <Svg width="100%" height={180} viewBox="0 0 280 140">
          <Defs>
            <SvgGradient id="gradCalzz" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#000" stopOpacity="0.08" />
              <Stop offset="1" stopColor="#000" stopOpacity="0" />
            </SvgGradient>
          </Defs>

          {/* Guidelines */}
          <Line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={startY}
            stroke="#E5E5E5"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <Line
            x1={startX}
            y1={100}
            x2={endX}
            y2={100}
            stroke="#F0F0F0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Fills */}
          <Path
            d={`${calzzPath} L ${endX} 140 L ${startX} 140 Z`}
            fill="url(#gradCalzz)"
          />

          {/* Traditional Diet labels */}
          <SvgText
            x={endX}
            y={55}
            textAnchor="end"
            fontSize="11"
            fill="#666"
            fontFamily="Poppins_400Regular">
            Traditional diet
          </SvgText>

          {/* Traditional Path (Red) */}
          <AnimatedPath
            d={tradPath}
            stroke="#EF4444"
            strokeWidth={2.5}
            fill="none"
            strokeDasharray="600"
            animatedProps={line2Props}
          />

          {/* Calzz Path (Black) */}
          <AnimatedPath
            d={calzzPath}
            stroke="#111"
            strokeWidth={3}
            fill="none"
            strokeDasharray="600"
            animatedProps={line1Props}
          />

          {/* Start and End nodes */}
          <Circle
            cx={startX}
            cy={startY}
            r="5"
            fill="white"
            stroke="#111"
            strokeWidth={2}
          />
          <Circle
            cx={endX}
            cy={120}
            r="5"
            fill="white"
            stroke="#111"
            strokeWidth={2}
          />

          {/* Month labels */}
          <G transform="translate(0, 138)">
            <SvgText
              x={startX}
              y="0"
              fontSize="11"
              fill="#999"
              fontFamily="Poppins_500Medium">
              Month 1
            </SvgText>
            <SvgText
              x={endX}
              y="0"
              textAnchor="end"
              fontSize="11"
              fill="#999"
              fontFamily="Poppins_500Medium">
              Month 6
            </SvgText>
          </G>
        </Svg>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendCalzz}>
          <Text style={styles.legendCalzzText}>Calzz</Text>
        </View>
        {/* <View style={styles.legendWeightPill}>
          <Text style={styles.legendWeightText}>Weight</Text>
        </View> */}
      </View>
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
    id: "height_weight",
    title: "Height & Weight",
    subtitle: "Used to determine your daily caloric needs and metabolic rate.",
    type: "height_weight",
  },
  {
    id: "age",
    title: "What is your Age?",
    subtitle: "Age affects your metabolic rate and caloric needs.",
    type: "age",
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
    id: "target_weight",
    title: "What is your Target Weight?",
    subtitle: "We'll calculate your calorie needs based on this goal.",
    type: "target_weight",
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
    id: "results",
    title: "Calzz creates long-term results",
    subtitle:
      "80% of Calzz users maintain their weight loss even 6 months later",
    type: "results",
  },
  {
    id: "welcome",
    title: "Thank you for trusting us!",
    subtitle: "Now let's personalize Calzz for you...",
    type: "welcome",
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
  const { goals, updateGoals, updateWeight, initializeNewUser } =
    useNutrition();
  const {
    signInWithGoogle,
    user,
    isSigningIn,
    setIsNewUser,
    setIsMidOnboarding,
  } = useAuth();

  useEffect(() => {
    setIsMidOnboarding(true);
    // Load persisted state to handle Android background kills during OAuth
    AsyncStorage.getItem("onboarding_state").then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.step !== undefined) setStep(parsed.step);
          if (parsed.answers) setAnswers(parsed.answers);
        } catch (e) {
          console.error("Failed to parse onboarding state", e);
        }
      }
    });

    return () => setIsMidOnboarding(false);
  }, []);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    gender: "",
    height: 170, // default cm
    weight: 70, // default kg
    age: 25,
    goal: "",
    target_weight: 70,
    activity: "",
    workouts: "",
    diet: "",
  });

  // Save state on every change
  useEffect(() => {
    AsyncStorage.setItem(
      "onboarding_state",
      JSON.stringify({ step, answers }),
    ).catch(console.error);
  }, [step, answers]);

  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    fadeAnim.setValue(0);
    RNAnimated.sequence([
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.delay(2000),
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(""));
  };

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
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected && networkState.isConnected !== null) {
      showToast("No network connection. Please check your internet.");
      setIsCalculatingBMR(false);
      return;
    }

    // Save data locally
    await AsyncStorage.setItem("onboarding_answers", JSON.stringify(answers));

    // Calculate BMR and Macros
    let weightKg = isImperial ? answers.weight * 0.453592 : answers.weight;
    let weightLbs = isImperial
      ? answers.weight
      : Math.round(answers.weight * 2.20462);

    let targetWeightLbs = isImperial
      ? answers.target_weight
      : Math.round(answers.target_weight * 2.20462);

    let heightCm = isImperial ? (ft * 12 + inch) * 2.54 : answers.height;
    let heightFtFinal = isImperial
      ? ft
      : Math.floor(answers.height / 2.54 / 12);
    let heightInFinal = isImperial
      ? inch
      : Math.round((answers.height / 2.54) % 12);

    let age = answers.age;

    // Mifflin-St Jeor Equation
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (answers.gender === "male") bmr += 5;
    else if (answers.gender === "female") bmr -= 161;
    else bmr -= 78;

    let multiplier = 1.2;
    if (answers.activity === "light") multiplier = 1.375;
    else if (answers.activity === "moderate") multiplier = 1.55;
    else if (answers.activity === "active") multiplier = 1.725;

    let tdee = bmr * multiplier;

    let goalOffset = 0;
    if (answers.goal === "lose") {
      goalOffset = -500;
    } else if (answers.goal === "gain") {
      goalOffset = 500;
    }

    let dailyCalories = Math.max(1200, Math.round(tdee + goalOffset));

    let pPct = 0.3;
    let cPct = 0.4;
    let fPct = 0.3;
    if (answers.diet === "keto") {
      pPct = 0.25;
      cPct = 0.05;
      fPct = 0.7;
    } else if (answers.diet === "vegan") {
      pPct = 0.2;
      cPct = 0.55;
      fPct = 0.25;
    } else if (answers.diet === "high-protein") {
      pPct = 0.4;
      cPct = 0.3;
      fPct = 0.3;
    }

    let proteinGoal = Math.round((dailyCalories * pPct) / 4);
    let carbsGoal = Math.round((dailyCalories * cPct) / 4);
    let fatGoal = Math.round((dailyCalories * fPct) / 9);

    const newGoals: UserGoals = {
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
      fiberGoal: 0,
      sugarGoal: 0,
      sodiumGoal: 0,
    };

    if (user) {
      await initializeNewUser(user.uid, newGoals, weightLbs).catch(
        console.error,
      );
    } else {
      updateGoals(newGoals);
      updateWeight(weightLbs);
    }

    setIsNewUser(false);
    setIsMidOnboarding(false);
    await AsyncStorage.setItem("onboarding_done", "true");
    await AsyncStorage.removeItem("onboarding_state"); // Clean up state
    router.replace("/(tabs)");
  };

  const handleGoogleSignIn = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected && networkState.isConnected !== null) {
      showToast("No network connection. Please check your internet.");
      return;
    }
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
    currentQuestion.type !== "height_weight" &&
    currentQuestion.type !== "target_weight" &&
    currentQuestion.type !== "age" &&
    currentQuestion.type !== "results" &&
    currentQuestion.type !== "welcome" &&
    currentQuestion.id !== "auth";
  const progress = (step + 1) / QUESTIONS.length;

  const feetItems = Array.from({ length: 6 }, (_, i) => i + 3); // 3 to 8
  const inchItems = Array.from({ length: 12 }, (_, i) => i); // 0 to 11
  const cmItems = Array.from({ length: 161 }, (_, i) => i + 90); // 90 to 250

  const kgItems = Array.from({ length: 181 }, (_, i) => i + 20); // 20 to 200
  const lbItems = Array.from({ length: 451 }, (_, i) => i + 50); // 50 to 500
  const ageItems = Array.from({ length: 116 }, (_, i) => i + 5); // 5 to 120

  return (
    <View style={styles.container}>
      {toastMessage ? (
        <RNAnimated.View
          style={[styles.toastContainer, { opacity: fadeAnim }]}
          pointerEvents="none">
          <Ionicons name="wifi-outline" size={20} color="#fff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </RNAnimated.View>
      ) : null}

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
          {currentQuestion.type !== "results" && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {currentQuestion.subtitle}
            </Text>
          )}

          {currentQuestion.type === "welcome" ? (
            <View
              style={{
                alignItems: "center",
                width: "100%",
                paddingTop: 10,
              }}>
              <View style={styles.illustrationWrap}>
                <LinearGradient
                  colors={["#f8f1ffff", "#eef5ffff"]}
                  style={styles.illustrationCircle}
                />
                <MaterialCommunityIcons
                  name="hand-clap"
                  size={80}
                  color="#111"
                />
              </View>
              <View style={styles.privacyCard}>
                <View style={styles.lockBadge}>
                  <View style={styles.lockSeal}>
                    <MaterialCommunityIcons
                      name="lock"
                      size={16}
                      color="#111"
                    />
                  </View>
                </View>
                <Text style={styles.privacyTitle}>
                  Your privacy and security matter to us.
                </Text>
                <Text style={styles.privacyText}>
                  We promise to always keep your personal information private
                  and secure.
                </Text>
              </View>
            </View>
          ) : currentQuestion.type === "results" ? (
            <View style={{ width: "100%" }}>
              <WeightResultsChart />
              <Text style={styles.resultsSubtitle}>
                {currentQuestion.subtitle}
              </Text>
            </View>
          ) : currentQuestion.type === "height_weight" ? (
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

              {/* Labels Row */}
              <View style={styles.labelsRow}>
                <View style={styles.columnHeader}>
                  <Text style={styles.columnLabel}>Height</Text>
                </View>
                <View style={styles.columnHeader}>
                  <Text style={styles.columnLabel}>Weight</Text>
                </View>
              </View>

              <View style={styles.pickersRow}>
                {/* Height Column */}
                <View style={styles.pickerColumn}>
                  {isImperial ? (
                    <View style={styles.heightPickers}>
                      <CustomPicker
                        items={feetItems}
                        selectedValue={ft}
                        onValueChange={setFt}
                        label="ft"
                        width={65}
                      />
                      <CustomPicker
                        items={inchItems}
                        selectedValue={inch}
                        onValueChange={setInch}
                        label="in"
                        width={65}
                      />
                    </View>
                  ) : (
                    <CustomPicker
                      items={cmItems}
                      selectedValue={answers.height}
                      onValueChange={(v: any) =>
                        setAnswers({ ...answers, height: v })
                      }
                      label="cm"
                      width={130}
                    />
                  )}
                </View>

                {/* Weight Column */}
                <View style={styles.pickerColumn}>
                  {isImperial ? (
                    <CustomPicker
                      items={lbItems}
                      selectedValue={answers.weight}
                      onValueChange={(v: any) =>
                        setAnswers({ ...answers, weight: v })
                      }
                      label="lb"
                      width={130}
                    />
                  ) : (
                    <CustomPicker
                      items={kgItems}
                      selectedValue={answers.weight}
                      onValueChange={(v: any) =>
                        setAnswers({ ...answers, weight: v })
                      }
                      label="kg"
                      width={130}
                    />
                  )}
                </View>
              </View>
            </View>
          ) : currentQuestion.type === "age" ? (
            <View style={styles.pickerWrapper}>
              <View style={[styles.pickerColumn, { marginTop: 20 }]}>
                <CustomPicker
                  items={ageItems}
                  selectedValue={answers.age}
                  onValueChange={(v: any) => setAnswers({ ...answers, age: v })}
                  label="years old"
                  width={200}
                />
              </View>
            </View>
          ) : currentQuestion.type === "target_weight" ? (
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

              <View style={styles.pickerColumn}>
                {isImperial ? (
                  <CustomPicker
                    items={lbItems}
                    selectedValue={answers.target_weight}
                    onValueChange={(v: any) =>
                      setAnswers({ ...answers, target_weight: v })
                    }
                    label="lb"
                    width={180}
                  />
                ) : (
                  <CustomPicker
                    items={kgItems}
                    selectedValue={answers.target_weight}
                    onValueChange={(v: any) =>
                      setAnswers({ ...answers, target_weight: v })
                    }
                    label="kg"
                    width={180}
                  />
                )}
              </View>
            </View>
          ) : currentQuestion.type === "auth" ? (
            isCalculatingBMR ? (
              <View style={styles.analyzingContainer}>
                <View style={styles.analyzingCircle}>
                  <Svg width={140} height={140} viewBox="0 0 100 100">
                    <Circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="rgba(0,0,0,0.05)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <AnimatedCircle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="#111"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * bmrProgress) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </Svg>
                  <View style={styles.analyzingPercentContainer}>
                    <Text style={styles.analyzingPercentText}>
                      {bmrProgress}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.analyzingHeadline}>
                  Tailoring your experience
                </Text>
                <Text style={styles.analyzingSubhead}>
                  We're calibrating Calzz to your unique metabolism and
                  personalized health goals...
                </Text>

                <View style={styles.analyzingStatusBadge}>
                  <ActivityIndicator size="small" color="#111" />
                  <Text style={styles.analyzingStatusText}>
                    Calculating BMR & Macros
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.premiumAuthContainer}>
                {/* <View style={styles.premiumAuthIcon}>
                  <LinearGradient
                    colors={["#111", "#333333ff"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <AntDesign name="google" size={40} color="#fff" />
                </View> */}

                <Text style={styles.premiumAuthTitle}>
                  Your journey starts here
                </Text>
                {/* <Text style={styles.premiumAuthSubtitle}>
                  Connect your account to save your progress and access personalized
                  nutrition insights.
                </Text> */}

                <Pressable
                  style={({ pressed }) => [
                    styles.googleButtonPremium,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleGoogleSignIn}
                  disabled={isSigningIn}>
                  {isSigningIn ? (
                    <ActivityIndicator color="#111" />
                  ) : (
                    <>
                      <AntDesign name="google" size={24} color="#111" />
                      <Text style={styles.googleButtonTextPremium}>
                        Continue with Google
                      </Text>
                    </>
                  )}
                </Pressable>

                <Text style={styles.authLegalText}>
                  By continuing, you agree to our{" "}
                  <Text
                    style={styles.legalLink}
                    onPress={() => router.push("/terms")}>
                    Terms of Service
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={styles.legalLink}
                    onPress={() => router.push("/privacy-policy")}>
                    Privacy Policy
                  </Text>
                </Text>
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
    fontFamily: "Poppins_600SemiBold",
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
    fontFamily: "Poppins_600SemiBold",
  },
  // Chart Styles
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 15,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
    width: "100%",
  },
  chartTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 20,
    color: "#111",
  },
  chartArea: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  legendContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    gap: 10,
  },
  legendCalzz: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  legendCalzzText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  legendWeightPill: {
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  legendWeightText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  resultsSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#444",
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  // Welcome Step Styles
  illustrationWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  illustrationCircle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 150,
    opacity: 0.8,
  },
  privacyCard: {
    backgroundColor: "#F9F9FF",
    borderRadius: 24,
    padding: 24,
    marginTop: 60,
    width: "100%",
    position: "relative",
    alignItems: "center",
  },
  lockBadge: {
    position: "absolute",
    top: -20,
    alignItems: "center",
    justifyContent: "center",
  },
  lockSeal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  privacyText: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
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
    paddingVertical: 5,
    borderRadius: 70,
    textAlign: "center",
    textAlignVertical: "center",
  },
  unitBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
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
    textAlign: "center",
    width: "100%",
    lineHeight: ITEM_HEIGHT,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  pickerItemTextSelected: {
    color: "#1A1A1A",
    fontFamily: "Poppins_600SemiBold",
    lineHeight: ITEM_HEIGHT,
  },
  // Added for Height/Weight combined UI
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  columnHeader: {
    flex: 1,
    alignItems: "center",
  },
  columnLabel: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#1A1A1A",
  },
  pickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  pickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  heightPickers: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  // Premium Auth & Analyzing Styles
  analyzingContainer: {
    paddingTop: 10,
    width: "100%",
    alignItems: "center",
  },
  analyzingCircle: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  analyzingPercentContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  analyzingPercentText: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: "#111",
  },
  analyzingHeadline: {
    fontSize: 22,
    fontFamily: "Poppins_600SemiBold",
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
  },
  analyzingSubhead: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  analyzingStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 100,
    gap: 8,
  },
  analyzingStatusText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#111",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  premiumAuthContainer: {
    alignItems: "center",
    paddingTop: 20,
    width: "100%",
  },
  premiumAuthIcon: {
    width: 80,
    height: 80,
    borderRadius: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumAuthTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
  },
  premiumAuthSubtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
    marginBottom: 48,
  },
  googleButtonPremium: {
    flexDirection: "row",
    backgroundColor: "#fff",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  googleButtonTextPremium: {
    color: "#111",
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  authLegalText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
    marginTop: 20,
  },
  legalLink: {
    color: "#111",
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
  },
  toastContainer: {
    position: "absolute",
    bottom: 150, // Higher up on onboarding questions
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
