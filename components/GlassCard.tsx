import React from "react";
import { View, StyleSheet, ViewStyle, useColorScheme } from "react-native";
import { useThemeColors } from "@/constants/colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function GlassCard({ children, style, noPadding }: GlassCardProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors(colorScheme);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.glassBorder,
          shadowColor: colors.cardShadow,
        },
        noPadding ? undefined : styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  padding: {
    padding: 16,
  },
});
