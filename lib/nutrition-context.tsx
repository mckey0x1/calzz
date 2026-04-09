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
import { NativeModules, Platform } from "react-native";
import {
  saveUserGoals,
  saveDailyLog,
  loadUserGoals,
  loadDailyLog,
  loadWeekLogs,
  syncAllDataToFirebase,
} from "./firebase-data";
import { analyzeFoodImageBase64 } from "./gemini";
import {
  getDatabase,
  addMealEntry,
  getMealsByDate,
  removeMealEntry,
  bulkImportEntries,
  buildDailyLogs,
  getLastNDates,
  saveWeight as dbSaveWeight,
  getWeightForDate,
  clearAllLocalData,
  getRecentFoods,
  getFrequentFoods,
  savePreferences,
  getPreferences,
  cacheFoodSearch,
  getCachedFoodSearch,
  markEntriesSynced,
  getUnsyncedEntries,
  setLastSyncTimestamp,
} from "./local-db";
import { uploadToCloudinary } from "./cloudinary";

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
  updateGoals: (goals: Partial<UserGoals>) => void;
  updateWeight: (weight: number) => void;
  logWeightForDate: (dateStr: string, weight: number) => Promise<void>;
  setFirebaseUid: (uid: string | null) => void;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  isLoading: boolean;
  isHydrated: boolean;
  isAnalyzing: boolean;
  analyzingImage: string | null;
  setAnalyzing: (val: boolean, img?: string) => void;
  scanResult: any | null;
  analyzingPercent: number;
  analyzeFood: (base64Image: string, uri: string) => Promise<void>;
  lookupBarcode: (barcode: string) => Promise<void>;
  clearScanResult: () => void;
  currentStreak: number;
  last7Days: DailyLog[];
  allDays: DailyLog[];
  weekStatus: boolean[];
  initializeNewUser: (
    uid: string,
    goals: UserGoals,
    weight: number,
  ) => Promise<void>;
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [analyzingPercent, setAnalyzingPercent] = useState(0);
  const firebaseUidRef = useRef<string | null>(null);
  const initializingUidRef = useRef<string | null>(null);
  const goalsRef = useRef<UserGoals>(EMPTY_GOALS);
  const sqliteReadyRef = useRef(false);
  const hydratingRef = useRef(true);
  const todayLogRef = useRef(todayLog);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  useEffect(() => {
    todayLogRef.current = todayLog;
  }, [todayLog]);

  useEffect(() => {
    const scannerState = { isAnalyzing, analyzingImage, analyzingPercent, scanResult };
    AsyncStorage.setItem("calzz_scanner_state", JSON.stringify(scannerState)).catch(() => {});
  }, [isAnalyzing, analyzingImage, analyzingPercent, scanResult]);

  // ⚡ PHASE 1: Instant load from local storage (AsyncStorage + SQLite)
  useEffect(() => {
    loadLocalData();
  }, []);

  async function loadLocalData() {
    try {
      // ─── PHASE 1: Load goals + data FAST (renders UI in ~5ms) ───
      const [goalsData, todayData, weekData, scannerData] = await Promise.all([
        AsyncStorage.getItem("calzz_goals"),
        AsyncStorage.getItem(`calzz_log_${getDateKey()}`),
        AsyncStorage.getItem("calzz_week_logs"),
        AsyncStorage.getItem("calzz_scanner_state"),
      ]);

      if (goalsData) {
        const parsed = JSON.parse(goalsData);
        setGoals(parsed);
        goalsRef.current = parsed;
      }

      // Show today's data from AsyncStorage immediately (fastest path)
      if (todayData) {
        setTodayLog(JSON.parse(todayData));
      }

      if (weekData) {
        const wLog = JSON.parse(weekData);
        if (wLog && wLog.length > 0) setWeekLogs(wLog);
      }

      if (scannerData) {
        try {
          const sParsed = JSON.parse(scannerData);
          if (sParsed.isAnalyzing !== undefined) setIsAnalyzing(sParsed.isAnalyzing);
          if (sParsed.analyzingImage !== undefined) setAnalyzingImage(sParsed.analyzingImage);
          if (sParsed.analyzingPercent !== undefined) setAnalyzingPercent(sParsed.analyzingPercent);
          if (sParsed.scanResult !== undefined) setScanResult(sParsed.scanResult);
        } catch(e) {}
      }

      // ─── Mark UI as ready — user sees their dashboard NOW ───
      setIsLoading(false);

      // ─── PHASE 2: Load historical data in background (non-blocking) ───
      // This happens AFTER the UI is already visible
      queueMicrotask(async () => {
        try {
          // Try SQLite for richer data (if available)
          if (Platform.OS !== "web") {
            try {
              const dbInstance = await getDatabase();
              sqliteReadyRef.current = dbInstance !== null;

              if (sqliteReadyRef.current) {
                const today = getDateKey();
                const [todayEntries, todayWeight] = await Promise.all([
                  getMealsByDate(today),
                  getWeightForDate(today),
                ]);

                // Only update if SQLite has data (it may be more recent than AsyncStorage)
                if (todayEntries.length > 0 || todayWeight !== null) {
                  setTodayLog({
                    date: today,
                    entries: todayEntries,
                    weight: todayWeight ?? undefined,
                  });
                }

                // Load last 30 days from SQLite
                const dates = getLastNDates(30).slice(0, -1);
                const historicalLogs = await buildDailyLogs(dates);
                if (historicalLogs.length > 0) {
                  setWeekLogs(historicalLogs);
                }
              } else {
                // SQLite not available, load week from AsyncStorage
                const weekData = await AsyncStorage.getItem("calzz_week_logs");
                if (weekData) setWeekLogs(JSON.parse(weekData));
              }
            } catch (sqliteErr) {
              console.warn("SQLite not available:", sqliteErr);
              const weekData = await AsyncStorage.getItem("calzz_week_logs");
              if (weekData) setWeekLogs(JSON.parse(weekData));
            }
          } else {
            const weekData = await AsyncStorage.getItem("calzz_week_logs");
            if (weekData) setWeekLogs(JSON.parse(weekData));
          }
        } catch (e) {
          console.error("Background data load failed:", e);
        } finally {
          setTimeout(() => { hydratingRef.current = false; }, 500);
        }
      });
    } catch (e) {
      console.error("Failed to load local data:", e);
      setIsLoading(false);
      setTimeout(() => { hydratingRef.current = false; }, 500);
    }
  }

  async function loadFromAsyncStorageFallback() {
    const [todayData, weekData] = await Promise.all([
      AsyncStorage.getItem(`calzz_log_${getDateKey()}`),
      AsyncStorage.getItem("calzz_week_logs"),
    ]);

    if (todayData) {
      setTodayLog(JSON.parse(todayData));
    }
    if (weekData) {
      setWeekLogs(JSON.parse(weekData));
    }
  }

  // ─── Widget Sync ─────────────────────────────────────────────────
  async function syncWidgetData(log: DailyLog, currentGoals: UserGoals) {
    if (Platform.OS === "web") return;

    const entries = log.entries || [];
    const totalCal = entries.reduce((s, e) => s + e.calories, 0);
    const totalPro = entries.reduce((s, e) => s + e.protein, 0);
    const totalCarb = entries.reduce((s, e) => s + e.carbs, 0);
    const totalFt = entries.reduce((s, e) => s + e.fat, 0);

    const widgetData = {
      caloriesLeft: Math.max(0, currentGoals.dailyCalories - totalCal),
      dailyCalories: currentGoals.dailyCalories,
      totalCalories: totalCal,
      proteinLeft: Math.max(0, currentGoals.proteinGoal - totalPro),
      proteinGoal: currentGoals.proteinGoal,
      carbsLeft: Math.max(0, currentGoals.carbsGoal - totalCarb),
      carbsGoal: currentGoals.carbsGoal,
      fatLeft: Math.max(0, currentGoals.fatGoal - totalFt),
      fatGoal: currentGoals.fatGoal,
      lastUpdated: Date.now(),
    };

    try {
      if (Platform.OS === "android" && NativeModules.WidgetUpdater) {
        NativeModules.WidgetUpdater.updateWidget(JSON.stringify(widgetData));
      }
    } catch (e) {}
  }

  // ─── Reactive Sync: Debounced + skip during hydration ──────────────
  useEffect(() => {
    if (isLoading || hydratingRef.current) return;

    // Debounce: wait 500ms before writing to avoid rapid-fire during batch updates
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const sync = async () => {
        // Save to AsyncStorage (always, for fallback)
        await AsyncStorage.setItem(
          `calzz_log_${getDateKey()}`,
          JSON.stringify(todayLog),
        );

        if (weekLogs && weekLogs.length > 0) {
          await AsyncStorage.setItem("calzz_week_logs", JSON.stringify(weekLogs)).catch(() => {});
        }

        // Sync to Widgets
        syncWidgetData(todayLog, goals);

        // Background Firebase sync (non-blocking)
        if (firebaseUidRef.current) {
          saveDailyLog(firebaseUidRef.current, todayLog).catch((e) =>
            console.log("Firebase sync fail:", e),
          );
        }
      };
      sync();
    }, 500);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [todayLog, goals, isLoading, weekLogs]);

  useEffect(() => {
    if (isLoading || hydratingRef.current) return;
    AsyncStorage.setItem("calzz_goals", JSON.stringify(goals));
    if (!firebaseUidRef.current) return;
    saveUserGoals(firebaseUidRef.current, goals).catch((e) =>
      console.log("Firebase goals sync fail:", e),
    );
  }, [goals, isLoading]);

  // ─── Add Food Entry (LOCAL-FIRST) ──────────────────────────────────
  const addFoodEntry = React.useCallback(
    (entry: Omit<FoodEntry, "id" | "timestamp">) => {
      const newEntry: FoodEntry = {
        ...entry,
        id: generateId(),
        timestamp: Date.now(),
      };

      // 1. Update React state IMMEDIATELY (UI updates instantly)
      setTodayLog((prev) => {
        const logBase = prev || createEmptyLog(getDateKey());
        const updated = {
          ...logBase,
          entries: [...(logBase?.entries || []), newEntry],
        };
        return updated;
      });

      // 2. Write to SQLite in background (non-blocking)
      if (sqliteReadyRef.current) {
        addMealEntry(newEntry, getDateKey()).catch((e) =>
          console.warn("SQLite write failed:", e),
        );
      }

      // 3. Upload image if present and local, then update context & DB
      if (newEntry.imageUri && !newEntry.imageUri.startsWith("http")) {
        uploadToCloudinary(newEntry.imageUri).then((remoteUrl) => {
          if (remoteUrl) {
            const remoteEntry = { ...newEntry, imageUri: remoteUrl };
            
            // Re-update local state with remote URL so Firebase sync gets the clean URL
            setTodayLog((prev) => {
              if (!prev) return prev;
              return {
                 ...prev,
                 entries: prev.entries.map(e => e.id === remoteEntry.id ? remoteEntry : e)
              };
            });
            
            // Re-update SQLite
            if (sqliteReadyRef.current) {
               addMealEntry(remoteEntry, getDateKey()).catch(() => {});
            }
          }
        });
      }
    },
    [],
  );

  // ─── Remove Food Entry ─────────────────────────────────────────────
  const removeFoodEntry = React.useCallback((id: string) => {
    // 1. Update React state immediately
    setTodayLog((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        entries: (prev.entries || []).filter((e) => e.id !== id),
      };
      if (updated.entries.length !== prev.entries.length) {
        if (firebaseUidRef.current) {
          saveDailyLog(firebaseUidRef.current, updated).catch(() => {});
        }
      }
      return updated;
    });

    setWeekLogs((prev) => {
      const updated = prev.map((log) => {
        const nextEntries = (log.entries || []).filter((e) => e.id !== id);
        if (nextEntries.length !== (log.entries?.length || 0)) {
          if (firebaseUidRef.current) {
            saveDailyLog(firebaseUidRef.current, {
              ...log,
              entries: nextEntries,
            }).catch(() => {});
          }
        }
        return { ...log, entries: nextEntries };
      });
      return updated;
    });

    // 2. Remove from SQLite in background
    if (sqliteReadyRef.current) {
      removeMealEntry(id).catch((e) =>
        console.warn("SQLite delete failed:", e),
      );
    }
  }, []);

  // ─── Update Goals ──────────────────────────────────────────────────
  const updateGoals = React.useCallback(
    async (newGoals: Partial<UserGoals>) => {
      setGoals((prev) => {
        const updated = { ...prev, ...newGoals };
        const uid = firebaseUidRef.current;
        if (uid) {
          saveUserGoals(uid, updated).catch(() => {});
        }
        return updated;
      });
    },
    [],
  );

  // ─── Update Weight ─────────────────────────────────────────────────
  const updateWeight = React.useCallback(
    async (weight: number) => {
      const updated = { ...todayLog, weight };
      setTodayLog(updated);
      updateGoals({ currentWeight: weight });

      // Write to SQLite
      if (sqliteReadyRef.current) {
        dbSaveWeight(getDateKey(), weight).catch(() => {});
      }
    },
    [todayLog, updateGoals],
  );

  const logWeightForDate = React.useCallback(
    async (dateStr: string, weight: number) => {
      const uid = firebaseUidRef.current;
      const today = getDateKey();

      if (dateStr === today || new Date(dateStr) >= new Date(today)) {
        updateGoals({ currentWeight: weight });
      }

      // Update local state instantly
      if (dateStr === todayLog.date) {
        setTodayLog((prev) => ({ ...prev, weight }));
      } else {
        setWeekLogs((prev) => {
          const idx = prev.findIndex((l) => l.date === dateStr);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], weight };
            return updated;
          } else {
            return [...prev, { date: dateStr, entries: [], weight }];
          }
        });
      }

      // Write to SQLite
      if (sqliteReadyRef.current) {
        dbSaveWeight(dateStr, weight).catch(() => {});
      }

      // Sync to Firebase and local storage
      if (uid) {
        try {
          const existingLog = await loadDailyLog(uid, dateStr);
          const logToSave = existingLog
            ? { ...existingLog, weight }
            : { date: dateStr, entries: [], weight };

          await saveDailyLog(uid, logToSave);

          const weekData = await AsyncStorage.getItem("calzz_week_logs");
          const wLogs: DailyLog[] = weekData ? JSON.parse(weekData) : [];
          const wIdx = wLogs.findIndex((l) => l.date === dateStr);
          if (wIdx >= 0) wLogs[wIdx].weight = weight;
          else wLogs.push(logToSave);
          await AsyncStorage.setItem("calzz_week_logs", JSON.stringify(wLogs));
        } catch (e) {
          console.error("Failed to log weight for date:", e);
        }
      }
    },
    [todayLog.date, updateGoals],
  );

  // ─── Firebase Hydration (Background, Non-blocking) ─────────────────
  async function hydrateFromFirebase(uid: string) {
    hydratingRef.current = true; // Suppress reactive sync during hydration
    try {
      // Fetch goals and today's log in parallel
      const [dbGoals, dbTodayLog] = await Promise.all([
        loadUserGoals(uid),
        loadDailyLog(uid, getDateKey()),
      ]);

      if (dbGoals) {
        setGoals(dbGoals);
        goalsRef.current = dbGoals;
        await AsyncStorage.setItem("calzz_goals", JSON.stringify(dbGoals));
      } else {
        const currentLocalGoals = goalsRef.current;
        if (currentLocalGoals && currentLocalGoals.dailyCalories > 0) {
          await saveUserGoals(uid, currentLocalGoals);
        } else {
          setGoals(EMPTY_GOALS);
          goalsRef.current = EMPTY_GOALS;
          await AsyncStorage.setItem(
            "calzz_goals",
            JSON.stringify(EMPTY_GOALS),
          );
        }
      }

      const today = getDateKey();
      if (dbTodayLog) {
        setTodayLog(dbTodayLog);
        await AsyncStorage.setItem(
          `calzz_log_${today}`,
          JSON.stringify(dbTodayLog),
        );
        if (sqliteReadyRef.current) {
          bulkImportEntries([dbTodayLog]).catch(() => {});
        }
      } else {
        const emptyLog = createEmptyLog(today);
        setTodayLog(emptyLog);
        await AsyncStorage.setItem(
          `calzz_log_${today}`,
          JSON.stringify(emptyLog),
        );
      }

      // Week logs fetched with single batch read (already optimized in firebase-data.ts)
      const dbWeekLogs = await loadWeekLogs(uid);
      if (dbWeekLogs && dbWeekLogs.length > 0) {
        setWeekLogs(dbWeekLogs);
        await AsyncStorage.setItem(
          "calzz_week_logs",
          JSON.stringify(dbWeekLogs),
        );
        if (sqliteReadyRef.current) {
          bulkImportEntries(dbWeekLogs).catch(() => {});
        }
      } else {
        setWeekLogs([]);
        await AsyncStorage.setItem("calzz_week_logs", JSON.stringify([]));
      }

      await setLastSyncTimestamp();
    } catch (e) {
      console.error(e);
    } finally {
      hydratingRef.current = false;
    }
  }

  const setFirebaseUid = React.useCallback(async (uid: string | null) => {
    firebaseUidRef.current = uid;
    if (uid) {
      if (initializingUidRef.current === uid) return;
      // DON'T set isLoading=true here — local data is already displayed
      // Firebase hydration happens silently in the background
      hydrateFromFirebase(uid).then(() => {
        setIsHydrated(true);
      });
    } else {
      // User signed out — clear all cached data
      const today = getDateKey();
      setGoals(EMPTY_GOALS);
      goalsRef.current = EMPTY_GOALS;
      setTodayLog(createEmptyLog(today));
      setWeekLogs([]);
      setIsHydrated(true);

      // Clear SQLite
      if (sqliteReadyRef.current) {
        clearAllLocalData().catch(() => {});
      }

      await AsyncStorage.multiRemove([
        `calzz_log_${today}`,
        "calzz_week_logs",
        "calzz_goals",
      ]);
    }
  }, []);

  const initializeNewUser = React.useCallback(
    async (uid: string, newGoals: UserGoals, weight: number) => {
      initializingUidRef.current = uid;
      firebaseUidRef.current = uid;

      setGoals(newGoals);
      const today = getDateKey();
      const freshLog = createEmptyLog(today);
      freshLog.weight = weight;
      setTodayLog(freshLog);
      setWeekLogs([]);

      try {
        await Promise.all([
          AsyncStorage.setItem(`calzz_log_${today}`, JSON.stringify(freshLog)),
          AsyncStorage.setItem("calzz_week_logs", JSON.stringify([])),
          syncAllDataToFirebase(uid, {
            goals: newGoals,
            todayLog: freshLog,
            weekLogs: [],
          }),
        ]);

        // Save weight to SQLite
        if (sqliteReadyRef.current) {
          dbSaveWeight(today, weight).catch(() => {});
        }
      } catch (e) {
        console.error("Initialize new user error:", e);
      } finally {
        setTimeout(() => {
          if (initializingUidRef.current === uid)
            initializingUidRef.current = null;
        }, 5000);
      }
    },
    [],
  );

  const setAnalyzing = React.useCallback((val: boolean, img?: string) => {
    setIsAnalyzing(val);
    setAnalyzingImage(img || null);
  }, []);

  const analyzeFood = React.useCallback(
    async (base64Image: string, uri: string) => {
      setIsAnalyzing(true);
      setAnalyzingImage(uri);
      setAnalyzingPercent(0);
      const interval = setInterval(() => {
        setAnalyzingPercent((prev) =>
          prev >= 90
            ? prev
            : Math.min(95, prev + Math.floor(Math.random() * 10) + 5),
        );
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
      } finally {
        clearInterval(interval);
        setTimeout(() => setIsAnalyzing(false), 500);
      }
    },
    [],
  );

  const lookupBarcode = React.useCallback(async (barcode: string) => {
    setIsAnalyzing(true);
    setAnalyzingPercent(30);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();

      setAnalyzingPercent(70);

      if (data.status === 0 || !data.product) {
        throw new Error("Product not found in database.");
      }

      const p = data.product;
      const nut = p.nutriments || {};

      let serveWeight = parseFloat(p.serving_quantity);
      let serveUnit = p.serving_quantity ? `(${p.serving_quantity}${p.serving_quantity_unit || "g"})` : "100g";
      const scale = (!isNaN(serveWeight) && serveWeight > 0) ? (serveWeight / 100) : 1;

      const scoreMap: Record<string, number> = { a: 10, b: 8, c: 6, d: 4, e: 2 };
      const score = scoreMap[p.nutriscore_grade?.toLowerCase()] || 5;

      const getNut = (key: string) => {
        return nut[`${key}_serving`] || (nut[`${key}_100g`] !== undefined ? nut[`${key}_100g`] * scale : undefined) || (nut[key] !== undefined ? nut[key] * scale : 0);
      };

      const protein = getNut("proteins");
      const carbs = getNut("carbohydrates");
      const fat = getNut("fat");
      
      // Fallback: Calculate calories from macros if energy is completely missing
      let calories = nut["energy-kcal_serving"] || (nut["energy-kcal_100g"] !== undefined ? nut["energy-kcal_100g"] * scale : undefined);
      if (calories === undefined) calories = nut["energy-kcal"] !== undefined ? nut["energy-kcal"] * scale : undefined;
      if (calories === undefined && nut["energy_100g"]) calories = (nut["energy_100g"] / 4.184) * scale;
      if (calories === undefined) calories = (protein * 4) + (carbs * 4) + (fat * 9);

      const parsedData = {
        name: p.product_name || "Unknown Product",
        calories: Math.round(calories || 0),
        protein: Math.round(protein || 0),
        carbs: Math.round(carbs || 0),
        fat: Math.round(fat || 0),
        fiber: Math.round(getNut("fiber") || 0),
        sugar: Math.round(getNut("sugars") || 0),
        sodium: Math.round((getNut("sodium") || 0) * 1000), // convert g to mg
        score,
        servingSize: `1 serving ${serveUnit}`,
        items: [{ 
          name: p.product_name || `Barcode: ${barcode}`, 
          estimatedGrams: isNaN(serveWeight) ? 100 : serveWeight, 
          method: "barcode" 
        }],
        image: p.image_front_url || null,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setScanResult(parsedData);
      setAnalyzingPercent(100);
    } catch (e) {
      console.error("Barcode lookup failed:", e);
      setScanResult({
        name: "Barcode Not Found",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        score: 0,
        servingSize: "Unknown",
        items: [],
        image: null,
      });
    } finally {
      setTimeout(() => setIsAnalyzing(false), 800);
    }
  }, []);
  const clearScanResult = React.useCallback(() => setScanResult(null), []);

  const totalCalories = useMemo(
    () => (todayLog.entries || []).reduce((sum, e) => sum + e.calories, 0),
    [todayLog.entries],
  );
  const totalProtein = useMemo(
    () => (todayLog.entries || []).reduce((sum, e) => sum + e.protein, 0),
    [todayLog.entries],
  );
  const totalCarbs = useMemo(
    () => (todayLog.entries || []).reduce((sum, e) => sum + e.carbs, 0),
    [todayLog.entries],
  );
  const totalFat = useMemo(
    () => (todayLog.entries || []).reduce((sum, e) => sum + e.fat, 0),
    [todayLog.entries],
  );
  const allDays = useMemo(() => [...weekLogs, todayLog], [weekLogs, todayLog]);
  const last7Days = useMemo(() => allDays.slice(-7), [allDays]);
  const currentStreak = useMemo(() => {
    let streak = 0;
    let i = allDays.length - 1;

    if (i >= 0 && (allDays[i]?.entries?.length || 0) === 0) {
      i--;
    }

    while (i >= 0 && (allDays[i]?.entries?.length || 0) > 0) {
      streak++;
      i--;
    }
    return streak;
  }, [allDays]);
  const weekStatus = useMemo(
    () => last7Days.map((log) => (log?.entries?.length || 0) > 0),
    [last7Days],
  );

  // Sync to Native Android Widgets via WidgetModule
  useEffect(() => {
    if (Platform.OS === "android" && NativeModules.WidgetModule) {
      const remainingCalories = Math.max(0, goals.dailyCalories - totalCalories);
      const caloriePercent = goals.dailyCalories > 0 ? Math.round((totalCalories / goals.dailyCalories) * 100) : 0;
      const remainingProtein = Math.max(0, Math.round(goals.proteinGoal - totalProtein));
      const remainingCarbs = Math.max(0, Math.round(goals.carbsGoal - totalCarbs));
      const remainingFat = Math.max(0, Math.round(goals.fatGoal - totalFat));

      try {
        NativeModules.WidgetModule.updateWidgetData(
          remainingCalories,
          caloriePercent,
          remainingProtein,
          remainingCarbs,
          remainingFat
        );
      } catch (err) {
        console.warn("Failed to sync widget data", err);
      }
    }
  }, [todayLog, goals, totalCalories, totalProtein, totalCarbs, totalFat]);

  const value = useMemo(
    () => ({
      todayLog,
      weekLogs,
      goals,
      addFoodEntry,
      removeFoodEntry,
      updateGoals,
      updateWeight,
      logWeightForDate,
      setFirebaseUid,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      isLoading,
      isHydrated,
      isAnalyzing,
      analyzingImage,
      setAnalyzing,
      scanResult,
      analyzingPercent,
      analyzeFood,
      lookupBarcode,
      clearScanResult,
      currentStreak,
      last7Days,
      allDays,
      weekStatus,
      initializeNewUser,
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
      isHydrated,
      isAnalyzing,
      analyzingImage,
      scanResult,
      analyzingPercent,
      currentStreak,
      last7Days,
      allDays,
      weekStatus,
      initializeNewUser,
      setAnalyzing,
      analyzeFood,
      lookupBarcode,
      clearScanResult,
      addFoodEntry,
      removeFoodEntry,
      updateGoals,
      updateWeight,
      logWeightForDate,
      setFirebaseUid,
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
