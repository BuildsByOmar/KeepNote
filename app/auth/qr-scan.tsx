import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from "react-native";
import tw from "twrnc";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth } from "../_layout";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

export default function QRScanScreen() {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");
  const { signIn } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const theme = useColorScheme();
  const isDark = theme === "dark";

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    setDebug(`🔍 QR Code détecté : ${data.substring(0, 50)}...\n`);

    if (!data.includes("/auth/qr-login/")) {
      setDebug((prev) => prev + "❌ Format de QR code invalide !\n");
      Alert.alert("QR Code invalide", "Ce QR code n'est pas autorisé.");
      setScanned(false);
      setLoading(false);
      return;
    }

    try {
      setDebug((prev) => prev + `⏳ Tentative de connexion...\n`);

      const response = await fetch(data, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const rawText = await response.text();
      setDebug((prev) => prev + `📨 Réponse : ${rawText.substring(0, 50)}...\n`);

      let json;
      try {
        json = JSON.parse(rawText);
      } catch (err) {
        setDebug((prev) => prev + "⚠️ Erreur JSON : " + err + "\n");
        throw new Error("Réponse mal formatée");
      }

      if (!response.ok) {
        throw new Error(json.message || "Erreur d'authentification");
      }

      setDebug((prev) => prev + "✅ Authentification réussie\n");
      await signIn(json.access_token, json.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setDebug((prev) => prev + `🛑 ${msg}\n`);
      Alert.alert("Erreur", msg);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setScanned(false);
    setDebug("");
  };

  if (!permission) {
    return (
      <View style={tw`flex-1 justify-center items-center p-5 ${isDark ? "bg-black" : "bg-white"}`}>
        <Text style={tw`text-base ${isDark ? "text-white" : "text-black"}`}>
          Chargement des permissions caméra...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={tw`flex-1 justify-center items-center px-6 ${isDark ? "bg-black" : "bg-white"}`}>
        <Text style={tw`text-lg text-center mb-4 ${isDark ? "text-red-400" : "text-red-600"}`}>
          ⚠️ Permission caméra requise
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={tw`bg-blue-600 px-6 py-3 rounded-full mb-4`}
        >
          <Text style={tw`text-white font-bold`}>Autoriser l'accès caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`bg-gray-500 px-6 py-3 rounded-full`}
        >
          <Text style={tw`text-white font-bold`}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 ${isDark ? "bg-black" : "bg-white"}`}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {!scanned && (
        <CameraView
          ref={cameraRef}
          style={tw`flex-1`}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarCodeScanned}
        >
          <View style={tw`flex-1 justify-center items-center`}>
            <View
              style={tw`w-64 h-64 border-4 border-blue-400 rounded-2xl bg-transparent`}
            />
          </View>
          <View style={tw`absolute bottom-20 w-full items-center px-4`}>
            <Text
              style={tw`text-white text-center text-lg bg-black bg-opacity-60 p-3 rounded-xl`}
            >
              Placez le QR Code dans le cadre pour vous connecter
            </Text>
          </View>
        </CameraView>
      )}

      {(scanned || debug) && (
        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-6`}>
          <Text style={tw`text-2xl font-bold text-center mb-4 ${isDark ? "text-white" : "text-black"}`}>
            🔍 Lecture du QR Code
          </Text>

          {loading && (
            <View style={tw`items-center justify-center my-4`}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={tw`mt-2 text-base ${isDark ? "text-gray-200" : "text-black"}`}>
                Connexion en cours...
              </Text>
            </View>
          )}

          {debug && (
            <View style={tw`bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-4`}>
              <Text style={tw`font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>🛠️ Débogage :</Text>
              <Text style={tw`font-mono text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {debug}
              </Text>
            </View>
          )}

          {scanned && !loading && (
            <View style={tw`mt-6`}>
              <TouchableOpacity
                onPress={handleRetry}
                style={tw`bg-blue-600 p-3 rounded-lg mb-4`}
              >
                <Text style={tw`text-white text-center font-bold`}>
                  🔄 Scanner un autre QR Code
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.back()}
                style={tw`bg-gray-600 p-3 rounded-lg`}
              >
                <Text style={tw`text-white text-center font-bold`}>
                  ⬅️ Retour
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
