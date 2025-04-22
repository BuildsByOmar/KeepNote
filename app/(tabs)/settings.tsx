import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [syncEnabled, setSyncEnabled] = React.useState(true);
  const [apiCallCount, setApiCallCount] = React.useState(0);

  // Charger le compteur d'API au démarrage et le rafraîchir périodiquement
  React.useEffect(() => {
    const loadApiCounter = async () => {
      try {
        const count = await AsyncStorage.getItem('apiCallCount');
        if (count) {
          setApiCallCount(parseInt(count));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des compteurs:', error);
      }
    };

    loadApiCounter();
    
    // Rafraîchir le compteur toutes les 5 secondes
    const counterInterval = setInterval(loadApiCounter, 5000);
    
    return () => clearInterval(counterInterval);
  }, []);

  // Fonction pour réinitialiser le cache local
  const handleClearCache = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir vider le cache ? Toutes les données non synchronisées seront perdues.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('notes');
              await AsyncStorage.removeItem('categories');
              await AsyncStorage.removeItem('tasks');
              await AsyncStorage.removeItem('notesLastFetch');
              await AsyncStorage.removeItem('categoriesLastFetch');
              await AsyncStorage.removeItem('tasksLastFetch');
              Alert.alert('Succès', 'Le cache a été vidé avec succès');
            } catch (error) {
              console.error('Erreur lors du vidage du cache:', error);
              Alert.alert('Erreur', 'Impossible de vider le cache');
            }
          },
        },
      ]
    );
  };

  // Fonction pour se déconnecter
  const handleLogout = () => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log("Tentative de déconnexion...");
              await signOut();
              console.log("Déconnexion réussie");
            } catch (error) {
              console.error("Erreur lors de la déconnexion:", error);
              Alert.alert("Erreur", "Un problème est survenu lors de la déconnexion");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={tw.style(`flex-1`, isDark ? 'bg-black' : 'bg-gray-100')}>
      <Stack.Screen
        options={{
          title: 'Paramètres',
          headerStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
          },
          headerTitleStyle: {
            color: isDark ? '#FFFFFF' : '#000000',
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
        }}
      />

      <ScrollView>
        {/* Section Profil */}
        <View
          style={tw.style(
            `m-4 p-4 rounded-lg`,
            isDark ? 'bg-gray-800' : 'bg-white'
          )}
        >
          <Text
            style={tw.style(
              `text-lg font-bold mb-2`,
              isDark ? 'text-white' : 'text-gray-800'
            )}
          >
            Profil
          </Text>

          <View style={tw`flex-row items-center py-2`}>
            <View
              style={tw`w-10 h-10 rounded-full bg-blue-500 justify-center items-center mr-3`}
            >
              <Text style={tw`text-white font-bold text-lg`}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={tw`flex-1`}>
              <Text
                style={tw.style(
                  `font-bold`,
                  isDark ? 'text-white' : 'text-gray-800'
                )}
              >
                {user?.name || 'Utilisateur'}
              </Text>
              <Text
                style={tw.style(
                  `text-sm`,
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                {user?.email || 'email@exemple.com'}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Apparence */}
        <View
          style={tw.style(
            `m-4 p-4 rounded-lg`,
            isDark ? 'bg-gray-800' : 'bg-white'
          )}
        >
          <Text
            style={tw.style(
              `text-lg font-bold mb-2`,
              isDark ? 'text-white' : 'text-gray-800'
            )}
          >
            Apparence
          </Text>

          <View style={tw`flex-row justify-between items-center py-2`}>
            <Text
              style={tw.style(
                `text-base`,
                isDark ? 'text-white' : 'text-gray-800'
              )}
            >
              Thème
            </Text>
            <Text
              style={tw.style(
                `text-base`,
                isDark ? 'text-blue-400' : 'text-blue-600'
              )}
            >
              {isDark ? 'Sombre' : 'Clair'} (Système)
            </Text>
          </View>
        </View>

        {/* Section Synchronisation */}
        <View
          style={tw.style(
            `m-4 p-4 rounded-lg`,
            isDark ? 'bg-gray-800' : 'bg-white'
          )}
        >
          <Text
            style={tw.style(
              `text-lg font-bold mb-2`,
              isDark ? 'text-white' : 'text-gray-800'
            )}
          >
            Synchronisation
          </Text>

          <View style={tw`flex-row justify-between items-center py-2`}>
            <View>
              <Text
                style={tw.style(
                  `text-base`,
                  isDark ? 'text-white' : 'text-gray-800'
                )}
              >
                Synchronisation auto
              </Text>
              <Text
                style={tw.style(
                  `text-xs mt-1`,
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}
              >
                Actualise automatiquement les données toutes les minutes
              </Text>
            </View>
            <Switch
              value={syncEnabled}
              onValueChange={(value) => {
                setSyncEnabled(value);
                AsyncStorage.setItem('syncEnabled', value.toString());
                Alert.alert(
                  value ? 'Synchronisation activée' : 'Synchronisation désactivée',
                  value 
                    ? 'Les données seront actualisées automatiquement.' 
                    : 'Les données ne seront actualisées que manuellement.'
                );
              }}
              trackColor={{ false: '#767577', true: '#3B82F6' }}
              thumbColor={syncEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <View style={tw`flex-row justify-between items-center py-2`}>
            <Text
              style={tw.style(
                `text-base`,
                isDark ? 'text-white' : 'text-gray-800'
              )}
            >
              Requêtes API effectuées
            </Text>
            <Text
              style={tw.style(
                apiCallCount > 8000 ? 'text-red-500' : 'text-green-500',
                'font-bold'
              )}
            >
              {apiCallCount.toLocaleString()} / 10 000
            </Text>
          </View>

          <TouchableOpacity
            style={tw`bg-blue-500 rounded-lg py-2 px-4 my-2`}
            onPress={handleClearCache}
          >
            <Text style={tw`text-white text-center font-bold`}>
              Vider le cache
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Déconnexion */}
        <TouchableOpacity
          style={tw.style(
            `m-4 p-4 rounded-lg flex-row items-center justify-center`,
            'bg-red-500'
          )}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={tw`text-white font-bold ml-2`}>Déconnexion</Text>
        </TouchableOpacity>

        {/* Version de l'application */}
        <Text
          style={tw.style(
            `text-center py-4`,
            isDark ? 'text-gray-500' : 'text-gray-400'
          )}
        >
          KeepNote 
        </Text>
      </ScrollView>
    </View>
  );
}