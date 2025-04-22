import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import tw from "twrnc";
import { Ionicons } from "@expo/vector-icons";

const apiUrl = "https://keep.kevindupas.com/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");
  const { signIn } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme(); // Pour le thème

  const isDark = colorScheme === "dark";
  const isEmailValid = email.length > 0;
  const isPasswordValid = password.length > 0;

  const handleLogin = async () => {
    if (!isEmailValid || !isPasswordValid) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
  
    setLoading(true);
    setDebug("Connexion en cours...\n");
  
    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      const rawText = await response.text();
  
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (error) {
        setDebug(`Erreur de parsing: ${(error as Error).message}`);
        throw new Error("Réponse invalide du serveur.");
      }
  
      if (!response.ok || !data.access_token || !data.user) {
        const errorMessage =
          data?.message || "Identifiants incorrects ou erreur inconnue.";
        throw new Error(errorMessage);
      }
  
      setDebug("Connexion réussie ✅");
      await signIn(data.access_token, data.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue";
      setDebug(`Erreur: ${message}`);
      Alert.alert("Erreur de connexion", message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={tw`flex-1 px-6 justify-center ${isDark ? "bg-black" : "bg-white"}`}>
      <Text style={tw`text-3xl font-bold text-center ${isDark ? "text-white" : "text-blue-600"} mb-10`}>
        🔐 Connexion
      </Text>

      {/* Email */}
      <View
        style={tw.style(
          `flex-row items-center rounded-lg px-4 py-3 mb-4`,
          isDark ? "bg-gray-800" : "bg-gray-200",
          isEmailValid ? "border border-green-500" : "border border-red-500"
        )}
      >
        <Ionicons name="mail-outline" size={20} color="gray" style={tw`mr-2`} />
        <TextInput
          style={tw`flex-1 ${isDark ? "text-white" : "text-black"}`}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Mot de passe */}
      <View
        style={tw.style(
          `flex-row items-center rounded-lg px-4 py-3 mb-4`,
          isDark ? "bg-gray-800" : "bg-gray-200",
          isPasswordValid ? "border border-green-500" : "border border-red-500"
        )}
      >
        <Ionicons name="lock-closed-outline" size={20} color="gray" style={tw`mr-2`} />
        <TextInput
          style={tw`flex-1 ${isDark ? "text-white" : "text-black"}`}
          placeholder="Mot de passe"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Connexion */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={tw`bg-blue-600 py-3 rounded-lg mb-3`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={tw`text-white text-center font-bold`}>Se connecter</Text>
        )}
      </TouchableOpacity>

      {/* Scanner QR */}
      <TouchableOpacity
        onPress={() => router.push("/auth/qr-scan")}
        style={tw`bg-gray-700 py-3 rounded-lg`}
      >
        <Text style={tw`text-white text-center font-bold`}>📷 Scanner un QR Code</Text>
      </TouchableOpacity>

      {/* Debug zone */}
      {debug ? (
        <View style={tw`mt-6 p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
          <Text style={tw`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{debug}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
