import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Platform, Alert } from "react-native";
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { ref, set, get, update } from "firebase/database";
import {
  initFirebase,
  getFirebaseAuth,
  getFirebaseDatabase,
  getGoogleWebClientId,
} from "./firebase";

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
}

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isSigningIn: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [clientId, setClientId] = useState<string | undefined>(undefined);

  useEffect(() => {
    initFirebase()
      .then(() => {
        setFirebaseReady(true);
        setClientId(getGoogleWebClientId() || undefined);

        const authInstance = getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
          setUser(firebaseUser);
          if (firebaseUser) {
            await loadOrCreateProfile(firebaseUser);
          } else {
            setUserProfile(null);
          }
          setIsLoading(false);
        });
        return unsubscribe;
      })
      .catch((err) => {
        console.error("Firebase init failed:", err);
        setIsLoading(false);
      });
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: clientId,
    expoClientId: clientId,
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.idToken) {
      const credential = GoogleAuthProvider.credential(response.authentication.idToken);
      const authInstance = getFirebaseAuth();
      signInWithCredential(authInstance, credential).catch((error) => {
        console.error("Firebase sign in error:", error);
        setIsSigningIn(false);
      });
    } else if (response?.type === "error" || response?.type === "dismiss") {
      setIsSigningIn(false);
    }
  }, [response]);

  async function loadOrCreateProfile(firebaseUser: User) {
    try {
      const db = getFirebaseDatabase();
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const existing = snapshot.val() as UserProfile;
        await update(userRef, { lastLoginAt: Date.now() });
        setUserProfile({ ...existing, lastLoginAt: Date.now() });
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };
        await set(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setUserProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    }
    setIsSigningIn(false);
  }

  async function signInWithGoogle() {
    if (!firebaseReady) {
      console.error("Firebase not ready yet");
      return;
    }
    try {
      setIsSigningIn(true);
      await promptAsync();
    } catch (error) {
      console.error("Google sign in error:", error);
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    try {
      const authInstance = getFirebaseAuth();
      await firebaseSignOut(authInstance);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  const value = useMemo(
    () => ({ user, userProfile, isLoading, isSigningIn, firebaseReady, signInWithGoogle, signOut }),
    [user, userProfile, isLoading, isSigningIn, firebaseReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
