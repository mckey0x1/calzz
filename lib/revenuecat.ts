import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// In production, get this from .env
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "public_ios_placeholder";
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "public_android_placeholder";

export async function setupRevenueCat() {
  if (Platform.OS === 'web') return;
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY_ANDROID });
    }
  } catch (error) {
    console.warn("RevenueCat Activation Error:", error);
  }
}

export async function hasPremiumAccess(): Promise<boolean> {
  // Always return false if we want to show the paywall for testing
  // In a real app, you would check revenuecat customer info:
  try {
    if (Platform.OS === 'web') {
       const cached = await AsyncStorage.getItem("mock_premium");
       return cached === "true";
    }
    const customerInfo = await Purchases.getCustomerInfo();
    // Usually RevenueCat uses 'premium' or 'pro' for their entitlements
    const isPremium = typeof customerInfo.entitlements.active['premium'] !== "undefined" || 
                      typeof customerInfo.entitlements.active['Premium'] !== "undefined";
    
    // For development/testing purposes, if no active subs, we check local override
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
