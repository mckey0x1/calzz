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
import Purchases, { CustomerInfo } from "react-native-purchases";
import {
  setupRevenueCat,
  hasPremiumAccess,
  logInUser,
  logOutUser,
} from "./revenuecat";
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  reload,
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
  // Email/Password Methods
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  reloadUser: () => Promise<boolean>;
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
            if (justSignedOutRef.current && firebaseUser) {
              return;
            }

            setUser(firebaseUser);
            if (firebaseUser) {
              const cached = await AsyncStorage.getItem(
                `onboarding_${firebaseUser.uid}`,
              );
              if (cached === "true") {
                setIsNewUser(false);
                setIsLoading(false);
              }
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

  // Sync RevenueCat updates to Firebase Database automatically
  useEffect(() => {
    if (Platform.OS === 'web') return;

    Purchases.addCustomerInfoUpdateListener(async (customerInfo: CustomerInfo) => {
      const isPremiumNow = 
        typeof customerInfo.entitlements.active['premium'] !== "undefined" ||
        typeof customerInfo.entitlements.active['Premium'] !== "undefined" ||
        typeof customerInfo.entitlements.active['Calzz premium'] !== "undefined";
      
      setIsPremium(isPremiumNow);

      if (user) {
        try {
          const db = getFirebaseDatabase();
          const userRef = ref(db, `users/${user.uid}`);
          await update(userRef, {
            isPremium: isPremiumNow,
            lastPremiumCheckAt: Date.now()
          });
          setUserProfile(prev => prev ? { ...prev, isPremium: isPremiumNow } : null);
        } catch (e) {
          console.log("RevenueCat auto-sync to DB error:", e);
        }
      }
    });
  }, [user]);

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
        get(goalsRef),
      ]);

      const hasOnboarded =
        goalsSnap.exists() ||
        (await AsyncStorage.getItem(`onboarding_${firebaseUser.uid}`)) ===
          "true";

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

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseReady) {
      console.error("Firebase not ready yet");
      return;
    }
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

        let idToken: string | null = null;

        if (signInResult && "type" in signInResult) {
          if (signInResult.type === "success") {
            idToken = signInResult.data?.idToken ?? null;
          } else {
            setIsSigningIn(false);
            return;
          }
        } else if (signInResult && "data" in signInResult) {
          idToken = signInResult.data?.idToken ?? null;
        } else if (signInResult && "idToken" in signInResult) {
          idToken = signInResult.idToken;
        }

        if (idToken) {
          const authInstance = getFirebaseAuth();
          const googleCredential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(authInstance, googleCredential);
        } else {
          setIsSigningIn(false);
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setIsSigningIn(false);
    }
  }, [firebaseReady, clientId]);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.setItem("just_signed_out", "true");
      setJustSignedOut(true);
      justSignedOutRef.current = true;

      await logOutUser();

      const authInstance = getFirebaseAuth();
      await firebaseSignOut(authInstance);
      await AsyncStorage.removeItem("onboarding_done");
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
  }, []);

  const clearJustSignedOut = useCallback(() => {
    justSignedOutRef.current = false;
    setJustSignedOut(false);
  }, []);

  const deleteAccount = React.useCallback(async () => {
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
  }, [user]);

  const updateDisplayName = React.useCallback(
    async (name: string) => {
      if (!user) return;
      try {
        const authInstance = getFirebaseAuth();
        if (authInstance.currentUser) {
          await updateProfile(authInstance.currentUser, { displayName: name });
          // Update local user state
          setUser((prev) =>
            prev ? ({ ...prev, displayName: name } as any) : null,
          );
        }

        // Also update real-time database
        const db = getFirebaseDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        await update(userRef, { displayName: name });

        // Update local profile state
        setUserProfile((prev) =>
          prev ? { ...prev, displayName: name } : null,
        );
      } catch (error) {
        console.error("Update display name error:", error);
        throw error;
      }
    },
    [user?.uid],
  );

  const checkPremiumStatus = React.useCallback(
    async (planName?: string, forceTrue?: boolean) => {
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

          setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
        } catch (err) {
          console.warn("Failed syncing premium status to Firebase", err);
        }
      }
    },
    [user?.uid],
  );

  const syncUserPushToken = React.useCallback(
    async (token: string) => {
      if (!user) return;
      try {
        const db = getFirebaseDatabase();
        const userRef = ref(db, `users/${user.uid}`);
        await update(userRef, { pushToken: token });
        setUserProfile((prev) =>
          prev ? ({ ...prev, pushToken: token } as any) : null,
        );
        // console.log("✅ Push Token synced to Firebase");
      } catch (err) {
        console.warn("❌ Failed syncing push token to Firebase", err);
      }
    },
    [user?.uid],
  );

  const signUpWithEmail = React.useCallback(
    async (email: string, password: string) => {
      setIsSigningIn(true);
      try {
        const authInstance = getFirebaseAuth();
        const userCredential = await createUserWithEmailAndPassword(
          authInstance,
          email,
          password,
        );
        // Automatically send verification on signup
        if (userCredential.user) {
          try {
            await sendEmailVerification(userCredential.user);
            console.log("✅ Initial verification email sent to:", email);
          } catch (vErr) {
            console.warn("⚠️ Failed to send initial verification email:", vErr);
          }
        }
      } catch (error) {
        console.error("Sign up error:", error);
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [],
  );

  const signInWithEmail = React.useCallback(
    async (email: string, password: string) => {
      setIsSigningIn(true);
      try {
        const authInstance = getFirebaseAuth();
        await signInWithEmailAndPassword(authInstance, email, password);
      } catch (error) {
        console.error("Sign in error:", error);
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [],
  );

  const resetPassword = React.useCallback(async (email: string) => {
    try {
      const authInstance = getFirebaseAuth();
      await sendPasswordResetEmail(authInstance, email);
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }, []);

  const verifyEmail = React.useCallback(async () => {
    const authInstance = getFirebaseAuth();
    if (authInstance.currentUser) {
      try {
        console.log(
          "Attempting to send verification email to:",
          authInstance.currentUser.email,
        );
        await sendEmailVerification(authInstance.currentUser);
        console.log("✅ Verification email request successful");
      } catch (error: any) {
        console.error(
          "❌ sendEmailVerification failed:",
          error.code,
          error.message,
        );
        // Special handling for rate limiting
        if (error.code === "auth/too-many-requests") {
          throw new Error(
            "Too many requests. Firebase limits how often you can send these. Please wait 10-15 minutes.",
          );
        }
        throw error;
      }
    } else {
      console.warn("⚠️ No current user found when trying to verify email");
    }
  }, []);

  const changeEmail = React.useCallback(async (newEmail: string) => {
    const authInstance = getFirebaseAuth();
    if (authInstance.currentUser) {
      try {
        const actionCodeSettings = {
          url: `https://${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
          handleCodeInApp: false,
        };
        // Use verifyBeforeUpdateEmail for better security in newer SDKs
        await verifyBeforeUpdateEmail(
          authInstance.currentUser,
          newEmail,
          actionCodeSettings,
        );
        // Note: The email in Firebase won't change until they verify the new one
      } catch (error: any) {
        console.error("Change email error:", error);
        if (error.code === "auth/too-many-requests") {
          throw new Error(
            "Too many requests. Please wait a few minutes before trying again.",
          );
        }
        throw error;
      }
    }
  }, []);

  const changePassword = React.useCallback(async (newPassword: string) => {
    const authInstance = getFirebaseAuth();
    if (authInstance.currentUser) {
      try {
        await firebaseUpdatePassword(authInstance.currentUser, newPassword);
      } catch (error) {
        console.error("Change password error:", error);
        throw error;
      }
    }
  }, []);

  const reloadUser = React.useCallback(async () => {
    const authInstance = getFirebaseAuth();
    if (authInstance.currentUser) {
      try {
        await reload(authInstance.currentUser);
        const updatedUser = authInstance.currentUser;
        setUser({ ...updatedUser });
        return updatedUser.emailVerified;
      } catch (error) {
        console.error("Reload user error:", error);
        throw error;
      }
    }
    return false;
  }, []);

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
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      verifyEmail,
      changeEmail,
      changePassword,
      reloadUser,
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
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      verifyEmail,
      changeEmail,
      changePassword,
      reloadUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
