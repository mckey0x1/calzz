import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, Link } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  View,
  Pressable,
  Image,
  Appearance,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import React from "react";
import { useThemeColors } from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const isDark = false;
  // const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerTitle: "",
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="food-log" options={{ title: "Log" }} />
      <Tabs.Screen name="analytics" options={{ title: "Progress" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);
  const insets = useSafeAreaInsets();
  const isDark = false;
  const { width } = useWindowDimensions();

  const tabWidth = width - 40;
  const tabHeight = 70;
  const r = 40;
  const hw = 90;
  const hh = 26;
  const cx = tabWidth / 2;
  const hx1 = cx - hw / 2;
  const hx2 = cx + hw / 2;

  const path = `
    M 0 ${r}
    Q 0 0 ${r} 0
    L ${hx1} 0
    C ${hx1 + 10} 0, ${hx1 + 14} ${hh}, ${cx} ${hh}
    C ${hx2 - 14} ${hh}, ${hx2 - 10} 0, ${hx2} 0
    L ${tabWidth - r} 0
    Q ${tabWidth} 0 ${tabWidth} ${r}
    L ${tabWidth} ${tabHeight - r}
    Q ${tabWidth} ${tabHeight} ${tabWidth - r} ${tabHeight}
    L ${r} ${tabHeight}
    Q 0 ${tabHeight} 0 ${tabHeight - r}
    Z
  `
    .replace(/\s+/g, " ")
    .trim();

  // The allowed routes we want shown in the tab bar
  const allowedRoutes = ["index", "analytics", "food-log", "profile"];
  const visibleRoutes = state.routes.filter((route: any) =>
    allowedRoutes.includes(route.name),
  );

  // Fix ordering to match: Home, Analytics, space, Food Log, Profile
  const sortedRoutes = visibleRoutes.sort(
    (a: any, b: any) =>
      allowedRoutes.indexOf(a.name) - allowedRoutes.indexOf(b.name),
  );

  const leftRoutes = sortedRoutes.slice(0, 2);
  const rightRoutes = sortedRoutes.slice(2, 4);

  const renderTab = (route: any) => {
    // Determine if this route is currently active
    const isFocused = state.routes[state.index].key === route.key;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const icons: any = {
      index: "home",
      analytics: "bar-chart",
      "food-log": "flame",
      profile: "person",
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}>
        <View
          style={{
            borderRadius: 25,
            ...(isFocused
              ? {
                  shadowColor: "#d8e9ba",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.6,
                  shadowRadius: 12,
                  elevation: 8,
                }
              : {}),
          }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: isFocused ? "#c6ff63ff" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}>
            <Ionicons
              name={icons[route.name] || "square"}
              size={22}
              color={isFocused ? "#000" : "#9CA3AF"}
            />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 10,
        left: 20,
        right: 20,
        height: tabHeight,
        alignItems: "center",
        justifyContent: "center",
      }}>
      {/* Tab Background SVG Container */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1,
          shadowRadius: 30,
          elevation: 10,
        }}>
        <Svg
          width={tabWidth}
          height={tabHeight}
          viewBox={`0 0 ${tabWidth} ${tabHeight}`}>
          <Path d={path} fill="#111111" />
        </Svg>
      </View>

      {/* Foreground Items Container */}
      <View
        style={{
          flexDirection: "row",
          width: tabWidth,
          height: tabHeight,
        }}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          {leftRoutes.map((route: any) => renderTab(route))}
        </View>
        <View style={{ width: hw }} />
        <View style={{ flex: 1, flexDirection: "row" }}>
          {rightRoutes.map((route: any) => renderTab(route))}
        </View>
      </View>

      {/* Large Floating Center Button */}
      <View
        style={{
          position: "absolute",
          top: -46,
          left: tabWidth / 2 - 32,
          height: 64,
          width: 64,
          backgroundColor: "#000",
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}>
        <Link href="/scanner" asChild>
          <Pressable
            style={({ pressed }) => ({
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#000",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}>
            <Ionicons name="scan" size={28} color="#FFF" />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

export default function TabLayout() {
  // Always use the custom layout for now to ensure design consistency
  return <ClassicTabLayout />;
}
