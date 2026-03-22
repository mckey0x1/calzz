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
    const cleanGoals = JSON.parse(JSON.stringify(goals));
    await set(goalsRef, cleanGoals);
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
    const cleanLog = JSON.parse(JSON.stringify(log));
    await set(logRef, cleanLog);
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
    for (let i = 30; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = getDateKey(d);
      const logRef = ref(db, `userData/${uid}/logs/${dateKey}`);
      const snapshot = await get(logRef);
      if (snapshot.exists()) {
        logs.push(snapshot.val());
      } else {
        logs.push({
          date: dateKey,
          entries: [],
          waterGlasses: 0,
          steps: 0,
        });
      }
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
    const cleanGoals = JSON.parse(JSON.stringify(data.goals));
    const cleanTodayLog = JSON.parse(JSON.stringify(data.todayLog));
    updates[`userData/${uid}/goals`] = cleanGoals;
    updates[`userData/${uid}/logs/${cleanTodayLog.date}`] = cleanTodayLog;
    data.weekLogs.forEach((log) => {
      const cleanLog = JSON.parse(JSON.stringify(log));
      updates[`userData/${uid}/logs/${cleanLog.date}`] = cleanLog;
    });
    const rootRef = ref(db);
    await update(rootRef, updates);
  } catch (error) {
    console.error("Error syncing data:", error);
  }
}
