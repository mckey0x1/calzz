import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  isLoading: boolean;
}

const NutritionContext = createContext<NutritionContextValue | null>(null);

const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  targetWeight: 75,
  currentWeight: 80,
  dietPreference: "balanced",
  waterGoal: 8,
  stepsGoal: 10000,
};

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createEmptyLog(date: string): DailyLog {
  return { date, entries: [], waterGlasses: 0, steps: Math.floor(Math.random() * 4000 + 3000), weight: undefined };
}

const SAMPLE_ENTRIES: Omit<FoodEntry, "id" | "timestamp">[] = [
  { name: "Greek Yogurt Bowl", calories: 280, protein: 22, carbs: 30, fat: 8, meal: "breakfast" },
  { name: "Avocado Toast", calories: 350, protein: 12, carbs: 35, fat: 18, meal: "breakfast" },
  { name: "Grilled Chicken Salad", calories: 420, protein: 38, carbs: 15, fat: 22, meal: "lunch" },
  { name: "Quinoa Bowl", calories: 380, protein: 14, carbs: 52, fat: 12, meal: "lunch" },
  { name: "Salmon & Rice", calories: 520, protein: 35, carbs: 45, fat: 18, meal: "dinner" },
];

export function NutritionProvider({ children }: { children: ReactNode }) {
  const [todayLog, setTodayLog] = useState<DailyLog>(createEmptyLog(getDateKey()));
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);
  const [isLoading, setIsLoading] = useState(true);

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
        const sampleCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < sampleCount; i++) {
          const sample = SAMPLE_ENTRIES[i];
          initialLog.entries.push({
            ...sample,
            id: generateId(),
            timestamp: Date.now() - (sampleCount - i) * 3600000,
          });
        }
        initialLog.waterGlasses = Math.floor(Math.random() * 4) + 2;
        setTodayLog(initialLog);
      }

      if (weekData) {
        setWeekLogs(JSON.parse(weekData));
      } else {
        const logs: DailyLog[] = [];
        for (let i = 6; i >= 1; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const log = createEmptyLog(getDateKey(d));
          const entryCount = Math.floor(Math.random() * 3) + 2;
          for (let j = 0; j < entryCount; j++) {
            const sample = SAMPLE_ENTRIES[Math.floor(Math.random() * SAMPLE_ENTRIES.length)];
            log.entries.push({
              ...sample,
              id: generateId(),
              timestamp: d.getTime() + j * 3600000,
              calories: sample.calories + Math.floor(Math.random() * 100 - 50),
            });
          }
          log.waterGlasses = Math.floor(Math.random() * 6) + 3;
          log.steps = Math.floor(Math.random() * 6000 + 4000);
          log.weight = 80 - i * 0.15 + Math.random() * 0.5;
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

  async function saveTodayLog(log: DailyLog) {
    setTodayLog(log);
    await AsyncStorage.setItem(`nutriai_log_${getDateKey()}`, JSON.stringify(log));
  }

  function addFoodEntry(entry: Omit<FoodEntry, "id" | "timestamp">) {
    const newEntry: FoodEntry = { ...entry, id: generateId(), timestamp: Date.now() };
    const updated = { ...todayLog, entries: [...todayLog.entries, newEntry] };
    saveTodayLog(updated);
  }

  function removeFoodEntry(id: string) {
    const updated = { ...todayLog, entries: todayLog.entries.filter((e) => e.id !== id) };
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
  }

  async function updateWeight(weight: number) {
    const updated = { ...todayLog, weight };
    saveTodayLog(updated);
    updateGoals({ currentWeight: weight });
  }

  const totalCalories = useMemo(() => todayLog.entries.reduce((sum, e) => sum + e.calories, 0), [todayLog.entries]);
  const totalProtein = useMemo(() => todayLog.entries.reduce((sum, e) => sum + e.protein, 0), [todayLog.entries]);
  const totalCarbs = useMemo(() => todayLog.entries.reduce((sum, e) => sum + e.carbs, 0), [todayLog.entries]);
  const totalFat = useMemo(() => todayLog.entries.reduce((sum, e) => sum + e.fat, 0), [todayLog.entries]);

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
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      isLoading,
    }),
    [todayLog, weekLogs, goals, totalCalories, totalProtein, totalCarbs, totalFat, isLoading]
  );

  return <NutritionContext.Provider value={value}>{children}</NutritionContext.Provider>;
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (!context) throw new Error("useNutrition must be used within NutritionProvider");
  return context;
}
