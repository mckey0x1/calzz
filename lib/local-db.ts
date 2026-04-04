/**
 * local-db.ts — High-performance SQLite + AsyncStorage local-first storage
 *
 * Architecture:
 *  1. SQLite stores structured data (meals, food entries, search cache)
 *  2. AsyncStorage stores lightweight KV data (preferences, sync timestamps)
 *  3. All writes are LOCAL-FIRST: UI updates immediately, Firebase syncs in background
 *  4. On app startup, data loads from SQLite (instant), then Firebase hydrates in background
 *
 * NOTE: SQLite is optional — if the native module isn't available (e.g. Expo Go),
 *       everything falls back to AsyncStorage-only mode gracefully.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { FoodEntry, DailyLog, UserGoals } from "./nutrition-context";

// ─── Database Instance (lazy, nullable) ──────────────────────────────
let db: any | null = null;
let sqliteAvailable: boolean | null = null; // null = not checked yet

export async function getDatabase(): Promise<any | null> {
  if (sqliteAvailable === false) return null;
  if (db) return db;
  if (Platform.OS === "web") {
    sqliteAvailable = false;
    return null;
  }
  try {
    const SQLite = require("expo-sqlite");
    db = await SQLite.openDatabaseAsync("calzz_v1.db");
    await initializeSchema(db);
    sqliteAvailable = true;
    return db;
  } catch (e) {
    console.warn("SQLite not available (Expo Go?), using AsyncStorage fallback:", e);
    sqliteAvailable = false;
    return null;
  }
}

export function isSQLiteAvailable(): boolean {
  return sqliteAvailable === true;
}


// ─── Schema ──────────────────────────────────────────────────────────
async function initializeSchema(database: any) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      fiber REAL DEFAULT 0,
      sugar REAL DEFAULT 0,
      sodium REAL DEFAULT 0,
      meal TEXT NOT NULL DEFAULT 'snack',
      timestamp INTEGER NOT NULL,
      image_uri TEXT,
      confidence REAL,
      date TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_weights (
      date TEXT PRIMARY KEY NOT NULL,
      weight REAL NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS food_search_cache (
      query TEXT PRIMARY KEY NOT NULL,
      results TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recent_foods (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      fiber REAL DEFAULT 0,
      sugar REAL DEFAULT 0,
      sodium REAL DEFAULT 0,
      meal TEXT NOT NULL DEFAULT 'snack',
      image_uri TEXT,
      used_count INTEGER NOT NULL DEFAULT 1,
      last_used INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entries_date ON food_entries(date);
    CREATE INDEX IF NOT EXISTS idx_entries_timestamp ON food_entries(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_synced ON food_entries(synced);
    CREATE INDEX IF NOT EXISTS idx_recent_foods_used ON recent_foods(last_used DESC);
    CREATE INDEX IF NOT EXISTS idx_search_cache_at ON food_search_cache(cached_at);
  `);
}

// ─── Food Entries (Meals) ────────────────────────────────────────────

/** Add a food entry — instant local write */
export async function addMealEntry(
  entry: FoodEntry,
  date: string
): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.runAsync(
    `INSERT OR REPLACE INTO food_entries
     (id, name, calories, protein, carbs, fat, fiber, sugar, sodium, meal, timestamp, image_uri, confidence, date, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    entry.id,
    entry.name,
    entry.calories,
    entry.protein,
    entry.carbs,
    entry.fat,
    entry.fiber ?? 0,
    entry.sugar ?? 0,
    entry.sodium ?? 0,
    entry.meal,
    entry.timestamp,
    entry.imageUri ?? null,
    entry.confidence ?? null,
    date
  );

  // Also update recent foods for quick re-logging
  await upsertRecentFood(entry);
}

/** Get all food entries for a specific date */
export async function getMealsByDate(date: string): Promise<FoodEntry[]> {
  const database = await getDatabase();
  if (!database) return [];
  const rows: any[] = await database.getAllAsync(
    `SELECT * FROM food_entries WHERE date = ? ORDER BY timestamp ASC`,
    date
  );
  return rows.map(rowToFoodEntry);
}

/** Get food entries for a date range (e.g., last 30 days) */
export async function getMealsForDateRange(
  startDate: string,
  endDate: string
): Promise<Record<string, FoodEntry[]>> {
  const database = await getDatabase();
  if (!database) return {};
  const rows: any[] = await database.getAllAsync(
    `SELECT * FROM food_entries WHERE date >= ? AND date <= ? ORDER BY date ASC, timestamp ASC`,
    startDate,
    endDate
  );

  const grouped: Record<string, FoodEntry[]> = {};
  for (const row of rows) {
    const d = row.date;
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(rowToFoodEntry(row));
  }
  return grouped;
}

/** Delete a food entry */
export async function removeMealEntry(id: string): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.runAsync(`DELETE FROM food_entries WHERE id = ?`, id);
}

/** Get all unsynced entries for background Firebase sync */
export async function getUnsyncedEntries(): Promise<
  (FoodEntry & { date: string })[]
> {
  const database = await getDatabase();
  if (!database) return [];
  const rows: any[] = await database.getAllAsync(
    `SELECT * FROM food_entries WHERE synced = 0`
  );
  return rows.map((r: any) => ({ ...rowToFoodEntry(r), date: r.date }));
}

/** Mark entries as synced after successful Firebase push */
export async function markEntriesSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const database = await getDatabase();
  if (!database) return;
  const placeholders = ids.map(() => "?").join(",");
  await database.runAsync(
    `UPDATE food_entries SET synced = 1 WHERE id IN (${placeholders})`,
    ...ids
  );
}

// ─── Daily Weights ───────────────────────────────────────────────────

export async function saveWeight(
  date: string,
  weight: number
): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.runAsync(
    `INSERT OR REPLACE INTO daily_weights (date, weight, synced) VALUES (?, ?, 0)`,
    date,
    weight
  );
}

export async function getWeightForDate(
  date: string
): Promise<number | null> {
  const database = await getDatabase();
  if (!database) return null;
  const row: any = await database.getFirstAsync(
    `SELECT weight FROM daily_weights WHERE date = ?`,
    date
  );
  return row ? row.weight : null;
}

export async function getWeightHistory(
  days: number = 30
): Promise<{ date: string; weight: number }[]> {
  const database = await getDatabase();
  if (!database) return [];
  const rows: any[] = await database.getAllAsync(
    `SELECT date, weight FROM daily_weights ORDER BY date DESC LIMIT ?`,
    days
  );
  return rows.map((r: any) => ({ date: r.date, weight: r.weight }));
}

// ─── Recent Foods (Quick Re-log) ────────────────────────────────────

async function upsertRecentFood(entry: FoodEntry): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  const existing: any = await database.getFirstAsync(
    `SELECT id, used_count FROM recent_foods WHERE name = ?`,
    entry.name
  );

  if (existing) {
    await database.runAsync(
      `UPDATE recent_foods SET used_count = ?, last_used = ?, calories = ?, protein = ?, carbs = ?, fat = ?, fiber = ?, sugar = ?, sodium = ?, image_uri = ? WHERE id = ?`,
      existing.used_count + 1,
      Date.now(),
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
      entry.fiber ?? 0,
      entry.sugar ?? 0,
      entry.sodium ?? 0,
      entry.imageUri ?? null,
      existing.id
    );
  } else {
    await database.runAsync(
      `INSERT INTO recent_foods (id, name, calories, protein, carbs, fat, fiber, sugar, sodium, meal, image_uri, used_count, last_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      entry.id,
      entry.name,
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
      entry.fiber ?? 0,
      entry.sugar ?? 0,
      entry.sodium ?? 0,
      entry.meal,
      entry.imageUri ?? null,
      Date.now()
    );

    // Keep only the 50 most recent foods
    await database.runAsync(
      `DELETE FROM recent_foods WHERE id NOT IN (
        SELECT id FROM recent_foods ORDER BY last_used DESC LIMIT 50
      )`
    );
  }
}

/** Get recently eaten foods, most recent first */
export async function getRecentFoods(limit: number = 20): Promise<
  Omit<FoodEntry, "id" | "timestamp">[]
> {
  const database = await getDatabase();
  if (!database) return [];
  const rows: any[] = await database.getAllAsync(
    `SELECT * FROM recent_foods ORDER BY last_used DESC LIMIT ?`,
    limit
  );
  return rows.map((r: any) => ({
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    fiber: r.fiber,
    sugar: r.sugar,
    sodium: r.sodium,
    meal: r.meal as FoodEntry["meal"],
    imageUri: r.image_uri ?? undefined,
  }));
}

/** Get most frequently eaten foods */
export async function getFrequentFoods(limit: number = 10): Promise<
  Omit<FoodEntry, "id" | "timestamp">[]
> {
  const database = await getDatabase();
  if (!database) return [];
  const rows: any[] = await database.getAllAsync(
    `SELECT * FROM recent_foods ORDER BY used_count DESC, last_used DESC LIMIT ?`,
    limit
  );
  return rows.map((r: any) => ({
    name: r.name,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    fiber: r.fiber,
    sugar: r.sugar,
    sodium: r.sodium,
    meal: r.meal as FoodEntry["meal"],
    imageUri: r.image_uri ?? undefined,
  }));
}

// ─── Food Search Cache ───────────────────────────────────────────────

const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Cache a food search result to avoid repeated API calls */
export async function cacheFoodSearch(
  query: string,
  results: any[]
): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  await database.runAsync(
    `INSERT OR REPLACE INTO food_search_cache (query, results, cached_at) VALUES (?, ?, ?)`,
    query.toLowerCase().trim(),
    JSON.stringify(results),
    Date.now()
  );

  // Cleanup old cache entries (older than 7 days)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await database.runAsync(
    `DELETE FROM food_search_cache WHERE cached_at < ?`,
    cutoff
  );
}

/** Get cached food search results (returns null if expired/missing) */
export async function getCachedFoodSearch(
  query: string
): Promise<any[] | null> {
  const database = await getDatabase();
  if (!database) return null;
  const row: any = await database.getFirstAsync(
    `SELECT results, cached_at FROM food_search_cache WHERE query = ?`,
    query.toLowerCase().trim()
  );

  if (!row) return null;
  if (Date.now() - row.cached_at > SEARCH_CACHE_TTL_MS) {
    // Expired — delete and return null
    await database.runAsync(
      `DELETE FROM food_search_cache WHERE query = ?`,
      query.toLowerCase().trim()
    );
    return null;
  }

  return JSON.parse(row.results);
}

// ─── User Preferences (AsyncStorage — lightweight KV) ────────────────

const PREF_KEYS = {
  DIET_TYPE: "calzz_pref_diet_type",
  DAILY_CALORIE_GOAL: "calzz_pref_daily_cal",
  UNITS: "calzz_pref_units",
  THEME: "calzz_pref_theme",
  NOTIFICATIONS: "calzz_pref_notifications",
  LAST_SYNC: "calzz_last_sync_at",
  ONBOARDING_DONE: "onboarding_done",
} as const;

export interface UserPreferences {
  dietType: string;
  dailyCalorieGoal: number;
  units: "metric" | "imperial";
  theme: "light" | "dark" | "system";
  notifications: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  dietType: "balanced",
  dailyCalorieGoal: 2000,
  units: "imperial",
  theme: "system",
  notifications: true,
};

/** Save user preferences instantly to AsyncStorage */
export async function savePreferences(
  prefs: Partial<UserPreferences>
): Promise<void> {
  const pairs: [string, string][] = [];
  if (prefs.dietType !== undefined)
    pairs.push([PREF_KEYS.DIET_TYPE, prefs.dietType]);
  if (prefs.dailyCalorieGoal !== undefined)
    pairs.push([
      PREF_KEYS.DAILY_CALORIE_GOAL,
      prefs.dailyCalorieGoal.toString(),
    ]);
  if (prefs.units !== undefined) pairs.push([PREF_KEYS.UNITS, prefs.units]);
  if (prefs.theme !== undefined) pairs.push([PREF_KEYS.THEME, prefs.theme]);
  if (prefs.notifications !== undefined)
    pairs.push([
      PREF_KEYS.NOTIFICATIONS,
      prefs.notifications ? "true" : "false",
    ]);
  if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
}

/** Load all user preferences from AsyncStorage */
export async function getPreferences(): Promise<UserPreferences> {
  try {
    const keys = [
      PREF_KEYS.DIET_TYPE,
      PREF_KEYS.DAILY_CALORIE_GOAL,
      PREF_KEYS.UNITS,
      PREF_KEYS.THEME,
      PREF_KEYS.NOTIFICATIONS,
    ];
    const results = await AsyncStorage.multiGet(keys);
    const map = new Map(results);

    return {
      dietType: map.get(PREF_KEYS.DIET_TYPE) || DEFAULT_PREFS.dietType,
      dailyCalorieGoal: parseInt(
        map.get(PREF_KEYS.DAILY_CALORIE_GOAL) || "",
        10
      ) || DEFAULT_PREFS.dailyCalorieGoal,
      units:
        (map.get(PREF_KEYS.UNITS) as "metric" | "imperial") ||
        DEFAULT_PREFS.units,
      theme:
        (map.get(PREF_KEYS.THEME) as "light" | "dark" | "system") ||
        DEFAULT_PREFS.theme,
      notifications: map.get(PREF_KEYS.NOTIFICATIONS) !== "false",
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

// ─── Sync Timestamps ─────────────────────────────────────────────────

export async function getLastSyncTimestamp(): Promise<number> {
  const val = await AsyncStorage.getItem(PREF_KEYS.LAST_SYNC);
  return val ? parseInt(val, 10) : 0;
}

export async function setLastSyncTimestamp(ts: number = Date.now()): Promise<void> {
  await AsyncStorage.setItem(PREF_KEYS.LAST_SYNC, ts.toString());
}

// ─── Bulk Import (for Firebase hydration) ────────────────────────────

/** Import entries from Firebase into SQLite (used during hydration) */
export async function bulkImportEntries(
  logs: DailyLog[]
): Promise<void> {
  const database = await getDatabase();
  if (!database) return;
  
  await database.withTransactionAsync(async () => {
    for (const log of logs) {
      if (!log.entries) continue;
      for (const entry of log.entries) {
        await database.runAsync(
          `INSERT OR REPLACE INTO food_entries
           (id, name, calories, protein, carbs, fat, fiber, sugar, sodium, meal, timestamp, image_uri, confidence, date, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          entry.id,
          entry.name,
          entry.calories,
          entry.protein,
          entry.carbs,
          entry.fat,
          entry.fiber ?? 0,
          entry.sugar ?? 0,
          entry.sodium ?? 0,
          entry.meal,
          entry.timestamp,
          entry.imageUri ?? null,
          entry.confidence ?? null,
          log.date
        );
        // Also populate recent foods
        await upsertRecentFood(entry);
      }

      // Import weight if present
      if (log.weight !== undefined && log.weight !== null) {
        await database.runAsync(
          `INSERT OR REPLACE INTO daily_weights (date, weight, synced) VALUES (?, ?, 1)`,
          log.date,
          log.weight
        );
      }
    }
  });
}

/** Build DailyLog objects from SQLite for a set of dates */
export async function buildDailyLogs(
  dates: string[]
): Promise<DailyLog[]> {
  const database = await getDatabase();
  if (!database) return [];
  const logs: DailyLog[] = [];

  for (const date of dates) {
    const entries = await getMealsByDate(date);
    const weightRow: any = await database.getFirstAsync(
      `SELECT weight FROM daily_weights WHERE date = ?`,
      date
    );
    logs.push({
      date,
      entries,
      weight: weightRow?.weight ?? undefined,
    });
  }

  return logs.filter((l) => l.entries.length > 0 || l.weight !== undefined);
}

// ─── Clear All Data (for sign-out) ──────────────────────────────────

export async function clearAllLocalData(): Promise<void> {
  try {
    const database = await getDatabase();
    await database.execAsync(`
      DELETE FROM food_entries;
      DELETE FROM daily_weights;
      DELETE FROM food_search_cache;
      DELETE FROM recent_foods;
    `);
  } catch (e) {
    console.error("Failed to clear SQLite data:", e);
  }

  // Also clear AsyncStorage preferences
  try {
    await AsyncStorage.multiRemove(Object.values(PREF_KEYS));
  } catch (e) {
    console.error("Failed to clear AsyncStorage prefs:", e);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function rowToFoodEntry(row: any): FoodEntry {
  return {
    id: row.id,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
    fiber: row.fiber || undefined,
    sugar: row.sugar || undefined,
    sodium: row.sodium || undefined,
    meal: row.meal as FoodEntry["meal"],
    timestamp: row.timestamp,
    imageUri: row.image_uri || undefined,
    confidence: row.confidence || undefined,
  };
}

/** Generate date strings for last N days */
export function getLastNDates(n: number): string[] {
  const dates: string[] = [];
  for (let i = n; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}
