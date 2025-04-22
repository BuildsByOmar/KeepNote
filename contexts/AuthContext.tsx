import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "./ThemeContext";

// URL de l'API
const API_URL = "https://keep.kevindupas.com/api";

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthContextType = {
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  userToken: string | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  isLoading: true,
  userToken: null,
  user: null,
});

export const useAuth = () => useContext(AuthContext);

// Compteur pour les tentatives de connexion échouées
let failedTokenValidations = 0;
const MAX_VALIDATION_ATTEMPTS = 3;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const { isDark } = useTheme();

  const checkAndRedirect = useCallback(() => {
    const inAuthGroup = segments[0] === "auth";

    if (!userToken && !inAuthGroup && !isLoading) {
      router.replace("/auth/login");
    } else if (userToken && inAuthGroup) {
      router.replace("/");
    }
  }, [userToken, isLoading, segments, router]);

  // Vérification du token et récupération des données utilisateur au démarrage
  useEffect(() => {
    const loadToken = async () => {
      try {
        // Utilisation de SecureStore au lieu d'AsyncStorage
        const token = await SecureStore.getItemAsync("userToken");
        const userData = await SecureStore.getItemAsync("userData");

        if (token) {
          // Vérifier la validité du token en effectuant une requête à un endpoint réel
          try {
            const response = await fetch(`${API_URL}/user`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
              },
            });

            if (response.ok) {
              // Le token est valide
              failedTokenValidations = 0; // Réinitialiser le compteur
              setUserToken(token);
              if (userData) {
                const userInfo = JSON.parse(userData);
                setUser(userInfo);
              }
            } else {
              // Le token est invalide (401 unauthorized ou autre erreur)
              failedTokenValidations++;
              console.log("Token invalide, déconnexion...");
              await signOut();
            }
          } catch (error) {
            // Erreur réseau - garder la session en mode hors ligne
            // Mais on limite le nombre de tentatives échouées
            failedTokenValidations++;
            console.log("Erreur réseau lors de la validation du token");
            
            if (failedTokenValidations <= MAX_VALIDATION_ATTEMPTS) {
              if (userData) {
                setUserToken(token);
                setUser(JSON.parse(userData));
              }
            } else {
              await signOut(); // Par sécurité, on déconnecte après trop d'échecs
            }
          }
        } else {
          setUserToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du token");
        await signOut();
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  const signIn = async (token: string, userData: User) => {
    try {
      // Stocker de manière sécurisée avec SecureStore
      await SecureStore.setItemAsync("userToken", token);
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));
      
      // Définir l'expiration du token (24h par défaut)
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      await SecureStore.setItemAsync("tokenExpiry", expiryTime.toString());
      
      failedTokenValidations = 0; // Réinitialiser le compteur à la connexion
      setUserToken(token);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors de la connexion");
    }
  };

  const signOut = async () => {
    try {
      // Supprimer de manière sécurisée avec SecureStore
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userData");
      await SecureStore.deleteItemAsync("tokenExpiry");
      
      setUserToken(null);
      setUser(null);
      failedTokenValidations = 0;
    } catch (error) {
      console.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        isLoading,
        userToken,
        user,
      }}
    >
      {isLoading ? (
        <LoadingScreen isDark={isDark} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// Composant pour afficher l'écran de chargement
function LoadingScreen({ isDark }: { isDark: boolean }) {
  return (
    <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={{ marginTop: 10, color: isDark ? '#fff' : '#000' }}>Chargement...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});