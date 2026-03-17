import { Stack } from "expo-router";

export default function FeatureRequestsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ 
          title: "Create Request",
          presentation: "modal",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: "Details & Comments",
          headerShown: false
        }} 
      />
    </Stack>
  );
}
