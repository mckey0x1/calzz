import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  Auth,
} from "firebase/auth";
// @ts-ignore - Firebase SDK v11+ typing issue where react-native exports are not mapped
import { getReactNativePersistence } from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";


let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;

let initPromise: Promise<void> | null = null;

async function doInit() {

  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  if (Platform.OS === "web") {
    auth = getAuth(app);
  } else {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(app);
    }
  }

  database = getDatabase(app);
}

export async function initFirebase() {
  if (!initPromise) {
    initPromise = doInit();
  }
  return initPromise;
}

export function getFirebaseAuth(): Auth {
  if (!auth) throw new Error("Firebase not initialized. Call initFirebase() first.");
  return auth;
}

export function getFirebaseDatabase(): Database {
  if (!database) throw new Error("Firebase not initialized. Call initFirebase() first.");
  return database;
}

export function getGoogleWebClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
}

export function getGoogleAndroidClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
}

export function getGoogleIosClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
}

export { app, auth, database };
