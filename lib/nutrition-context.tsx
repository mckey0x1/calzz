import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  saveUserGoals,
  saveDailyLog,
  loadUserGoals,
  loadDailyLog,
  loadWeekLogs,
  syncAllDataToFirebase,
} from "./firebase-data";
import { analyzeFoodImageBase64 } from "./gemini";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: number;
  imageUri?: string;
  confidence?: number;
}

export interface DailyLog {
  date: string;
  entries: FoodEntry[];
  waterGlasses: number;
  steps: number;
  weight?: number;
}

export interface UserGoals {
  dailyCalories: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  targetWeight: number;
  currentWeight: number;
  dietPreference: "balanced" | "keto" | "vegan" | "high-protein";
  waterGoal: number;
  stepsGoal: number;
  heightFt?: number;
  heightIn?: number;
  dateOfBirth?: string;
  gender?: string;
  fiberGoal?: number;
  sugarGoal?: number;
  sodiumGoal?: number;
}

interface NutritionContextValue {
  todayLog: DailyLog;
  weekLogs: DailyLog[];
  goals: UserGoals;
  addFoodEntry: (entry: Omit<FoodEntry, "id" | "timestamp">) => void;
  removeFoodEntry: (id: string) => void;
  addWater: () => void;
  removeWater: () => void;
  updateGoals: (goals: Partial<UserGoals>) => void;
  updateWeight: (weight: number) => void;
  setFirebaseUid: (uid: string | null) => void;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  isLoading: boolean;
  isAnalyzing: boolean;
  analyzingImage: string | null;
  setAnalyzing: (val: boolean, img?: string) => void;
  scanResult: any | null;
  analyzingPercent: number;
  analyzeFood: (base64Image: string, uri: string) => Promise<void>;
  clearScanResult: () => void;
  currentStreak: number;
  last7Days: DailyLog[];
  weekStatus: boolean[];
}

const NutritionContext = createContext<NutritionContextValue | null>(null);

const EMPTY_GOALS: UserGoals = {
  dailyCalories: 0,
  proteinGoal: 0,
  carbsGoal: 0,
  fatGoal: 0,
  targetWeight: 0,
  currentWeight: 0,
  dietPreference: "balanced",
  waterGoal: 8,
  stepsGoal: 10000,
  heightFt: 0,
  heightIn: 0,
  fiberGoal: 0,
  sugarGoal: 0,
  sodiumGoal: 0,
};

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createEmptyLog(date: string): DailyLog {
  return {
    date,
    entries: [],
    waterGlasses: 0,
    steps: Math.floor(Math.random() * 4000 + 3000),
    weight: undefined,
  };
}



export function NutritionProvider({ children }: { children: ReactNode }) {
  const [todayLog, setTodayLog] = useState<DailyLog>(
    createEmptyLog(getDateKey()),
  );
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<UserGoals>(EMPTY_GOALS);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [analyzingPercent, setAnalyzingPercent] = useState(0);
  const firebaseUidRef = useRef<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [goalsData, todayData, weekData] = await Promise.all([
        AsyncStorage.getItem("nutriai_goals"),
        AsyncStorage.getItem(`nutriai_log_${getDateKey()}`),
        AsyncStorage.getItem("nutriai_week_logs"),
      ]);

      if (goalsData) setGoals(JSON.parse(goalsData));
      if (todayData) {
        setTodayLog(JSON.parse(todayData));
      } else {
        const initialLog = createEmptyLog(getDateKey());
        setTodayLog(initialLog);
      }

      if (weekData) {
        let parsed = JSON.parse(weekData);
        if (parsed.length < 30) {
           const logs: DailyLog[] = [];
           for (let i = 30; i >= 1; i--) {
             const d = new Date();
             d.setDate(d.getDate() - i);
             const dateStr = getDateKey(d);
             logs.push(parsed.find((l: any) => l.date === dateStr) || createEmptyLog(dateStr));
           }
           parsed = logs;
        }
        setWeekLogs(parsed);
      } else {
        const logs: DailyLog[] = [];
        for (let i = 30; i >= 1; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const log = createEmptyLog(getDateKey(d));
          logs.push(log);
        }
        setWeekLogs(logs);
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function syncToFirebase(log: DailyLog, currentGoals?: UserGoals) {
    const uid = firebaseUidRef.current;
    if (!uid) return;
    try {
      await saveDailyLog(uid, log);
      if (currentGoals) await saveUserGoals(uid, currentGoals);
    } catch (e) {
      console.error("Firebase sync error:", e);
    }
  }

  async function saveTodayLog(log: DailyLog) {
    setTodayLog(log);
    await AsyncStorage.setItem(
      `nutriai_log_${getDateKey()}`,
      JSON.stringify(log),
    );
    syncToFirebase(log);
  }

  function addFoodEntry(entry: Omit<FoodEntry, "id" | "timestamp">) {
    const newEntry: FoodEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };
    const updated = { ...todayLog, entries: [...todayLog.entries, newEntry] };
    saveTodayLog(updated);
  }

  function removeFoodEntry(id: string) {
    const updated = {
      ...todayLog,
      entries: todayLog.entries.filter((e) => e.id !== id),
    };
    saveTodayLog(updated);
  }

  function addWater() {
    const updated = { ...todayLog, waterGlasses: todayLog.waterGlasses + 1 };
    saveTodayLog(updated);
  }

  function removeWater() {
    if (todayLog.waterGlasses > 0) {
      const updated = { ...todayLog, waterGlasses: todayLog.waterGlasses - 1 };
      saveTodayLog(updated);
    }
  }

  async function updateGoals(newGoals: Partial<UserGoals>) {
    const updated = { ...goals, ...newGoals };
    setGoals(updated);
    await AsyncStorage.setItem("nutriai_goals", JSON.stringify(updated));
    const uid = firebaseUidRef.current;
    if (uid) {
      try {
        await saveUserGoals(uid, updated);
      } catch {}
    }
  }

  async function updateWeight(weight: number) {
    const updated = { ...todayLog, weight };
    saveTodayLog(updated);
    updateGoals({ currentWeight: weight });
  }

  async function hydrateFromFirebase(uid: string) {
    try {
      const dbGoals = await loadUserGoals(uid);
      if (dbGoals) {
        setGoals(dbGoals);
        await AsyncStorage.setItem("nutriai_goals", JSON.stringify(dbGoals));
      }

      const today = getDateKey();
      const dbTodayLog = await loadDailyLog(uid, today);
      if (dbTodayLog) {
        setTodayLog(dbTodayLog);
        await AsyncStorage.setItem(`nutriai_log_${today}`, JSON.stringify(dbTodayLog));
      }

      const dbWeekLogs = await loadWeekLogs(uid);
      if (dbWeekLogs && dbWeekLogs.length > 0) {
        setWeekLogs(dbWeekLogs);
        await AsyncStorage.setItem("nutriai_week_logs", JSON.stringify(dbWeekLogs));
      }
    } catch (e) {
      console.error(e);
    }
  }

  function setFirebaseUid(uid: string | null) {
    firebaseUidRef.current = uid;
    if (uid) {
      hydrateFromFirebase(uid);
    }
  }

  function setAnalyzing(val: boolean, img?: string) {
    setIsAnalyzing(val);
    if (img) setAnalyzingImage(img);
    else if (!val) setAnalyzingImage(null);
  }

  async function analyzeFood(base64Image: string, uri: string) {
    setIsAnalyzing(true);
    setAnalyzingImage(uri);
    setAnalyzingPercent(0);

    // Simulated progress simulation interval
    const interval = setInterval(() => {
      setAnalyzingPercent((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 500);

    try {
      const result = await analyzeFoodImageBase64(base64Image);
      setScanResult({
        ...result,
        image: uri,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setAnalyzingPercent(100);
    } catch (e) {
      console.error(e);
      setAnalyzingPercent(0);
    } finally {
      clearInterval(interval);
      // Let it dwell a bit at 100%
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 500);
    }
  }

  function clearScanResult() {
    setScanResult(null);
  }

  const totalCalories = useMemo(
    () => todayLog.entries.reduce((sum, e) => sum + e.calories, 0),
    [todayLog.entries],
  );
  const totalProtein = useMemo(
    () => todayLog.entries.reduce((sum, e) => sum + e.protein, 0),
    [todayLog.entries],
  );
  const totalCarbs = useMemo(
    () => todayLog.entries.reduce((sum, e) => sum + e.carbs, 0),
    [todayLog.entries],
  );
  const totalFat = useMemo(
    () => todayLog.entries.reduce((sum, e) => sum + e.fat, 0),
    [todayLog.entries],
  );

  const last7Days = useMemo(() => [...weekLogs, todayLog], [weekLogs, todayLog]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    let i = last7Days.length - 1; 
    if (last7Days[i] && last7Days[i].entries.length > 0) {
      streak++;
      i--;
      while (i >= 0 && last7Days[i] && last7Days[i].entries.length > 0) {
        streak++;
        i--;
      }
    } else {
      i--;
      while (i >= 0 && last7Days[i] && last7Days[i].entries.length > 0) {
        streak++;
        i--;
      }
    }
    return streak;
  }, [last7Days]);

  const weekStatus = useMemo(() => {
    return last7Days.map(log => log && log.entries && log.entries.length > 0);
  }, [last7Days]);


  const value = useMemo(
    () => ({
      todayLog,
      weekLogs,
      goals,
      addFoodEntry,
      removeFoodEntry,
      addWater,
      removeWater,
      updateGoals,
      updateWeight,
      setFirebaseUid,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      isLoading,
      isAnalyzing,
      analyzingImage,
      setAnalyzing,
      scanResult,
      analyzingPercent,
      analyzeFood,
      clearScanResult,
      currentStreak,
      last7Days,
      weekStatus,
    }),
    [
      todayLog,
      weekLogs,
      goals,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      isLoading,
      isAnalyzing,
      analyzingImage,
      scanResult,
      analyzingPercent,
      currentStreak,
      last7Days,
      weekStatus,
    ],
  );

  return (
    <NutritionContext.Provider value={value}>
      {children}
    </NutritionContext.Provider>
  );
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (!context)
    throw new Error("useNutrition must be used within NutritionProvider");
  return context;
}
