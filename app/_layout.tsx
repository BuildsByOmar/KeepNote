import { Stack } from "expo-router";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotesProvider } from "@/contexts/NotesContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotesProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </NotesProvider>
    </AuthProvider>
  );
}