import { ref, set, get, update } from "firebase/database";
import { getFirebaseDatabase } from "./firebase";
import type { DailyLog, UserGoals } from "./nutrition-context";

function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

export async function saveUserGoals(uid: string, goals: UserGoals) {
  try {
    const db = getFirebaseDatabase();
    const goalsRef = ref(db, `userData/${uid}/goals`);
    await set(goalsRef, goals);
  } catch (error) {
    console.error("Error saving goals:", error);
  }
}

export async function loadUserGoals(uid: string): Promise<UserGoals | null> {
  try {
    const db = getFirebaseDatabase();
    const goalsRef = ref(db, `userData/${uid}/goals`);
    const snapshot = await get(goalsRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error loading goals:", error);
    return null;
  }
}

export async function saveDailyLog(uid: string, log: DailyLog) {
  try {
    const db = getFirebaseDatabase();
    const logRef = ref(db, `userData/${uid}/logs/${log.date}`);
    await set(logRef, log);
  } catch (error) {
    console.error("Error saving daily log:", error);
  }
}

export async function loadDailyLog(uid: string, date: string): Promise<DailyLog | null> {
  try {
    const db = getFirebaseDatabase();
    const logRef = ref(db, `userData/${uid}/logs/${date}`);
    const snapshot = await get(logRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error loading daily log:", error);
    return null;
  }
}

export async function loadWeekLogs(uid: string): Promise<DailyLog[]> {
  const logs: DailyLog[] = [];
  try {
    const db = getFirebaseDatabase();
    // Single read of parent path — replaces 30 sequential get() calls
    const logsRef = ref(db, `userData/${uid}/logs`);
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const allLogs = snapshot.val();
      // Build cutoff date (30 days ago)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().split("T")[0];
      const todayStr = new Date().toISOString().split("T")[0];
      
      for (const [dateKey, logData] of Object.entries(allLogs)) {
        if (dateKey >= cutoffStr && dateKey < todayStr && logData) {
          logs.push(logData as DailyLog);
        }
      }
      // Sort chronologically
      logs.sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (error) {
    console.error("Error loading week logs:", error);
  }
  return logs;
}

export async function syncAllDataToFirebase(
  uid: string,
  data: { goals: UserGoals; todayLog: DailyLog; weekLogs: DailyLog[] }
) {
  try {
    const db = getFirebaseDatabase();
    const updates: Record<string, any> = {};
    updates[`userData/${uid}/goals`] = data.goals;
    updates[`userData/${uid}/logs/${data.todayLog.date}`] = data.todayLog;
    data.weekLogs.forEach((log) => {
      updates[`userData/${uid}/logs/${log.date}`] = log;
    });
    const rootRef = ref(db);
    await update(rootRef, updates);
  } catch (error) {
    console.error("Error syncing data:", error);
  }
}
