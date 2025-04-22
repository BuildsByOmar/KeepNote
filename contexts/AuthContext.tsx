import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { StyleSheet, View, Text } from "react-native";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

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
        const token = await AsyncStorage.getItem("userToken");
        const userData = await AsyncStorage.getItem("userData");

        if (token) {
          // Vérifier la validité du token en effectuant une requête
          const response = await fetch("YOUR_API_URL/validate-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            setUserToken(token);
            if (userData) {
              const userInfo = JSON.parse(userData);
              setUser(userInfo);
            }
          } else {
            await signOut(); // Si le token est invalide, déconnecter l'utilisateur
          }
        } else {
          setUserToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error(error);
        await signOut(); // En cas d'erreur, déconnecter l'utilisateur
      } finally {
        setIsLoading(false); // Une fois le chargement terminé, mettre à jour l'état
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  const signIn = async (token: string, userData: User) => {
    try {
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      setUserToken(token);
      setUser(userData);
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
      setUserToken(null);
      setUser(null);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
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
        <LoadingScreen /> // Écran de chargement pendant que l'application récupère les informations
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// Composant pour afficher l'écran de chargement
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text>Chargement...</Text>
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
