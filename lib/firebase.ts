import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  Auth,
} from "firebase/auth";
import { getDatabase, Database } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getApiUrl } from "./query-client";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;
let googleWebClientId: string = "";
let androidClientId: string = "";
let iosClientId: string = "";
let initPromise: Promise<void> | null = null;

async function fetchFirebaseConfig() {
  try {
    const cached = await AsyncStorage.getItem("firebase_config");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  const baseUrl = getApiUrl();
  const url = new URL("/api/firebase-config", baseUrl);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch Firebase config");
  const config = await res.json();

  try {
    await AsyncStorage.setItem("firebase_config", JSON.stringify(config));
  } catch {}

  return config;
}

async function doInit() {
  const config = await fetchFirebaseConfig();
  googleWebClientId = config.googleWebClientId || "";
  androidClientId = config.androidClientId || "";
  iosClientId = config.iosClientId || "";

  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    databaseURL: config.databaseURL,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
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
  return googleWebClientId;
}

export function getGoogleAndroidClientId(): string {
  return androidClientId;
}

export function getGoogleIosClientId(): string {
  return iosClientId;
}

export { app, auth, database };
