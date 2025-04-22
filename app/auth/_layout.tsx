import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{headerShown: true}} />
      <Stack.Screen
        name="qr-scan"
        options={{
          title: "Scan QR Code",
          headerShown: true
        }}
      />
    </Stack>
  );
}
