import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "public_ios_placeholder";
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "public_android_placeholder";

// ── Configuration gate: ensures configure() finishes before any SDK call ──
let configurePromise: Promise<void> | null = null;
let isConfigured = false;

async function waitForConfiguration(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (isConfigured) return true;
  if (configurePromise) {
    await configurePromise;
    return isConfigured;
  }
  return false;
}

/**
 * Initialize RevenueCat SDK (call once at app startup).
 * Creates an anonymous user — identified later with logInUser().
 */
export async function setupRevenueCat() {
  if (Platform.OS === 'web') return;

  configurePromise = (async () => {
    try {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      const apiKey = Platform.OS === 'ios'
        ? REVENUECAT_API_KEY_IOS
        : REVENUECAT_API_KEY_ANDROID;

      Purchases.configure({ apiKey });
      isConfigured = true;
      console.log("✅ RevenueCat configured with key:", apiKey.substring(0, 8) + "...");
    } catch (error) {
      console.warn("❌ RevenueCat Activation Error:", error);
      isConfigured = false;
    }
  })();

  await configurePromise;
}

export async function logInUser(firebaseUid: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const ready = await waitForConfiguration();
  if (!ready) {
    console.warn("⚠️ RevenueCat not configured, skipping logIn");
    return;
  }

  try {
    const { customerInfo } = await Purchases.logIn(firebaseUid);
    console.log("✅ RevenueCat: Logged in as", firebaseUid);
    console.log("   Active entitlements:", Object.keys(customerInfo.entitlements.active));
  } catch (error) {
    console.warn("❌ RevenueCat logIn error:", error);
  }
}

export async function logOutUser(): Promise<void> {
  if (Platform.OS === 'web') return;

  const ready = await waitForConfiguration();
  if (!ready) return;

  try {
    const isAnon = await Purchases.isAnonymous();
    if (!isAnon) {
      await Purchases.logOut();
      console.log("✅ RevenueCat: Logged out, reset to anonymous");
    }
  } catch (error) {
    console.warn("❌ RevenueCat logOut error:", error);
  }
}

/**
 * Check if the current user has an active "premium" entitlement.
 */
export async function hasPremiumAccess(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const cached = await AsyncStorage.getItem("mock_premium");
      return cached === "true";
    }

    const ready = await waitForConfiguration();
    if (!ready) {
      const cached = await AsyncStorage.getItem("mock_premium");
      return cached === "true";
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium =
      typeof customerInfo.entitlements.active['Calzz premium'] !== "undefined";

    if (!isPremium) {
      const cached = await AsyncStorage.getItem("mock_premium");
      return cached === "true";
    }
    return isPremium;
  } catch (e) {
    console.warn("RevenueCat Profile Error", e);
    const cached = await AsyncStorage.getItem("mock_premium");
    return cached === "true";
  }
}

export async function mockPurchase() {
  await AsyncStorage.setItem("mock_premium", "true");
  return true;
}
