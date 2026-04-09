import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Animated,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth-context";
import { mockPurchase } from "@/lib/revenuecat";
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import * as Network from "expo-network";
import { useNotifications } from "@/lib/notification-context";

const { width, height } = Dimensions.get("window");

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { checkPremiumStatus } = useAuth();
  const { scheduleNotification } = useNotifications();

  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(""));
  };

  const handlePurchase = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected && networkState.isConnected !== null) {
      showToast("No network connection. Please check your internet.");
      return;
    }

    setIsProcessing(true);

    try {
      if (Platform.OS !== "web" && selectedPackage) {
        await Purchases.purchasePackage(selectedPackage);
      } else {
        await mockPurchase();
      }

      const pkgTypeStr =
        selectedPackage?.identifier === "$rc_annual" ? "yearly" : "monthly";
      await checkPremiumStatus(pkgTypeStr as any, true); // <--- Forcing true so Firebase syncs instantly

      setIsProcessing(false);
      
      // Send a local notification for the purchase
      scheduleNotification(
        "🎉 Welcome to Calzz Premium!",
        `Your ${pkgTypeStr} subscription is now active. Enjoy unlimited scanning and insights!`,
        { type: 'premium_purchase' },
        1.5
      );

      // Success! Go back and show the scanner
      router.back();
      setTimeout(() => {
        router.push("/scanner");
      }, 300);
    } catch (e: any) {
      setIsProcessing(false);
      // Prevent showing error if user simply closed the payment sheet
      if (!e.userCancelled) {
        Alert.alert("Purchase failed", e.message || "Something went wrong.");
      }
    }
  };

  const handleRestore = async () => {
    if (Platform.OS === "web") return;

    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected && networkState.isConnected !== null) {
      showToast("No network connection. Please check your internet.");
      return;
    }

    setIsProcessing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      // Verify if 'premium' entitlement correctly unlocked
      if (
        typeof customerInfo.entitlements.active["premium"] !== "undefined" ||
        typeof customerInfo.entitlements.active["Premium"] !== "undefined"
      ) {
        await checkPremiumStatus("restore" as any);
        setIsProcessing(false);
        Alert.alert("Success", "Your purchases have been restored.");
        router.back();
        setTimeout(() => {
          router.push("/scanner");
        }, 300);
      } else {
        setIsProcessing(false);
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any active subscriptions for your account.",
        );
      }
    } catch (e: any) {
      setIsProcessing(false);
      Alert.alert(
        "Restore failed",
        e.message || "Failed to restore purchases.",
      );
    }
  };

  const FEATURES = [
    "Unlimited AI Food Scanning",
    "Detailed Macronutrient Breakdown",
    "Personalized Smart Insights",
    "Ad-free Experience",
  ];

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    const fetchPaywall = async () => {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected && networkState.isConnected !== null) {
        showToast("No network connection. Please check your internet.");
        // router.back(); // keep on screen but show toast
        return;
      }

      try {
        if (Platform.OS !== "web") {
          const offerings = await Purchases.getOfferings();
          if (
            offerings.current !== null &&
            offerings.current.availablePackages.length !== 0
          ) {
            setOffering(offerings.current);
            // console.log(
            //   JSON.stringify(offerings.current.availablePackages, null, 2),
            // );
            if (offerings.current.annual) {
              setSelectedPackage(offerings.current.annual);
            } else {
              setSelectedPackage(offerings.current.availablePackages[0]);
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchPaywall();
  }, []);

  return (
    <View style={styles.container}>
      {toastMessage ? (
        <Animated.View
          style={[styles.toastContainer, { opacity: fadeAnim }]}
          pointerEvents="none">
          <Ionicons name="wifi-outline" size={20} color="#fff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}

      {/* Background Graphic */}
      <View style={styles.headerGraphic}>
        <Image
          source={require("../assets/images/IMG_0290.png")} // Recycling an existing image
          style={styles.bgImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "#111"]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.closeButton, { top: insets.top + 20 }]}>
        <Ionicons name="close" size={24} color="#FFF" />
      </Pressable>

      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.titleContainer}>
          {/* <Text style={styles.title}>Unlock</Text> */}
          <Text style={styles.titleHighlight}>Calzz Premium</Text>
          <Text style={styles.subtitle}>
            Reach your health goals faster with our AI-powered premium tools.
          </Text>
        </View>

        <View style={styles.featuresList}>
          {FEATURES.map((feat, idx) => (
            <View key={idx} style={styles.featureItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="#c6ff63ff" />
              </View>
              <Text style={styles.featureText}>{feat}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plansContainer}>
          {!offering ? (
            <View style={{ marginVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color="#c6ff63ff" />
            </View>
          ) : (
            offering.availablePackages.map((pkg) => {
              const isSelected = selectedPackage?.identifier === pkg.identifier;
              const isAnnual =
                pkg.identifier === "$rc_annual" || pkg.packageType === "ANNUAL";

              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setSelectedPackage(pkg);
                  }}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardActive,
                  ]}>
                  {isAnnual && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>BEST VALUE</Text>
                    </View>
                  )}
                  <View style={styles.planInfo}>
                    <Text
                      style={[
                        styles.planTitle,
                        isSelected && styles.planTitleActive,
                      ]}>
                      {isAnnual ? "Yearly" : "Monthly"}
                    </Text>
                    <Text style={styles.planDesc}>
                      {isAnnual
                        ? `${pkg.product.introPrice !== null ? "3 days free trial" : ""}`
                        : `Billed ${pkg.product.priceString}/month`}
                    </Text>
                  </View>
                  <View style={styles.planPrice}>
                    <Text
                      style={[
                        styles.priceAmount,
                        isSelected && styles.planTitleActive,
                      ]}>
                      {pkg.product.priceString}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          disabled={isProcessing || !offering}
          onPress={handlePurchase}>
          {isProcessing ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.ctaText}>
              {selectedPackage?.identifier === "$rc_annual" &&
              selectedPackage?.product.introPrice !== null
                ? "Start 3 Days Free Trial"
                : "Continue"}
            </Text>
          )}
        </Pressable>

        <View style={styles.footerLinks}>
          <Pressable onPress={handleRestore}>
            <Text style={styles.footerLinkText}>Restore Purchases</Text>
          </Pressable>
          <Text style={styles.footerLinkText}> • </Text>
          <Pressable onPress={() => router.push("/terms")}>
            <Text style={styles.footerLinkText}>Terms</Text>
          </Pressable>
          <Text style={styles.footerLinkText}> • </Text>
          <Pressable onPress={() => router.push("/privacy-policy")}>
            <Text style={styles.footerLinkText}>Privacy policy</Text>
          </Pressable>
        </View>

        <Text style={styles.disclaimerText}>
          Auto-renewable subscription. Cancel anytime.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111", // Dark premium theme
  },
  headerGraphic: {
    width: "100%",
    height: height * 0.45,
    position: "absolute",
    top: 0,
  },
  bgImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
    lineHeight: 38,
  },
  titleHighlight: {
    fontSize: 40,
    fontFamily: "Poppins_700Bold",
    color: "#c6ff63ff", // The brand lime green
    lineHeight: 46,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
    marginTop: 8,
    lineHeight: 22,
  },
  featuresList: {
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(198, 255, 99, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: "#E5E7EB",
  },
  plansContainer: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#1C1C1E",
    position: "relative",
  },
  planCardActive: {
    borderColor: "#c6ff63ff",
    backgroundColor: "rgba(198, 255, 99, 0.05)",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: 20,
    backgroundColor: "#c6ff63ff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
    marginBottom: 2,
  },
  planTitleActive: {
    color: "#c6ff63ff",
  },
  planDesc: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
  },
  planPrice: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#FFF",
  },
  priceMo: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#9CA3AF",
  },
  ctaButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    backgroundColor: "#c6ff63ff", // Brand color
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#c6ff63ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#000",
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    textAlign: "center",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  footerLinkText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
  },
  toastContainer: {
    position: "absolute",
    bottom: 100, // Adjusted for paywall layout
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 999,
  },
  toastText: {
    color: "#fff",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    flex: 1,
  },
});
