import { Stack } from "expo-router";

export default function PersonalDetailsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
  );
}
