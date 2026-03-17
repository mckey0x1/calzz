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
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  User,
  signInWithPopup,
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [justSignedOut, setJustSignedOut] = useState(false);
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
            setUser(firebaseUser);
            if (firebaseUser) {
              await loadOrCreateProfile(firebaseUser);
            } else {
              setUserProfile(null);
            }
            setIsLoading(false);
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
        const signInResult = await GoogleSignin.signIn();

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
          idToken = (signInResult as any).data?.idToken ?? null;
        } else if (signInResult && "idToken" in signInResult) {
          // older version fallback
          idToken = (signInResult as any).idToken;
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
      console.error("Google sign in error:", error);
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    try {
      justSignedOutRef.current = true;
      setJustSignedOut(true);
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
    try {
      const db = getFirebaseDatabase();
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, { status: "deleted" });

      const authInstance = getFirebaseAuth();
      if (authInstance.currentUser) {
        await authInstance.currentUser.delete();
      }
      if (Platform.OS !== "web") {
        try {
          // revokeAccess forces Google backend to decouple the token
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        } catch (e) {
          console.log("Google SignOut/Revoke error:", e);
        }
      }
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Delete account error:", error);
      throw error;
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
    }),
    [user, userProfile, isLoading, isSigningIn, firebaseReady, justSignedOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
