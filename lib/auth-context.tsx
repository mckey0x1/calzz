import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setupRevenueCat, hasPremiumAccess, logInUser, logOutUser } from "./revenuecat";
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as WebBrowser from "expo-web-browser";
import { ref, set, get, update } from "firebase/database";
import {
  initFirebase,
  getFirebaseAuth,
  getFirebaseDatabase,
  getGoogleWebClientId,
  getGoogleAndroidClientId,
  getGoogleIosClientId,
} from "./firebase";

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
  isPremium?: boolean;
  premiumPlan?: string;
  lastPremiumCheckAt?: number;
}

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isSigningIn: boolean;
  firebaseReady: boolean;
  justSignedOut: boolean;
  clearJustSignedOut: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  isNewUser: boolean;
  setIsNewUser: (val: boolean) => void;
  isMidOnboarding: boolean;
  setIsMidOnboarding: (val: boolean) => void;
  isPremium: boolean;
  checkPremiumStatus: (planName?: string, forceTrue?: boolean) => Promise<void>;
  syncUserPushToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [justSignedOut, setJustSignedOut] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isMidOnboarding, setIsMidOnboarding] = useState(false);
  const justSignedOutRef = useRef(false);
  const [clientId, setClientId] = useState<string | undefined>(
    getGoogleWebClientId() || undefined,
  );
  const [androidClientId, setAndroidClientId] = useState<string | undefined>(
    getGoogleAndroidClientId() || undefined,
  );
  const [iosClientId, setIosClientId] = useState<string | undefined>(
    getGoogleIosClientId() || undefined,
  );

  useEffect(() => {
    // Initialize RevenueCat
    setupRevenueCat();

    initFirebase()
      .then(() => {
        setFirebaseReady(true);
        setClientId(getGoogleWebClientId() || undefined);
        setAndroidClientId(getGoogleAndroidClientId() || undefined);
        setIosClientId(getGoogleIosClientId() || undefined);

        const authInstance = getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(
          authInstance,
          async (firebaseUser) => {
            // If we just signed out, don't re-set user to a stale value
            if (justSignedOutRef.current && firebaseUser) {
              return;
            }

            // Only set loading to true if we don't already have an initialized state
            // to avoid unmounting the entire app root layout during active sign-ins.
            
            setUser(firebaseUser);
            if (firebaseUser) {
              // ⚡ FAST PATH: Check local cache first for onboarding status
              const cached = await AsyncStorage.getItem(
                `onboarding_${firebaseUser.uid}`,
              );
              if (cached === "true") {
                setIsNewUser(false);
                setIsLoading(false); // Reveal app early
              }

              // 🔑 Identify this user in RevenueCat so they appear in the dashboard
              await logInUser(firebaseUser.uid);

              await loadOrCreateProfile(firebaseUser);
              setIsLoading(false); // Ensure loading is false after full check
            } else {
              setUserProfile(null);
              setIsLoading(false); // Set false immediately for guest user
            }
          },
        );
        return unsubscribe;
      })
      .catch((err) => {
        console.error("Firebase init failed:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (clientId) {
      GoogleSignin.configure({
        webClientId: clientId,
        iosClientId: iosClientId,
        // @ts-ignore
        offlineAccess: true,
      });
    }
  }, [clientId, iosClientId]);

  // We pull premium status when auth finishes
  async function loadOrCreateProfile(firebaseUser: User) {
    try {
      // ⚡ FAST PATH: Check premium cache
      const pStatus = await hasPremiumAccess();
      setIsPremium(pStatus);

      const db = getFirebaseDatabase();
      const userRef = ref(db, `users/${firebaseUser.uid}`);
      const goalsRef = ref(db, `userData/${firebaseUser.uid}/goals`);
      
      // Parallel check for profile and goals
      const [snap, goalsSnap] = await Promise.all([
        get(userRef),
        get(goalsRef)
      ]);

      const hasOnboarded =
        goalsSnap.exists() ||
        (await AsyncStorage.getItem(`onboarding_${firebaseUser.uid}`)) === "true";

      if (snap.exists()) {
        const existing = snap.val() as UserProfile;
        const updates: any = {
          lastLoginAt: Date.now(),
          isPremium: pStatus,
          lastPremiumCheckAt: Date.now(),
        };
        await update(userRef, updates);
        setUserProfile({ ...existing, ...updates });
        setIsNewUser(!hasOnboarded);
        
        if (hasOnboarded) {
          await AsyncStorage.setItem(`onboarding_${firebaseUser.uid}`, "true");
          await AsyncStorage.setItem("onboarding_done", "true");
        }
      } else {
        // No profile at all
        setIsNewUser(!hasOnboarded);
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          isPremium: pStatus,
          lastPremiumCheckAt: Date.now(),
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
    // Reset the logout marker when starting a new sign-in flow.
    setJustSignedOut(false);

    try {
      setIsSigningIn(true);
      if (Platform.OS === "web") {
        const authInstance = getFirebaseAuth();
        const provider = new GoogleAuthProvider();
        await signInWithPopup(authInstance, provider);
      } else {
        if (!clientId) {
          console.error("Client ID not ready");
          setIsSigningIn(false);
          return;
        }
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        const signInResult: any = await GoogleSignin.signIn();

        // Handle idToken correctly based on the return type of GoogleSignin.signIn()
        let idToken: string | null = null;

        if (signInResult && "type" in signInResult) {
          if (signInResult.type === "success") {
            idToken = signInResult.data?.idToken ?? null;
          } else {
            // E.g., CancelledResponse
            setIsSigningIn(false);
            return;
          }
        } else if (signInResult && "data" in signInResult) {
          idToken = signInResult.data?.idToken ?? null;
        } else if (signInResult && "idToken" in signInResult) {
          // older version fallback
          idToken = signInResult.idToken;
        }

        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          const authInstance = getFirebaseAuth();
          await signInWithCredential(authInstance, credential);
        } else {
          console.error("No ID token returned from Google Sign In");
          setIsSigningIn(false);
        }
      }
    } catch (error) {
      // console.error("Google sign in error:", error);
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    try {
      justSignedOutRef.current = true;
      setJustSignedOut(true);
      await AsyncStorage.removeItem("onboarding_done");

      // 🔑 Log out from RevenueCat (reset to anonymous)
      await logOutUser();

      const authInstance = getFirebaseAuth();
      await firebaseSignOut(authInstance);
      if (Platform.OS !== "web") {
        try {
          await GoogleSignin.signOut();
        } catch (e) {
          console.log("Google SignOut error:", e);
        }
      }
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  const clearJustSignedOut = React.useCallback(() => {
    justSignedOutRef.current = false;
    setJustSignedOut(false);
  }, []);

  async function deleteAccount() {
    if (!user) return;
    const authInstance = getFirebaseAuth();
    const currentUser = authInstance.currentUser;
    if (!currentUser) return;

    try {
      // 1. Cleanup personal content (Feature Requests & Comments)
      const db = getFirebaseDatabase();
      const requestsRef = ref(db, "feature_requests");
      const snapshot = await get(requestsRef);

      if (snapshot.exists()) {
        const allRequests = snapshot.val();
        const updates: any = {};

        Object.keys(allRequests).forEach((reqId) => {
          const req = allRequests[reqId];

          // If user created the request, delete the entire request
          if (req.createdBy === user.uid) {
            updates[`feature_requests/${reqId}`] = null;
          } else {
            // Otherwise, check for and delete user's comments in other requests
            if (req.comments) {
              let commentsChanged = false;
              Object.keys(req.comments).forEach((commentId) => {
                if (req.comments[commentId].createdBy === user.uid) {
                  updates[`feature_requests/${reqId}/comments/${commentId}`] =
                    null;
                  commentsChanged = true;
                }
              });

              if (commentsChanged) {
                // Approximate new count (optional, but good for data integrity)
                const remainingComments = Object.keys(req.comments).filter(
                  (cid) => req.comments[cid].createdBy !== user.uid,
                ).length;
                updates[`feature_requests/${reqId}/commentsCount`] =
                  remainingComments;
              }
            }

            // Also remove user from upvotedBy list if present
            if (req.upvotedBy?.[user.uid]) {
              updates[`feature_requests/${reqId}/upvotedBy/${user.uid}`] = null;
              updates[`feature_requests/${reqId}/upvotes`] = Math.max(
                0,
                (req.upvotes || 0) - 1,
              );
            }
          }
        });

        if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
        }
      }

      // 2. Mark user profile as deleted
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, { status: "deleted" }).catch((e) =>
        console.log("DB Cleanup skip/error:", e),
      );

      // 3. Delete the Auth User. This is the final step.
      await currentUser.delete();

      if (Platform.OS !== "web") {
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        } catch (e) {
          console.log("Google SignOut/Revoke error:", e);
        }
      }
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      // console.error("Delete account error:", error);
      throw error;
    }
  }

  async function updateDisplayName(name: string) {
    if (!user) return;
    try {
      const authInstance = getFirebaseAuth();
      if (authInstance.currentUser) {
        await updateProfile(authInstance.currentUser, { displayName: name });
        // Update local user state to trigger re-render
        setUser({ ...authInstance.currentUser });
      }

      // Also update real-time database
      const db = getFirebaseDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, { displayName: name });

      // Update local profile state
      if (userProfile) {
        setUserProfile({ ...userProfile, displayName: name });
      }
    } catch (error) {
      console.error("Update display name error:", error);
      throw error;
    }
  }

  async function checkPremiumStatus(planName?: string, forceTrue?: boolean) {
    const status = forceTrue ? true : await hasPremiumAccess();
    setIsPremium(status);

    // Sync to Firebase if user is logged in
    if (user) {
      try {
        const db = getFirebaseDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        const updates: any = {
          isPremium: status,
          lastPremiumCheckAt: Date.now(),
        };
        if (planName) updates.premiumPlan = planName;

        await update(userRef, updates);

        if (userProfile) {
          setUserProfile({ ...userProfile, ...updates });
        }
      } catch (err) {
        console.warn("Failed syncing premium status to Firebase", err);
      }
    }
  }

  async function syncUserPushToken(token: string) {
    if (!user) return;
    try {
      const db = getFirebaseDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, { pushToken: token });
      if (userProfile) {
        setUserProfile({ ...userProfile, pushToken: token } as any);
      }
      console.log("✅ Push Token synced to Firebase");
    } catch (err) {
      console.warn("❌ Failed syncing push token to Firebase", err);
    }
  }

  const value = useMemo(
    () => ({
      user,
      userProfile,
      isLoading,
      isSigningIn,
      firebaseReady,
      justSignedOut,
      clearJustSignedOut,
      signInWithGoogle,
      signOut,
      deleteAccount,
      updateDisplayName,
      isNewUser,
      setIsNewUser: (val: boolean) => {
        setIsNewUser(val);
        if (!val && user) {
          AsyncStorage.setItem(`onboarding_${user.uid}`, "true");
        }
      },
      isMidOnboarding,
      setIsMidOnboarding,
      isPremium,
      checkPremiumStatus,
      syncUserPushToken,
    }),
    [
      user,
      userProfile,
      isLoading,
      isSigningIn,
      firebaseReady,
      justSignedOut,
      updateDisplayName,
      isNewUser,
      isMidOnboarding,
      isPremium,
      setIsMidOnboarding,
      clearJustSignedOut,
      signInWithGoogle,
      signOut,
      deleteAccount,
      syncUserPushToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
